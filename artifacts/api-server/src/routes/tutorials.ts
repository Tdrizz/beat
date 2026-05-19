import { Router, type IRouter } from "express";
import {
  db,
  tutorialReviewsTable,
  profilesTable,
  insertTutorialReviewSchema,
  isKnownTutorialId,
} from "@workspace/db";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { requireAuth, optionalAuth } from "../middlewares/requireAuth";
import { rateLimit } from "../middlewares/rateLimit";
import { p } from "../lib/params";

const router: IRouter = Router();

// Aggregated rating stats across every tutorial. Used by the listing page
// so it can sort/badge cards by their average score without N round-trips.
router.get("/tutorials/stats", async (_req, res) => {
  const rows = await db
    .select({
      tutorialId: tutorialReviewsTable.tutorialId,
      avg: sql<number>`COALESCE(AVG(${tutorialReviewsTable.rating}), 0)::float`,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(tutorialReviewsTable)
    .groupBy(tutorialReviewsTable.tutorialId);
  res.json({
    stats: rows.map((r) => ({
      tutorialId: r.tutorialId,
      averageRating: Number(r.avg) || 0,
      reviewCount: r.count,
    })),
  });
});

// Reviews for a single tutorial. Author profiles are hydrated alongside so
// the UI can render the reviewer's display name + avatar in one request.
// If the viewer is signed in, their own review (if any) is returned at the
// top so they can immediately see/edit it.
router.get("/tutorials/:id/reviews", optionalAuth, async (req, res) => {
  const tutorialId = p(req.params.id);
  if (!isKnownTutorialId(tutorialId)) {
    res.status(404).json({ error: "Tutorial not found" });
    return;
  }
  const rows = await db
    .select()
    .from(tutorialReviewsTable)
    .where(eq(tutorialReviewsTable.tutorialId, tutorialId))
    .orderBy(desc(tutorialReviewsTable.createdAt));

  const authorIds = Array.from(new Set(rows.map((r) => r.authorId)));
  const authors = authorIds.length === 0
    ? []
    : await db.select().from(profilesTable).where(inArray(profilesTable.userId, authorIds));
  const byId = new Map(authors.map((a) => [a.userId, a]));

  const enriched = rows.map((r) => ({ ...r, author: byId.get(r.authorId) ?? null }));
  const mine = req.userId ? enriched.find((r) => r.authorId === req.userId) ?? null : null;
  // Surface the viewer's own review at the top so they immediately see/edit
  // it, then the rest in recency order.
  const ordered = mine
    ? [mine, ...enriched.filter((r) => r.authorId !== mine.authorId)]
    : enriched;

  const avg = rows.length === 0
    ? 0
    : rows.reduce((s, r) => s + r.rating, 0) / rows.length;

  res.json({
    averageRating: avg,
    reviewCount: rows.length,
    mine,
    reviews: ordered,
  });
});

// Upsert a review. Authors get a single review slot per tutorial — POSTing
// again replaces it. Rated 1-5 with an optional body. Auth + rate limit
// (30/min) so a single user can't spam the table.
router.post(
  "/tutorials/:id/reviews",
  requireAuth,
  rateLimit({ scope: "tutorial-review", max: 30, windowMs: 60_000 }),
  async (req, res) => {
    const tutorialId = p(req.params.id);
    if (!isKnownTutorialId(tutorialId)) {
      res.status(404).json({ error: "Tutorial not found" });
      return;
    }
    const parsed = insertTutorialReviewSchema.safeParse({
      ...req.body,
      tutorialId,
    });
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid", details: parsed.error.flatten() });
      return;
    }
    const values = {
      tutorialId,
      authorId: req.userId!,
      rating: parsed.data.rating,
      body: parsed.data.body ?? "",
    };
    const inserted = await db
      .insert(tutorialReviewsTable)
      .values(values)
      .onConflictDoUpdate({
        target: [tutorialReviewsTable.tutorialId, tutorialReviewsTable.authorId],
        set: { rating: values.rating, body: values.body, createdAt: new Date() },
      })
      .returning();
    res.status(201).json(inserted[0]);
  },
);

router.delete("/tutorials/:id/reviews/mine", requireAuth, async (req, res) => {
  const tutorialId = p(req.params.id);
  if (!isKnownTutorialId(tutorialId)) {
    res.status(404).json({ error: "Tutorial not found" });
    return;
  }
  await db
    .delete(tutorialReviewsTable)
    .where(
      and(
        eq(tutorialReviewsTable.tutorialId, tutorialId),
        eq(tutorialReviewsTable.authorId, req.userId!),
      ),
    );
  res.status(204).end();
});

export default router;
