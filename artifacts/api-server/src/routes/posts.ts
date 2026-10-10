import { Router, type IRouter } from "express";
import { db, postsTable, profilesTable, likesTable, commentsTable, followsTable, insertPostSchema, insertCommentSchema, ARCHETYPE_IDS, type ArchetypeId } from "@workspace/db";
import { and, desc, eq, sql, inArray, lt, or, ilike, notInArray } from "drizzle-orm";
import { requireAuth, optionalAuth } from "../middlewares/requireAuth";
import { p } from "../lib/params";
import { notify } from "../lib/notify";
import { rateLimit } from "../middlewares/rateLimit";
import { ObjectStorageService, ObjectNotFoundError } from "../lib/objectStorage";
import { getObjectAclPolicy } from "../lib/objectAcl";
import { ARCHETYPE_MOOD_MATCHERS, ARCHETYPE_CHALLENGES, postMatchesArchetype } from "../lib/archetypeMatch";
import { publicProfileOrNull } from "../lib/publicProfile";
import { hiddenUserIds, isBlockedEitherWay } from "../lib/blocks";

const objectStorage = new ObjectStorageService();
const MAX_POST_IMAGE_BYTES = 15 * 1024 * 1024;

// Posts may only reference images the author uploaded and finalized as
// public. Accepts "/objects/<key>" or the served "/api/storage/objects/<key>"
// form. Anything else (external URLs, other users' objects, private
// uploads) is rejected so a post can't hotlink or later delete someone
// else's file.
async function validatePostImage(
  imageUrl: string,
  userId: string,
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const objectPath = imageUrl.replace(/^\/api\/storage(?=\/objects\/)/, "");
  if (!objectPath.startsWith("/objects/")) {
    return { ok: false, status: 400, error: "Upload the image first" };
  }
  try {
    const file = await objectStorage.getObjectEntityFile(objectPath);
    const policy = await getObjectAclPolicy(objectPath);
    if (!policy || policy.owner !== userId) {
      return { ok: false, status: 403, error: "You can only post images you uploaded" };
    }
    if (policy.visibility !== "public") {
      return { ok: false, status: 400, error: "The image must be finalized as public" };
    }
    const metadata = await file.getMetadata();
    if (!metadata.contentType.startsWith("image/")) {
      return { ok: false, status: 400, error: "The post must be an image" };
    }
    if (metadata.size > MAX_POST_IMAGE_BYTES) {
      return { ok: false, status: 400, error: "The image is too large (max 15 MB)" };
    }
    return { ok: true };
  } catch (e) {
    if (e instanceof ObjectNotFoundError) {
      return { ok: false, status: 400, error: "Uploaded image not found" };
    }
    throw e;
  }
}

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
  return rows.map((r) => ({ ...r, author: publicProfileOrNull(byId.get(r.authorId) ?? null), likedByMe: likedSet.has(r.id) }));
}

