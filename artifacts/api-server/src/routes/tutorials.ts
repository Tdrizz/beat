import { Router, type IRouter } from "express";
import {
  db,
  tutorialReviewsTable,
  profilesTable,
  insertTutorialReviewSchema,
  isKnownTutorialId,
  submittedTutorialsTable,
  submitTutorialSchema,
  SUBMITTED_TUTORIAL_STATUSES,
  type SubmittedTutorialStatus,
} from "@workspace/db";
import { and, desc, eq, inArray, or, sql } from "drizzle-orm";
import { z } from "zod/v4";
import { requireAuth, optionalAuth } from "../middlewares/requireAuth";
import { rateLimit } from "../middlewares/rateLimit";
import { isAdmin } from "../lib/admin";
import { p } from "../lib/params";

const moderateSchema = z.object({
  status: z.enum(SUBMITTED_TUTORIAL_STATUSES),
  note: z.string().trim().max(500).optional().nullable(),
});

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

// ---------------------------------------------------------------------------
// Creator submissions
// ---------------------------------------------------------------------------

// Hydrates a list of submitted tutorials with their author profile so the
// UI can render an avatar/handle without a follow-up request.
async function withAuthors<T extends { authorId: string }>(rows: T[]) {
  if (rows.length === 0) return [] as Array<T & { author: typeof profilesTable.$inferSelect | null }>;
  const ids = Array.from(new Set(rows.map((r) => r.authorId)));
  const authors = await db.select().from(profilesTable).where(inArray(profilesTable.userId, ids));
  const byId = new Map(authors.map((a) => [a.userId, a]));
  return rows.map((r) => ({ ...r, author: byId.get(r.authorId) ?? null }));
}

// Public list of approved (published + featured) creator tutorials. Merged
// with the static catalogue on the client.
router.get("/tutorials/submitted", async (_req, res) => {
  const rows = await db
    .select()
    .from(submittedTutorialsTable)
    .where(
      or(
        eq(submittedTutorialsTable.status, "published"),
        eq(submittedTutorialsTable.status, "featured"),
      ),
    )
    .orderBy(desc(submittedTutorialsTable.reviewedAt));
  res.json({ tutorials: await withAuthors(rows) });
});

// Author's own submissions — draft, pending, rejected, etc.
router.get("/tutorials/submitted/mine", requireAuth, async (req, res) => {
  const rows = await db
    .select()
    .from(submittedTutorialsTable)
    .where(eq(submittedTutorialsTable.authorId, req.userId!))
    .orderBy(desc(submittedTutorialsTable.updatedAt));
  res.json({ tutorials: rows });
});

// Moderation queue — pending submissions awaiting review. Admin-only.
router.get("/tutorials/submitted/queue", requireAuth, async (req, res) => {
  if (!isAdmin(req.userId)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const rows = await db
    .select()
    .from(submittedTutorialsTable)
    .where(eq(submittedTutorialsTable.status, "pending"))
    .orderBy(desc(submittedTutorialsTable.submittedAt));
  res.json({ tutorials: await withAuthors(rows) });
});

// Fetch a single submitted tutorial by id. Authors can read their own at
// any status; everyone else can only read published/featured ones; admins
// can read anything.
router.get("/tutorials/submitted/:id", optionalAuth, async (req, res) => {
  const id = p(req.params.id);
  const rows = await db
    .select()
    .from(submittedTutorialsTable)
    .where(eq(submittedTutorialsTable.id, id))
    .limit(1);
  const row = rows[0];
  if (!row) {
    res.status(404).json({ error: "Tutorial not found" });
    return;
  }
  const isOwner = req.userId && row.authorId === req.userId;
  const isPublic = row.status === "published" || row.status === "featured";
  if (!isPublic && !isOwner && !isAdmin(req.userId)) {
    res.status(404).json({ error: "Tutorial not found" });
    return;
  }
  const [hydrated] = await withAuthors([row]);
  res.json(hydrated);
});

// Create a new draft. Rate-limited so a single account can't pile up
// hundreds of half-finished drafts.
router.post(
  "/tutorials/submitted",
  requireAuth,
  rateLimit({ scope: "tutorial-submit-create", max: 10, windowMs: 60 * 60_000 }),
  async (req, res) => {
    const parsed = submitTutorialSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid", details: parsed.error.flatten() });
      return;
    }
    const inserted = await db
      .insert(submittedTutorialsTable)
      .values({
        authorId: req.userId!,
        title: parsed.data.title,
        category: parsed.data.category,
        difficulty: parsed.data.difficulty,
        minutes: parsed.data.minutes,
        thumbnail: parsed.data.thumbnail,
        summary: parsed.data.summary,
        tools: parsed.data.tools,
        steps: parsed.data.steps,
        proTip: parsed.data.proTip ?? null,
        status: "draft",
      })
      .returning();
    res.status(201).json(inserted[0]);
  },
);

// Update an existing draft (or rejected) tutorial. Authors cannot edit
// while their tutorial is in `pending` or already approved.
router.put("/tutorials/submitted/:id", requireAuth, async (req, res) => {
  const id = p(req.params.id);
  const parsed = submitTutorialSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid", details: parsed.error.flatten() });
    return;
  }
  const existing = await db
    .select()
    .from(submittedTutorialsTable)
    .where(eq(submittedTutorialsTable.id, id))
    .limit(1);
  const row = existing[0];
  if (!row) {
    res.status(404).json({ error: "Tutorial not found" });
    return;
  }
  if (row.authorId !== req.userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  if (row.status !== "draft" && row.status !== "rejected") {
    res.status(409).json({ error: "Can't edit while under review or after approval" });
    return;
  }
  const updated = await db
    .update(submittedTutorialsTable)
    .set({
      title: parsed.data.title,
      category: parsed.data.category,
      difficulty: parsed.data.difficulty,
      minutes: parsed.data.minutes,
      thumbnail: parsed.data.thumbnail,
      summary: parsed.data.summary,
      tools: parsed.data.tools,
      steps: parsed.data.steps,
      proTip: parsed.data.proTip ?? null,
      updatedAt: new Date(),
    })
    .where(eq(submittedTutorialsTable.id, id))
    .returning();
  res.json(updated[0]);
});

