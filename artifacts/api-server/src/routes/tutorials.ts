import { Router, type IRouter } from "express";
import {
  db,
  tutorialReviewsTable,
  tutorialBookmarksTable,
  tutorialStepVideosTable,
  profilesTable,
  insertTutorialReviewSchema,
  upsertTutorialStepVideoSchema,
  isKnownTutorialId,
  submittedTutorialsTable,
  submitTutorialSchema,
  SUBMITTED_TUTORIAL_STATUSES,
  type SubmittedTutorialStatus,
  isValidStepIndex,
} from "@workspace/db";
import { and, desc, eq, inArray, or, sql } from "drizzle-orm";
import { z } from "zod/v4";
import { requireAuth, optionalAuth } from "../middlewares/requireAuth";
import { requireCurator, isCurator } from "../middlewares/requireCurator";
import { rateLimit } from "../middlewares/rateLimit";
import { isAdmin } from "../lib/admin";
import { p } from "../lib/params";
import { ObjectStorageService, ObjectNotFoundError } from "../lib/objectStorage";

const moderateSchema = z.object({
  status: z.enum(SUBMITTED_TUTORIAL_STATUSES),
  note: z.string().trim().max(500).optional().nullable(),
});

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();

// Curator step-clip limits. These mirror the authoring guidance in replit.md
// and are enforced against the *actual* stored object (a presigned upload URL
// can't constrain what the client PUTs, so the claimed size/type at
// request-url time is advisory only).
const MAX_VIDEO_BYTES = 8 * 1024 * 1024;
const MAX_POSTER_BYTES = 4 * 1024 * 1024;

// Verify a just-uploaded object actually matches the expected media kind/size
// by reading its real GCS metadata. Returns a structured error so the route
// can surface a clear 4xx instead of writing a bad reference to the step.
async function verifyUploadedObject(
  objectPath: string,
  expect: { prefix: "video/" | "image/"; maxBytes: number; label: string },
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  let metadata;
  try {
    const file = await objectStorageService.getObjectEntityFile(objectPath);
    [metadata] = await file.getMetadata();
  } catch (err) {
    if (err instanceof ObjectNotFoundError) {
      return { ok: false, status: 400, error: "Uploaded file could not be found" };
    }
    throw err;
  }
  const contentType = String(metadata.contentType ?? "");
  const size = Number(metadata.size ?? 0);
  if (!contentType.startsWith(expect.prefix)) {
    return { ok: false, status: 400, error: `The ${expect.label} must be a ${expect.prefix.slice(0, -1)} file` };
  }
  if (!size || size > expect.maxBytes) {
    const mb = Math.round(expect.maxBytes / (1024 * 1024));
    return { ok: false, status: 400, error: `The ${expect.label} is too large (max ${mb} MB)` };
  }
  return { ok: true };
}

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
// Bookmarks ("save for later")
// ---------------------------------------------------------------------------

// Current viewer's bookmarked tutorial ids. Returns just the ids — the
// catalogue page already has the full tutorial data in memory (curated +
// submitted) and only needs to know which to flag as saved.
router.get("/tutorials/me/bookmarks", requireAuth, async (req, res) => {
  const rows = await db
    .select({
      tutorialId: tutorialBookmarksTable.tutorialId,
      createdAt: tutorialBookmarksTable.createdAt,
    })
    .from(tutorialBookmarksTable)
    .where(eq(tutorialBookmarksTable.userId, req.userId!))
    .orderBy(desc(tutorialBookmarksTable.createdAt));
  res.json({
    tutorialIds: rows.map((r) => r.tutorialId),
    bookmarks: rows,
  });
});

// Add a bookmark. Idempotent thanks to the unique (tutorialId, userId)
// index — repeat POSTs just no-op.
router.post("/tutorials/:id/bookmark", requireAuth, async (req, res) => {
  const tutorialId = p(req.params.id);
  if (!(await isValidReviewableId(tutorialId))) {
    res.status(404).json({ error: "Tutorial not found" });
    return;
  }
  await db
    .insert(tutorialBookmarksTable)
    .values({ tutorialId, userId: req.userId! })
    .onConflictDoNothing({
      target: [tutorialBookmarksTable.tutorialId, tutorialBookmarksTable.userId],
    });
  res.status(201).json({ tutorialId, bookmarked: true });
});

