import { Router, type IRouter } from "express";
import { db, postsTable, profilesTable, likesTable, commentsTable, followsTable, insertPostSchema, insertCommentSchema } from "@workspace/db";
import { and, desc, eq, sql, inArray, lt } from "drizzle-orm";
import { requireAuth, optionalAuth } from "../middlewares/requireAuth";
import { p } from "../lib/params";
import { notify } from "../lib/notify";
import { rateLimit } from "../middlewares/rateLimit";
import { ObjectStorageService, ObjectNotFoundError } from "../lib/objectStorage";

const objectStorage = new ObjectStorageService();

const router: IRouter = Router();

async function hydratePosts(rows: typeof postsTable.$inferSelect[], viewerId?: string) {
  if (rows.length === 0) return [];
  const authorIds = Array.from(new Set(rows.map((r) => r.authorId)));
  const authors = await db.select().from(profilesTable).where(inArray(profilesTable.userId, authorIds));
  const byId = new Map(authors.map((a) => [a.userId, a]));
  let likedSet = new Set<string>();
  if (viewerId) {
    const myLikes = await db
      .select({ postId: likesTable.postId })
      .from(likesTable)
      .where(and(eq(likesTable.userId, viewerId), inArray(likesTable.postId, rows.map((r) => r.id))));
    likedSet = new Set(myLikes.map((l) => l.postId));
  }
  return rows.map((r) => ({ ...r, author: byId.get(r.authorId) ?? null, likedByMe: likedSet.has(r.id) }));
}

router.get("/feed", optionalAuth, async (req, res) => {
  const season = typeof req.query.season === "string" ? req.query.season : null;
  const scope = req.query.scope === "following" ? "following" : "foryou";
  const limit = Math.min(parseInt(String(req.query.limit ?? "30"), 10) || 30, 100);
  // Cursor is only honoured when sorting by createdAt (Following + season-only).
  // For-You uses a composite ranking that doesn't have a stable date cursor —
  // re-ranking on every load is fine for first-page UX, and clients fall back
  // to recency for subsequent pages.
  const rawCursor = typeof req.query.cursor === "string" ? new Date(req.query.cursor) : null;
  const cursor = rawCursor && !isNaN(rawCursor.getTime()) ? rawCursor : null;

  const conds = [];
  if (season) conds.push(eq(postsTable.season, season));
  if (cursor) conds.push(lt(postsTable.createdAt, cursor));

  if (scope === "following") {
    if (!req.userId) {
      res.status(401).json({ error: "Sign in to view your following feed" });
      return;
    }
    const followees = await db
      .select({ id: followsTable.followeeId })
      .from(followsTable)
      .where(eq(followsTable.followerId, req.userId));
    if (followees.length === 0) {
      res.json({ posts: [], nextCursor: null });
      return;
    }
    conds.push(inArray(postsTable.authorId, followees.map((f) => f.id)));
  }

  // For You ranks recent posts by a small engagement boost. Cheap proxy
  // until we have impression data: likes + 2*comments, decayed by recency.
  // Once a cursor is supplied we drop the ranking and switch to recency so
  // pagination stays stable (mirrors TikTok-style "re-rank head, paginate tail").
  const whereClause = conds.length > 0 ? and(...conds) : undefined;
  const rows = scope === "foryou" && !cursor
    ? await db
        .select()
        .from(postsTable)
        .where(whereClause)
        .orderBy(
          desc(sql`(${postsTable.likeCount} + 2 * ${postsTable.commentCount}) - EXTRACT(EPOCH FROM (NOW() - ${postsTable.createdAt})) / 7200`),
          desc(postsTable.createdAt),
        )
        .limit(limit)
    : await db.select().from(postsTable).where(whereClause).orderBy(desc(postsTable.createdAt)).limit(limit);
  const hydrated = await hydratePosts(rows, req.userId);
  const nextCursor = rows.length === limit ? rows[rows.length - 1].createdAt : null;
  res.json({ posts: hydrated, nextCursor });
});

// Quick stats for the LookDetail "X people tried this" widget.
router.get("/looks/:lookId/remix-stats", async (req, res) => {
  const lookId = p(req.params.lookId);
  const [count] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(postsTable)
    .where(eq(postsTable.lookId, lookId));
  const recent = await db
    .select()
    .from(postsTable)
    .where(eq(postsTable.lookId, lookId))
    .orderBy(desc(postsTable.createdAt))
    .limit(6);
  res.json({ count: count?.c ?? 0, recent: await hydratePosts(recent) });
});

router.post("/posts", requireAuth, rateLimit({ scope: "post-create", max: 10, windowMs: 60_000 }), async (req, res) => {
  const parsed = insertPostSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid", details: parsed.error.flatten() });
    return;
  }
  const inserted = await db.insert(postsTable).values({ ...parsed.data, authorId: req.userId! }).returning();
  res.status(201).json(inserted[0]);
});

