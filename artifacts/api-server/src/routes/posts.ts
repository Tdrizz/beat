import { Router, type IRouter } from "express";
import { db, postsTable, profilesTable, likesTable, commentsTable, insertPostSchema, insertCommentSchema } from "@workspace/db";
import { and, desc, eq, sql, inArray } from "drizzle-orm";
import { requireAuth, optionalAuth } from "../middlewares/requireAuth";
import { p } from "../lib/params";

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
  const limit = Math.min(parseInt(String(req.query.limit ?? "30"), 10) || 30, 100);
  const rows = season
    ? await db.select().from(postsTable).where(eq(postsTable.season, season)).orderBy(desc(postsTable.createdAt)).limit(limit)
    : await db.select().from(postsTable).orderBy(desc(postsTable.createdAt)).limit(limit);
  res.json(await hydratePosts(rows, req.userId));
});

router.post("/posts", requireAuth, async (req, res) => {
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
  await db.delete(postsTable).where(eq(postsTable.id, id));
  res.status(204).end();
});

router.post("/posts/:id/like", requireAuth, async (req, res) => {
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

router.post("/posts/:id/comments", requireAuth, async (req, res) => {
  const id = p(req.params.id);
  const parsed = insertCommentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid" });
    return;
  }
  const inserted = await db.insert(commentsTable).values({ postId: id, authorId: req.userId!, body: parsed.data.body }).returning();
  await db.update(postsTable).set({ commentCount: sql`${postsTable.commentCount} + 1` }).where(eq(postsTable.id, id));
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