router.delete("/tutorials/:id/bookmark", requireAuth, async (req, res) => {
  const tutorialId = p(req.params.id);
  await db
    .delete(tutorialBookmarksTable)
    .where(
      and(
        eq(tutorialBookmarksTable.tutorialId, tutorialId),
        eq(tutorialBookmarksTable.userId, req.userId!),
      ),
    );
  res.status(204).end();
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

// --- Curator step demo clips -------------------------------------------------

// Whether the signed-in viewer is a curator. Anonymous => false. The frontend
// uses this to decide whether to render the per-step uploader controls.
router.get("/tutorials/curator/status", optionalAuth, (req, res) => {
  res.json({ isCurator: isCurator(req.userId) });
});

// Curator-uploaded demo clips for a tutorial's steps. Public — the detail page
// merges these over the static catalogue for every viewer.
router.get("/tutorials/:id/step-videos", async (req, res) => {
  const tutorialId = p(req.params.id);
  if (!isKnownTutorialId(tutorialId)) {
    res.status(404).json({ error: "Tutorial not found" });
    return;
  }
  const rows = await db
    .select()
    .from(tutorialStepVideosTable)
    .where(eq(tutorialStepVideosTable.tutorialId, tutorialId));
  res.json({
    stepVideos: rows.map((r) => ({
      stepIndex: r.stepIndex,
      videoUrl: r.videoUrl,
      videoPoster: r.videoPoster,
    })),
  });
});

// Attach (or replace) the demo clip on a step. Curator-only. The body carries
// canonical object paths from the upload flow; we verify each object's real
// content-type/size before persisting and mark them public so the served route
// sends a cacheable, publicly readable response.
router.put("/tutorials/:id/steps/:stepIndex/video", requireCurator, async (req, res) => {
  const tutorialId = p(req.params.id);
  const stepIndex = Number(p(req.params.stepIndex));
  if (!isValidStepIndex(tutorialId, stepIndex)) {
    res.status(404).json({ error: "Tutorial step not found" });
    return;
  }
  const parsed = upsertTutorialStepVideoSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid", details: parsed.error.flatten() });
    return;
  }
  const { videoUrl, videoPoster } = parsed.data;

  const videoCheck = await verifyUploadedObject(videoUrl, {
    prefix: "video/",
    maxBytes: MAX_VIDEO_BYTES,
    label: "clip",
  });
  if (!videoCheck.ok) {
    res.status(videoCheck.status).json({ error: videoCheck.error });
    return;
  }
  if (videoPoster) {
    const posterCheck = await verifyUploadedObject(videoPoster, {
      prefix: "image/",
      maxBytes: MAX_POSTER_BYTES,
      label: "poster",
    });
    if (!posterCheck.ok) {
      res.status(posterCheck.status).json({ error: posterCheck.error });
      return;
    }
  }

  // Tutorials render on a public page, so the served clip must be publicly
  // readable (and cacheable). Mark the objects public; best-effort.
  await objectStorageService.trySetObjectEntityAclPolicy(videoUrl, {
    owner: req.userId!,
    visibility: "public",
  });
  if (videoPoster) {
    await objectStorageService.trySetObjectEntityAclPolicy(videoPoster, {
      owner: req.userId!,
      visibility: "public",
    });
  }

  const values = {
    tutorialId,
    stepIndex,
    videoUrl,
    videoPoster: videoPoster ?? null,
    updatedBy: req.userId!,
    updatedAt: new Date(),
  };
  const inserted = await db
    .insert(tutorialStepVideosTable)
    .values(values)
    .onConflictDoUpdate({
      target: [tutorialStepVideosTable.tutorialId, tutorialStepVideosTable.stepIndex],
      set: {
        videoUrl: values.videoUrl,
        videoPoster: values.videoPoster,
        updatedBy: values.updatedBy,
        updatedAt: values.updatedAt,
      },
    })
    .returning();
  res.status(200).json({
    stepIndex: inserted[0].stepIndex,
    videoUrl: inserted[0].videoUrl,
    videoPoster: inserted[0].videoPoster,
  });
});

// Remove a curator clip from a step. The step falls back to whatever the
// static catalogue ships (often nothing). Curator-only.
router.delete("/tutorials/:id/steps/:stepIndex/video", requireCurator, async (req, res) => {
  const tutorialId = p(req.params.id);
  const stepIndex = Number(p(req.params.stepIndex));
  if (!isValidStepIndex(tutorialId, stepIndex)) {
    res.status(404).json({ error: "Tutorial step not found" });
    return;
  }
  await db
    .delete(tutorialStepVideosTable)
    .where(
      and(
        eq(tutorialStepVideosTable.tutorialId, tutorialId),
        eq(tutorialStepVideosTable.stepIndex, stepIndex),
      ),
    );
  res.status(204).end();
});

export default router;