router.get("/posts/:id", optionalAuth, async (req, res) => {
  const id = p(req.params.id);
  const rows = await db.select().from(postsTable).where(eq(postsTable.id, id)).limit(1);
  if (rows.length === 0) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const [hydrated] = await hydratePosts(rows, req.userId);
  res.json(hydrated);
});

router.delete("/posts/:id", requireAuth, async (req, res) => {
  const id = p(req.params.id);
  const rows = await db.select().from(postsTable).where(eq(postsTable.id, id)).limit(1);
  if (rows.length === 0) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  if (rows[0].authorId !== req.userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  // Best-effort: delete the underlying object so the bucket doesn't grow
  // forever. We tolerate missing objects (already deleted, external URL).
  const imageUrl = rows[0].imageUrl;
  if (imageUrl?.startsWith("/api/storage/objects/") || imageUrl?.startsWith("/objects/")) {
    const objectPath = imageUrl.replace(/^\/api\/storage/, "");
    try {
      const file = await objectStorage.getObjectEntityFile(objectPath);
      await file.delete();
    } catch (e) {
      if (!(e instanceof ObjectNotFoundError)) {
        req.log.warn({ err: e, postId: id }, "Failed to delete object on post delete");
      }
    }
  }
  await db.delete(postsTable).where(eq(postsTable.id, id));
  await db.delete(likesTable).where(eq(likesTable.postId, id));
  await db.delete(commentsTable).where(eq(commentsTable.postId, id));
  res.status(204).end();
});

router.post("/posts/:id/like", requireAuth, rateLimit({ scope: "like", max: 60, windowMs: 60_000 }), async (req, res) => {
  const id = p(req.params.id);
  const existing = await db
    .select()
    .from(likesTable)
    .where(and(eq(likesTable.postId, id), eq(likesTable.userId, req.userId!)))
    .limit(1);
  if (existing.length === 0) {
    // Race-safe: if another request inserted the like between our check and
    // our insert, the unique-on-(postId,userId) onConflictDoNothing prevents
    // a duplicate and the increment is skipped.
    const ins = await db
      .insert(likesTable)
      .values({ postId: id, userId: req.userId! })
      .onConflictDoNothing({ target: [likesTable.postId, likesTable.userId] })
      .returning();
    if (ins.length > 0) {
      await db.update(postsTable).set({ likeCount: sql`${postsTable.likeCount} + 1` }).where(eq(postsTable.id, id));
      const post = await db.select().from(postsTable).where(eq(postsTable.id, id)).limit(1);
      if (post[0]) {
        await notify({
          recipientId: post[0].authorId,
          actorId: req.userId!,
          kind: "like",
          postId: id,
        });
      }
    }
  }
  res.status(204).end();
});

router.delete("/posts/:id/like", requireAuth, async (req, res) => {
  const id = p(req.params.id);
  const deleted = await db
    .delete(likesTable)
    .where(and(eq(likesTable.postId, id), eq(likesTable.userId, req.userId!)))
    .returning();
  if (deleted.length > 0) {
    await db.update(postsTable).set({ likeCount: sql`GREATEST(${postsTable.likeCount} - 1, 0)` }).where(eq(postsTable.id, id));
  }
  res.status(204).end();
});

router.get("/posts/:id/comments", async (req, res) => {
  const id = p(req.params.id);
  const rows = await db.select().from(commentsTable).where(eq(commentsTable.postId, id)).orderBy(desc(commentsTable.createdAt));
  if (rows.length === 0) {
    res.json([]);
    return;
  }
  const authors = await db.select().from(profilesTable).where(inArray(profilesTable.userId, Array.from(new Set(rows.map((r) => r.authorId)))));
  const byId = new Map(authors.map((a) => [a.userId, a]));
  res.json(rows.map((c) => ({ ...c, author: byId.get(c.authorId) ?? null })));
});

router.post("/posts/:id/comments", requireAuth, rateLimit({ scope: "comment", max: 20, windowMs: 60_000 }), async (req, res) => {
  const id = p(req.params.id);
  const parsed = insertCommentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid" });
    return;
  }
  const inserted = await db.insert(commentsTable).values({ postId: id, authorId: req.userId!, body: parsed.data.body }).returning();
  await db.update(postsTable).set({ commentCount: sql`${postsTable.commentCount} + 1` }).where(eq(postsTable.id, id));
  const post = await db.select().from(postsTable).where(eq(postsTable.id, id)).limit(1);
  if (post[0]) {
    await notify({
      recipientId: post[0].authorId,
      actorId: req.userId!,
      kind: "comment",
      postId: id,
      body: parsed.data.body.slice(0, 120),
    });
  }
  res.status(201).json(inserted[0]);
});

router.get("/profiles/:handle/posts", optionalAuth, async (req, res) => {
  const handle = p(req.params.handle);
  const profile = await db.select().from(profilesTable).where(eq(profilesTable.handle, handle)).limit(1);
  if (profile.length === 0) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const rows = await db.select().from(postsTable).where(eq(postsTable.authorId, profile[0].userId)).orderBy(desc(postsTable.createdAt));
  res.json(await hydratePosts(rows, req.userId));
});

export default router;
