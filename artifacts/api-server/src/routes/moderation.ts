import { Router, type IRouter, type NextFunction, type Request, type Response } from "express";
import { and, desc, eq, inArray, or, sql } from "drizzle-orm";
import { clerkClient } from "@clerk/express";
import {
  db,
  commentsTable,
  conversationsTable,
  followsTable,
  messagesTable,
  postsTable,
  profilesTable,
  reportsTable,
  userBlocksTable,
  createReportSchema,
  resolveReportSchema,
  REPORT_STATUSES,
  type ReportStatus,
  type ReportTargetType,
} from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";
import { rateLimit } from "../middlewares/rateLimit";
import { isAdmin } from "../lib/admin";
import { p } from "../lib/params";
import { publicProfileOrNull } from "../lib/publicProfile";
import { ObjectStorageService, ObjectNotFoundError } from "../lib/objectStorage";
import { getObjectAclPolicy } from "../lib/objectAcl";

const router: IRouter = Router();
const objectStorage = new ObjectStorageService();
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* ── Blocking ─────────────────────────────────────────────────────────── */

router.get("/blocks", requireAuth, async (req, res) => {
  const rows = await db
    .select()
    .from(userBlocksTable)
    .where(eq(userBlocksTable.blockerId, req.userId!))
    .orderBy(desc(userBlocksTable.createdAt));
  const ids = rows.map((r) => r.blockedId);
  const profiles = ids.length
    ? await db.select().from(profilesTable).where(inArray(profilesTable.userId, ids))
    : [];
  const byId = new Map(profiles.map((pr) => [pr.userId, pr]));
  res.json({
    blocks: rows.map((r) => ({
      userId: r.blockedId,
      blockedAt: r.createdAt,
      profile: publicProfileOrNull(byId.get(r.blockedId) ?? null),
    })),
  });
});

router.post("/blocks/:userId", requireAuth, rateLimit({ scope: "block", max: 30, windowMs: 60_000 }), async (req, res) => {
  const target = p(req.params.userId);
  if (target === req.userId) {
    res.status(400).json({ error: "You can't block yourself" });
    return;
  }
  const exists = await db.select({ id: profilesTable.userId }).from(profilesTable).where(eq(profilesTable.userId, target)).limit(1);
  if (exists.length === 0) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  await db
    .insert(userBlocksTable)
    .values({ blockerId: req.userId!, blockedId: target })
    .onConflictDoNothing({ target: [userBlocksTable.blockerId, userBlocksTable.blockedId] });
  // Blocking ends any follow relationship in both directions.
  await db
    .delete(followsTable)
    .where(
      or(
        and(eq(followsTable.followerId, req.userId!), eq(followsTable.followeeId, target)),
        and(eq(followsTable.followerId, target), eq(followsTable.followeeId, req.userId!)),
      ),
    );
  res.status(204).end();
});

router.delete("/blocks/:userId", requireAuth, async (req, res) => {
  await db
    .delete(userBlocksTable)
    .where(and(eq(userBlocksTable.blockerId, req.userId!), eq(userBlocksTable.blockedId, p(req.params.userId))));
  res.status(204).end();
});

/* ── Reporting ────────────────────────────────────────────────────────── */

interface ResolvedTarget {
  targetUserId: string;
  snapshot: Record<string, unknown>;
}

