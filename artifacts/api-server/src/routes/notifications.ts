import { Router, type IRouter } from "express";
import { db, notificationsTable, profilesTable } from "@workspace/db";
import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { publicProfileOrNull } from "../lib/publicProfile";
import { hiddenUserIds } from "../lib/blocks";

const router: IRouter = Router();

router.get("/notifications", requireAuth, async (req, res) => {
  const me = req.userId!;
  const limit = Math.min(parseInt(String(req.query.limit ?? "30"), 10) || 30, 100);
  const rawBefore = typeof req.query.before === "string" ? new Date(req.query.before) : null;
  const before = rawBefore && !isNaN(rawBefore.getTime()) ? rawBefore : null;
  const where = before
    ? and(eq(notificationsTable.recipientId, me), sql`${notificationsTable.createdAt} < ${before}`)
    : eq(notificationsTable.recipientId, me);
  const allRows = await db
    .select()
    .from(notificationsTable)
    .where(where)
    .orderBy(desc(notificationsTable.createdAt))
    .limit(limit);
  const hidden = await hiddenUserIds(me);
  const rows = allRows.filter((r) => !r.actorId || !hidden.has(r.actorId));
  if (rows.length === 0) {
    res.json([]);
    return;
  }
  const actorIds = Array.from(
    new Set(rows.map((r) => r.actorId).filter((x): x is string => !!x)),
  );
  const actors = actorIds.length === 0
    ? []
    : await db.select().from(profilesTable).where(inArray(profilesTable.userId, actorIds));
  const byId = new Map(actors.map((a) => [a.userId, a]));
  res.json(rows.map((r) => ({ ...r, actor: r.actorId ? publicProfileOrNull(byId.get(r.actorId) ?? null) : null })));
});

router.get("/notifications/unread-count", requireAuth, async (req, res) => {
  const [row] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(notificationsTable)
    .where(and(eq(notificationsTable.recipientId, req.userId!), isNull(notificationsTable.readAt)));
  res.json({ count: row?.c ?? 0 });
});

router.post("/notifications/mark-all-read", requireAuth, async (req, res) => {
  await db
    .update(notificationsTable)
    .set({ readAt: new Date() })
    .where(and(eq(notificationsTable.recipientId, req.userId!), isNull(notificationsTable.readAt)));
  res.status(204).end();
});

export default router;