// Move a draft (or rejected) submission into the moderation queue.
router.post("/tutorials/submitted/:id/submit", requireAuth, async (req, res) => {
  const id = p(req.params.id);
  const existing = await db
    .select()
    .from(submittedTutorialsTable)
    .where(eq(submittedTutorialsTable.id, id))
    .limit(1);
  const row = existing[0];
  if (!row) {
    res.status(404).json({ error: "Tutorial not found" });
    return;
  }
  if (row.authorId !== req.userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  if (row.status !== "draft" && row.status !== "rejected") {
    res.status(409).json({ error: "Already submitted or published" });
    return;
  }
  // Re-validate at submit time — a draft could have been created before we
  // tightened the Zod schema, or could be missing required fields.
  const parsed = submitTutorialSchema.safeParse({
    title: row.title,
    category: row.category,
    difficulty: row.difficulty,
    minutes: row.minutes,
    thumbnail: row.thumbnail,
    summary: row.summary,
    tools: row.tools,
    steps: row.steps,
    proTip: row.proTip,
  });
  if (!parsed.success) {
    res.status(400).json({ error: "Tutorial is incomplete", details: parsed.error.flatten() });
    return;
  }
  const updated = await db
    .update(submittedTutorialsTable)
    .set({
      status: "pending",
      moderationNote: null,
      submittedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(submittedTutorialsTable.id, id))
    .returning();
  res.json(updated[0]);
});

// Author can delete their own submission as long as it isn't approved.
// Approved tutorials must be taken down by an admin (status → rejected).
router.delete("/tutorials/submitted/:id", requireAuth, async (req, res) => {
  const id = p(req.params.id);
  const existing = await db
    .select()
    .from(submittedTutorialsTable)
    .where(eq(submittedTutorialsTable.id, id))
    .limit(1);
  const row = existing[0];
  if (!row) {
    res.status(404).end();
    return;
  }
  const canDelete = row.authorId === req.userId || isAdmin(req.userId);
  if (!canDelete) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  if (
    (row.status === "published" || row.status === "featured") &&
    !isAdmin(req.userId)
  ) {
    res.status(409).json({ error: "Approved tutorials can only be removed by a moderator" });
    return;
  }
  await db.delete(submittedTutorialsTable).where(eq(submittedTutorialsTable.id, id));
  res.status(204).end();
});

// Admin moderation action — sets the next status (published, featured, or
// rejected) and optionally records a note shown back to the author.
router.post("/tutorials/submitted/:id/moderate", requireAuth, async (req, res) => {
  if (!isAdmin(req.userId)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const parsed = moderateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid", details: parsed.error.flatten() });
    return;
  }
  const nextStatus = parsed.data.status as SubmittedTutorialStatus;
  // Only meaningful terminal transitions are allowed from the queue UI.
  if (!["published", "featured", "rejected"].includes(nextStatus)) {
    res.status(400).json({ error: "Invalid target status" });
    return;
  }
  const id = p(req.params.id);
  const updated = await db
    .update(submittedTutorialsTable)
    .set({
      status: nextStatus,
      moderationNote: parsed.data.note ?? null,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(submittedTutorialsTable.id, id))
    .returning();
  if (updated.length === 0) {
    res.status(404).json({ error: "Tutorial not found" });
    return;
  }
  res.json(updated[0]);
});

// Tells the frontend whether the current viewer can see the moderation UI.
router.get("/tutorials/me/admin", optionalAuth, (req, res) => {
  res.json({ isAdmin: isAdmin(req.userId) });
});

// ---------------------------------------------------------------------------
// Reviews (curated + submitted both use the same review table, keyed by id)
// ---------------------------------------------------------------------------

// Reviews for a single tutorial. Author profiles are hydrated alongside so
// the UI can render the reviewer's display name + avatar in one request.
// If the viewer is signed in, their own review (if any) is returned at the
// top so they can immediately see/edit it.
router.get("/tutorials/:id/reviews", optionalAuth, async (req, res) => {
  const tutorialId = p(req.params.id);
  if (!(await isValidReviewableId(tutorialId))) {
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
    if (!(await isValidReviewableId(tutorialId))) {
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
  if (!(await isValidReviewableId(tutorialId))) {
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

// A tutorial id is reviewable if it's either in the curated catalogue or
// it's an approved (published/featured) submitted tutorial. Used by every
// review route so orphan rows can't accumulate for tutorials that were
// never shipped.
async function isValidReviewableId(id: string): Promise<boolean> {
  if (isKnownTutorialId(id)) return true;
  // Submitted tutorial ids are UUIDs — cheap quick reject to avoid hitting
  // the DB for obvious garbage.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return false;
  }
  const rows = await db
    .select({ status: submittedTutorialsTable.status })
    .from(submittedTutorialsTable)
    .where(eq(submittedTutorialsTable.id, id))
    .limit(1);
  const row = rows[0];
  return !!row && (row.status === "published" || row.status === "featured");
}

export default router;