router.get("/feed", optionalAuth, async (req, res) => {
  const season = typeof req.query.season === "string" ? req.query.season : null;
  const rawScope = String(req.query.scope ?? "foryou");
  const scope: "foryou" | "following" | "iola" =
    rawScope === "following" ? "following" : rawScope === "iola" ? "iola" : "foryou";
  const limit = Math.min(parseInt(String(req.query.limit ?? "30"), 10) || 30, 100);
  // Cursor is only honoured when sorting by createdAt (Following + season-only).
  // For-You uses a composite ranking that doesn't have a stable date cursor —
  // re-ranking on every load is fine for first-page UX, and clients fall back
  // to recency for subsequent pages.
  const rawCursor = typeof req.query.cursor === "string" ? new Date(req.query.cursor) : null;
  const cursor = rawCursor && !isNaN(rawCursor.getTime()) ? rawCursor : null;

  const conds = [];
  // Hide posts from anyone the viewer blocked or who blocked the viewer.
  const hidden = await hiddenUserIds(req.userId);
  if (hidden.size > 0) conds.push(notInArray(postsTable.authorId, [...hidden]));
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

  // Iola scope — match posts whose `mood` contains one of the viewer's
  // archetype matcher substrings. Falls back gracefully when the viewer
  // hasn't taken the quiz / has no profile (returns recent posts).
  let iolaArchetype: ArchetypeId | null = null;
  if (scope === "iola") {
    // Prefer the server-side archetype on the viewer's profile; fall back
    // to a `?archetype=` query param so signed-out users can still browse
    // a personalised feed straight after taking the quiz.
    if (req.userId) {
      const me = await db.select({ a: profilesTable.archetype }).from(profilesTable).where(eq(profilesTable.userId, req.userId)).limit(1);
      const a = me[0]?.a as ArchetypeId | null | undefined;
      if (a && (ARCHETYPE_IDS as readonly string[]).includes(a)) iolaArchetype = a;
    }
    if (!iolaArchetype) {
      const q = typeof req.query.archetype === "string" ? req.query.archetype : "";
      if ((ARCHETYPE_IDS as readonly string[]).includes(q)) iolaArchetype = q as ArchetypeId;
    }
    if (iolaArchetype) {
      const matchers = ARCHETYPE_MOOD_MATCHERS[iolaArchetype];
      // SQL ILIKE OR — small N (~6) so this is a cheap predicate. We do
      // NOT push a hard filter that would empty the feed for fresh users:
      // matched posts surface first via ranking, others still appear.
      const moodOr = or(...matchers.map((kw) => ilike(postsTable.mood, `%${kw}%`)));
      if (moodOr) conds.push(moodOr);
    }
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
router.get("/looks/:lookId/remix-stats", optionalAuth, async (req, res) => {
  const lookId = p(req.params.lookId);
  const hidden = await hiddenUserIds(req.userId);
  const [count] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(postsTable)
    .where(eq(postsTable.lookId, lookId));
  const recent = await db
    .select()
    .from(postsTable)
    .where(
      hidden.size > 0
        ? and(eq(postsTable.lookId, lookId), notInArray(postsTable.authorId, [...hidden]))
        : eq(postsTable.lookId, lookId),
    )
    .orderBy(desc(postsTable.createdAt))
    .limit(6);
  res.json({ count: count?.c ?? 0, recent: await hydratePosts(recent, req.userId) });
});

router.post("/posts", requireAuth, rateLimit({ scope: "post-create", max: 10, windowMs: 60_000 }), async (req, res) => {
  const parsed = insertPostSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid", details: parsed.error.flatten() });
    return;
  }
  const imageCheck = await validatePostImage(parsed.data.imageUrl, req.userId!);
  if (!imageCheck.ok) {
    res.status(imageCheck.status).json({ error: imageCheck.error });
    return;
  }
  const inserted = await db.insert(postsTable).values({ ...parsed.data, authorId: req.userId! }).returning();
  // Cross-pollinate: notify followers whose archetype matches this post's
  // mood. Best-effort, capped to 50 to keep it cheap; ignored if author
  // has no followers or post has no mood.
  const newPost = inserted[0];
  if (newPost?.mood) {
    try {
      const followers = await db
        .select({ id: followsTable.followerId, a: profilesTable.archetype })
        .from(followsTable)
        .innerJoin(profilesTable, eq(profilesTable.userId, followsTable.followerId))
        .where(eq(followsTable.followeeId, req.userId!))
        .limit(50);
      // Fan out in parallel — notify() already swallows its own errors and
      // we cap N at 50, so Promise.allSettled keeps the post-create latency
      // bounded by the slowest insert rather than their sum.
      await Promise.allSettled(
        followers
          .filter((f) => {
            const a = f.a as ArchetypeId | null;
            return a && postMatchesArchetype(newPost.mood, a);
          })
          .map((f) => notify({ recipientId: f.id, actorId: req.userId!, kind: "match", postId: newPost.id })),
      );
    } catch (e) {
      req.log.warn({ err: e }, "Archetype match notify failed");
    }
  }
  res.status(201).json(newPost);
});

// Weekly archetype challenge — pure function of the current ISO week so
// every viewer of the same archetype sees the same prompt all week. No DB
// row needed; we just key the copy off the week number to add variation.
router.get("/archetype/challenge", optionalAuth, async (req, res) => {
  const a = typeof req.query.archetype === "string" ? req.query.archetype : "";
  if (!(ARCHETYPE_IDS as readonly string[]).includes(a)) {
    res.status(400).json({ error: "Invalid archetype" });
    return;
  }
  const challenge = ARCHETYPE_CHALLENGES[a as ArchetypeId];
  // ISO week number (Mon-anchored) — 1-53. Used so the headline rotates
  // between two variants per archetype as we add more.
  const now = new Date();
  const start = Date.UTC(now.getUTCFullYear(), 0, 1);
  const days = Math.floor((now.getTime() - start) / 86400000);
  const week = Math.floor((days + new Date(start).getUTCDay()) / 7) + 1;
  // End of the current ISO week (Sunday 23:59:59Z) — close enough for a
  // "ends in N days" countdown on the client.
  const dayOfWeek = (now.getUTCDay() + 6) % 7; // Mon=0
  const endsAt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + (6 - dayOfWeek), 23, 59, 59));
  res.json({ archetype: a, week, headline: challenge.headline, body: challenge.body, endsAt: endsAt.toISOString() });
});