// Look up the reported item, confirm the reporter may see it, and capture
// a snapshot for moderators. Returns null when it doesn't exist (or isn't
// visible to the reporter).
async function resolveTarget(type: ReportTargetType, id: string, reporterId: string): Promise<ResolvedTarget | null> {
  if (type === "user") {
    const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.userId, id)).limit(1);
    if (!profile) return null;
    return {
      targetUserId: profile.userId,
      snapshot: { handle: profile.handle, displayName: profile.displayName, bio: profile.bio, avatarUrl: profile.avatarUrl },
    };
  }
  if (!UUID_RE.test(id)) return null;
  if (type === "post") {
    const [post] = await db.select().from(postsTable).where(eq(postsTable.id, id)).limit(1);
    if (!post) return null;
    return { targetUserId: post.authorId, snapshot: { caption: post.caption, imageUrl: post.imageUrl, createdAt: post.createdAt } };
  }
  if (type === "comment") {
    const [comment] = await db.select().from(commentsTable).where(eq(commentsTable.id, id)).limit(1);
    if (!comment) return null;
    return { targetUserId: comment.authorId, snapshot: { body: comment.body, postId: comment.postId, createdAt: comment.createdAt } };
  }
  // Messages: only a participant in the conversation can report one.
  const [row] = await db
    .select({ message: messagesTable, conv: conversationsTable })
    .from(messagesTable)
    .innerJoin(conversationsTable, eq(conversationsTable.id, messagesTable.conversationId))
    .where(eq(messagesTable.id, id))
    .limit(1);
  if (!row || (row.conv.userA !== reporterId && row.conv.userB !== reporterId)) return null;
  return {
    targetUserId: row.message.senderId,
    snapshot: {
      body: row.message.body,
      hasImage: !!row.message.imageUrl,
      conversationId: row.message.conversationId,
      createdAt: row.message.createdAt,
    },
  };
}

router.post("/reports", requireAuth, rateLimit({ scope: "report", max: 20, windowMs: 60 * 60_000 }), async (req, res) => {
  const parsed = createReportSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid report", details: parsed.error.flatten() });
    return;
  }
  const { targetType, targetId, reason, details } = parsed.data;
  const target = await resolveTarget(targetType, targetId, req.userId!);
  if (!target) {
    res.status(404).json({ error: "That content no longer exists" });
    return;
  }
  if (target.targetUserId === req.userId) {
    res.status(400).json({ error: "You can't report your own content" });
    return;
  }
  await db
    .insert(reportsTable)
    .values({
      reporterId: req.userId!,
      targetType,
      targetId,
      targetUserId: target.targetUserId,
      reason,
      details: details ?? "",
      snapshot: target.snapshot,
    })
    .onConflictDoNothing({ target: [reportsTable.reporterId, reportsTable.targetType, reportsTable.targetId] });
  res.status(201).json({ ok: true });
});

/* ── Admin queue (ADMIN_USER_IDS) ─────────────────────────────────────── */

router.get("/admin/me", requireAuth, (req, res) => {
  res.json({ isAdmin: isAdmin(req.userId) });
});

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!isAdmin(req.userId)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
}

router.get("/admin/reports", requireAuth, requireAdmin, async (req, res) => {
  const rawStatus = String(req.query.status ?? "open");
  const status: ReportStatus = (REPORT_STATUSES as readonly string[]).includes(rawStatus) ? (rawStatus as ReportStatus) : "open";
  const rows = await db
    .select()
    .from(reportsTable)
    .where(eq(reportsTable.status, status))
    .orderBy(status === "open" ? reportsTable.createdAt : desc(reportsTable.resolvedAt))
    .limit(200);
  const userIds = Array.from(new Set(rows.flatMap((r) => [r.reporterId, r.targetUserId])));
  const profiles = userIds.length
    ? await db.select().from(profilesTable).where(inArray(profilesTable.userId, userIds))
    : [];
  const byId = new Map(profiles.map((pr) => [pr.userId, pr]));
  // How many open reports each target user has, to surface repeat offenders.
  const targetIds = Array.from(new Set(rows.map((r) => r.targetUserId)));
  const counts = targetIds.length
    ? await db
        .select({ userId: reportsTable.targetUserId, n: sql<number>`count(*)::int` })
        .from(reportsTable)
        .where(and(inArray(reportsTable.targetUserId, targetIds), eq(reportsTable.status, "open")))
        .groupBy(reportsTable.targetUserId)
    : [];
  const countById = new Map(counts.map((c) => [c.userId, c.n]));
  res.json({
    reports: rows.map((r) => ({
      ...r,
      reporter: publicProfileOrNull(byId.get(r.reporterId) ?? null),
      targetUser: publicProfileOrNull(byId.get(r.targetUserId) ?? null),
      openReportsAgainstUser: countById.get(r.targetUserId) ?? 0,
    })),
  });
});