router.get("/posts/:id", optionalAuth, async (req, res) => {
  const id = p(req.params.id);
  const rows = await db.select().from(postsTable).where(eq(postsTable.id, id)).limit(1);
  if (rows.length === 0 || (req.userId && (await isBlockedEitherWay(req.userId, rows[0].authorId)))) {
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
      // Only remove the file if the post's author owns it; a post must
      // never be a handle for deleting someone else's upload.
      const policy = await getObjectAclPolicy(objectPath);
      if (policy?.owner === rows[0].authorId) {
        const file = await objectStorage.getObjectEntityFile(objectPath);
        await file.delete();
      }
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
  const [target] = await db.select({ authorId: postsTable.authorId }).from(postsTable).where(eq(postsTable.id, id)).limit(1);
  if (!target || (await isBlockedEitherWay(req.userId!, target.authorId))) {
    res.status(404).json({ error: "Not found" });
    return;
  }
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

router.get("/posts/:id/comments", optionalAuth, async (req, res) => {
  const id = p(req.params.id);
  const hidden = await hiddenUserIds(req.userId);
  const rows = (await db.select().from(commentsTable).where(eq(commentsTable.postId, id)).orderBy(desc(commentsTable.createdAt)))
    .filter((c) => !hidden.has(c.authorId));
  if (rows.length === 0) {
    res.json([]);
    return;
  }
  const authors = await db.select().from(profilesTable).where(inArray(profilesTable.userId, Array.from(new Set(rows.map((r) => r.authorId)))));
  const byId = new Map(authors.map((a) => [a.userId, a]));
  res.json(rows.map((c) => ({ ...c, author: publicProfileOrNull(byId.get(c.authorId) ?? null) })));
});

router.post("/posts/:id/comments", requireAuth, rateLimit({ scope: "comment", max: 20, windowMs: 60_000 }), async (req, res) => {
  const id = p(req.params.id);
  const parsed = insertCommentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid" });
    return;
  }
  const post = await db.select().from(postsTable).where(eq(postsTable.id, id)).limit(1);
  if (!post[0] || (await isBlockedEitherWay(req.userId!, post[0].authorId))) {
    res.status(404).json({ error: "Post not found" });
    return;
  }
  const inserted = await db.insert(commentsTable).values({ postId: id, authorId: req.userId!, body: parsed.data.body }).returning();
  await db.update(postsTable).set({ commentCount: sql`${postsTable.commentCount} + 1` }).where(eq(postsTable.id, id));
  await notify({
    recipientId: post[0].authorId,
    actorId: req.userId!,
    kind: "comment",
    postId: id,
    body: parsed.data.body.slice(0, 120),
  });
  res.status(201).json(inserted[0]);
});

router.delete("/posts/:id/comments/:commentId", requireAuth, async (req, res) => {
  const postId = p(req.params.id);
  const commentId = p(req.params.commentId);
  const rows = await db
    .select()
    .from(commentsTable)
    .where(and(eq(commentsTable.id, commentId), eq(commentsTable.postId, postId)))
    .limit(1);
  if (rows.length === 0) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  // Only the comment's author or the post's author may delete a comment.
  let canDelete = rows[0].authorId === req.userId;
  if (!canDelete) {
    const post = await db
      .select({ authorId: postsTable.authorId })
      .from(postsTable)
      .where(eq(postsTable.id, postId))
      .limit(1);
    canDelete = post[0]?.authorId === req.userId;
  }
  if (!canDelete) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  await db.delete(commentsTable).where(eq(commentsTable.id, commentId));
  // GREATEST guards against the counter ever going negative if a count drifts.
  await db
    .update(postsTable)
    .set({ commentCount: sql`GREATEST(${postsTable.commentCount} - 1, 0)` })
    .where(eq(postsTable.id, postId));
  res.status(204).end();
});

router.get("/profiles/:handle/posts", optionalAuth, async (req, res) => {
  const handle = p(req.params.handle);
  const profile = await db.select().from(profilesTable).where(eq(profilesTable.handle, handle)).limit(1);
  if (profile.length === 0) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  if (req.userId && (await isBlockedEitherWay(req.userId, profile[0].userId))) {
    res.json([]);
    return;
  }
  const rows = await db.select().from(postsTable).where(eq(postsTable.authorId, profile[0].userId)).orderBy(desc(postsTable.createdAt));
  res.json(await hydratePosts(rows, req.userId));
});

export default router;