async function deleteObjectIfOwned(path: string | null | undefined, ownerId: string) {
  if (!path) return;
  const objectPath = path.replace(/^\/api\/storage(?=\/objects\/)/, "");
  if (!objectPath.startsWith("/objects/")) return;
  try {
    if ((await getObjectAclPolicy(objectPath))?.owner !== ownerId) return;
    await (await objectStorage.getObjectEntityFile(objectPath)).delete();
  } catch (e) {
    if (!(e instanceof ObjectNotFoundError)) throw e;
  }
}

// Remove the reported item. Returns false if it was already gone.
async function removeContent(type: ReportTargetType, id: string): Promise<boolean> {
  if (type === "post") {
    const [post] = await db.delete(postsTable).where(eq(postsTable.id, id)).returning();
    if (!post) return false;
    await db.delete(commentsTable).where(eq(commentsTable.postId, id));
    await deleteObjectIfOwned(post.imageUrl, post.authorId);
    return true;
  }
  if (type === "comment") {
    const [comment] = await db.delete(commentsTable).where(eq(commentsTable.id, id)).returning();
    if (!comment) return false;
    await db
      .update(postsTable)
      .set({ commentCount: sql`GREATEST(${postsTable.commentCount} - 1, 0)` })
      .where(eq(postsTable.id, comment.postId));
    return true;
  }
  if (type === "message") {
    const [message] = await db.delete(messagesTable).where(eq(messagesTable.id, id)).returning();
    if (!message) return false;
    await deleteObjectIfOwned(message.imageUrl, message.senderId);
    return true;
  }
  return false;
}

router.post("/admin/reports/:id/resolve", requireAuth, requireAdmin, async (req, res) => {
  const id = p(req.params.id);
  const parsed = resolveReportSchema.safeParse(req.body);
  if (!parsed.success || !UUID_RE.test(id)) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const [report] = await db.select().from(reportsTable).where(eq(reportsTable.id, id)).limit(1);
  if (!report) {
    res.status(404).json({ error: "Report not found" });
    return;
  }
  const { action, note } = parsed.data;
  if (action === "remove_content") {
    if (report.targetType === "user") {
      res.status(400).json({ error: "Use ban_user for account reports" });
      return;
    }
    await removeContent(report.targetType, report.targetId);
  }
  if (action === "ban_user") {
    if (isAdmin(report.targetUserId)) {
      res.status(400).json({ error: "Admins can't be banned from the queue" });
      return;
    }
    // A Clerk ban signs the user out everywhere and blocks future sign-ins.
    await clerkClient.users.banUser(report.targetUserId);
  }
  const status: ReportStatus = action === "dismiss" ? "dismissed" : "actioned";
  const resolution = {
    status,
    resolvedBy: req.userId!,
    resolvedAt: new Date(),
    resolutionNote: [action, note].filter(Boolean).join(": "),
  };
  // Resolving one report closes every open report about the same item.
  await db
    .update(reportsTable)
    .set(resolution)
    .where(
      and(
        eq(reportsTable.status, "open"),
        action === "ban_user"
          ? eq(reportsTable.targetUserId, report.targetUserId)
          : and(eq(reportsTable.targetType, report.targetType), eq(reportsTable.targetId, report.targetId)),
      ),
    );
  if (report.status !== "open") {
    await db.update(reportsTable).set(resolution).where(eq(reportsTable.id, id));
  }
  res.json({ ok: true, status });
});

export default router;
