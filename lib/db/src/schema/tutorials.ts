import { pgTable, text, timestamp, varchar, integer, uuid, jsonb, index, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Mirrors the static catalogue's enums in
// `artifacts/glamr/src/lib/tutorials.ts`. Kept here so the server can
// validate submission payloads without importing frontend code.
export const TUTORIAL_CATEGORIES = [
  "eyes", "lips", "contouring", "skincare", "brows", "foundation",
] as const;
export type TutorialCategory = (typeof TUTORIAL_CATEGORIES)[number];

export const TUTORIAL_DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;
export type TutorialDifficulty = (typeof TUTORIAL_DIFFICULTIES)[number];

// Lifecycle of a creator-submitted tutorial:
//   draft     — only visible to the author; can be edited freely
//   pending   — submitted for moderation; cannot be edited until rejected
//   published — approved by a moderator; visible in the public catalogue
//   featured  — published AND promoted (boosted sort, badge)
//   rejected  — sent back to draft-equivalent with a moderationNote
export const SUBMITTED_TUTORIAL_STATUSES = [
  "draft", "pending", "published", "featured", "rejected",
] as const;
export type SubmittedTutorialStatus = (typeof SUBMITTED_TUTORIAL_STATUSES)[number];

export interface TutorialStep {
  title: string;
  body: string;
}

// Server-side mirror of the curated catalogue's per-tutorial taxonomy.
// `artifacts/glamr/src/lib/tutorials.ts` remains the source of truth for
// tutorial *content*; here we keep just the id -> {category, difficulty}
// mapping so the API server can, without importing frontend code:
//   (a) validate `:id` on review/bookmark writes (orphan rows can't
//       accumulate for tutorials that were never shipped), and
//   (b) infer a user's taste from the curated tutorials they've
//       bookmarked — used by the weekly tutorial digest.
// If you add/rename/remove a curated tutorial there, mirror it here.
export const CURATED_TUTORIAL_META = {
  "soft-glam-smokey":          { category: "eyes",       difficulty: "intermediate" },
  "everyday-no-makeup":        { category: "foundation", difficulty: "beginner" },
  "classic-red-lip":           { category: "lips",       difficulty: "beginner" },
  "snatched-contour":          { category: "contouring", difficulty: "intermediate" },
  "fluffy-laminated-brows":    { category: "brows",      difficulty: "beginner" },
  "glass-skin-routine":        { category: "skincare",   difficulty: "intermediate" },
  "ombre-lip":                 { category: "lips",       difficulty: "beginner" },
  "winged-eyeliner":           { category: "eyes",       difficulty: "advanced" },
  "barely-there-skin":         { category: "foundation", difficulty: "intermediate" },
  "cut-crease-glam":           { category: "eyes",       difficulty: "advanced" },
  "monochromatic-glow":        { category: "contouring", difficulty: "beginner" },
  "evening-skincare-recovery": { category: "skincare",   difficulty: "beginner" },
} as const satisfies Record<string, { category: TutorialCategory; difficulty: TutorialDifficulty }>;

// Canonical allowlist of curated tutorial IDs, derived from the metadata
// map above so there is exactly one place to maintain.
export type TutorialId = keyof typeof CURATED_TUTORIAL_META;
export const TUTORIAL_IDS = Object.keys(CURATED_TUTORIAL_META) as TutorialId[];
const tutorialIdSet: ReadonlySet<string> = new Set<string>(TUTORIAL_IDS);
export function isKnownTutorialId(id: string): id is TutorialId {
  return tutorialIdSet.has(id);
}

// Number of steps in each tutorial, mirrored from the static catalogue in
// `artifacts/glamr/src/lib/tutorials.ts`. Kept here (like TUTORIAL_IDS) so the
// API server can validate the step index when a curator attaches a demo clip,
// without importing frontend code or letting orphan rows accumulate for a step
// that doesn't exist. If you add/remove a step in a tutorial there, update the
// matching count here too.
export const TUTORIAL_STEP_COUNTS: Record<TutorialId, number> = {
  "soft-glam-smokey": 6,
  "everyday-no-makeup": 5,
  "classic-red-lip": 5,
  "snatched-contour": 5,
  "fluffy-laminated-brows": 4,
  "glass-skin-routine": 5,
  "ombre-lip": 4,
  "winged-eyeliner": 5,
  "barely-there-skin": 5,
  "cut-crease-glam": 6,
  "monochromatic-glow": 3,
  "evening-skincare-recovery": 5,
};

// True only for a known tutorial id paired with an in-range, integer step index.
export function isValidStepIndex(tutorialId: string, stepIndex: number): boolean {
  if (!isKnownTutorialId(tutorialId)) return false;
  return (
    Number.isInteger(stepIndex) &&
    stepIndex >= 0 &&
    stepIndex < TUTORIAL_STEP_COUNTS[tutorialId]
  );
}

// Tutorial reviews. Tutorials themselves live in the static catalogue
// (`artifacts/glamr/src/lib/tutorials.ts`) — we only persist user-generated
// ratings + reviews here, keyed by the static tutorial id.
export const tutorialReviewsTable = pgTable(
  "tutorial_reviews",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tutorialId: varchar("tutorial_id", { length: 80 }).notNull(),
    authorId: varchar("author_id", { length: 64 }).notNull(),  // -> profiles.userId
    rating: integer("rating").notNull(),                       // 1-5
    body: text("body").default("").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    // One review per (tutorial, user) — upsert semantics.
    pk: uniqueIndex("tutorial_review_pk_idx").on(t.tutorialId, t.authorId),
    byTutorial: index("tutorial_review_tutorial_idx").on(t.tutorialId, t.createdAt),
  }),
);

export const insertTutorialReviewSchema = createInsertSchema(tutorialReviewsTable, {
  rating: z.number().int().min(1).max(5),
  body: z.string().max(1000).optional(),
}).omit({ id: true, createdAt: true, authorId: true });

export type InsertTutorialReview = z.infer<typeof insertTutorialReviewSchema>;
export type TutorialReview = typeof tutorialReviewsTable.$inferSelect;

// Creator-submitted tutorials. The curated catalogue
// (`artifacts/glamr/src/lib/tutorials.ts`) is the seed content; this table
// lets signed-in users grow it. Rows here move through the lifecycle
// described by SUBMITTED_TUTORIAL_STATUSES — only `published` / `featured`
// rows are shown alongside curated tutorials on the public listing.
//
// Steps + tools are stored as JSONB rather than separate child tables
// because they are always loaded together with the parent, are bounded in
// size (we cap each list in the Zod schema below), and are never queried
// individually.
export const submittedTutorialsTable = pgTable(
  "submitted_tutorials",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    authorId: varchar("author_id", { length: 64 }).notNull(),       // -> profiles.userId
    title: varchar("title", { length: 120 }).notNull(),
    category: varchar("category", { length: 24 }).$type<TutorialCategory>().notNull(),
    difficulty: varchar("difficulty", { length: 16 }).$type<TutorialDifficulty>().notNull(),
    minutes: integer("minutes").notNull(),
    thumbnail: text("thumbnail").notNull(),                          // /objects/... or https://
    summary: varchar("summary", { length: 240 }).notNull(),
    tools: jsonb("tools").$type<string[]>().default([]).notNull(),
    steps: jsonb("steps").$type<TutorialStep[]>().default([]).notNull(),
    proTip: text("pro_tip"),
    status: varchar("status", { length: 16 })
      .$type<SubmittedTutorialStatus>()
      .default("draft")
      .notNull(),
    moderationNote: text("moderation_note"),                         // shown to author on rejection
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    submittedAt: timestamp("submitted_at"),
    reviewedAt: timestamp("reviewed_at"),
  },
  (t) => ({
    byAuthor: index("submitted_tutorial_author_idx").on(t.authorId, t.updatedAt),
    byStatus: index("submitted_tutorial_status_idx").on(t.status, t.updatedAt),
  }),
);

const stepSchema = z.object({
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().min(1).max(1000),
});

// Used for both create and update. `status` / `moderation` fields are NOT
// settable from the public payload — those are driven by dedicated routes.
export const submitTutorialSchema = z.object({
  title: z.string().trim().min(4).max(120),
  category: z.enum(TUTORIAL_CATEGORIES),
  difficulty: z.enum(TUTORIAL_DIFFICULTIES),
  minutes: z.number().int().min(1).max(180),
  thumbnail: z.string().trim().min(1).max(2000),
  summary: z.string().trim().min(10).max(240),
  tools: z.array(z.string().trim().min(1).max(120)).min(1).max(20),
  steps: z.array(stepSchema).min(2).max(20),
  proTip: z.string().trim().max(500).optional().nullable(),
});

export type SubmitTutorialInput = z.infer<typeof submitTutorialSchema>;
export type SubmittedTutorial = typeof submittedTutorialsTable.$inferSelect;

// Per-user tutorial bookmarks ("save for later"). Keyed by the same string
// id used for reviews — works for both curated tutorials (slug ids like
// "soft-glam-smokey") and creator-submitted tutorials (UUIDs). The unique
// index on (tutorialId, userId) guarantees idempotent bookmarking.
export const tutorialBookmarksTable = pgTable(
  "tutorial_bookmarks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tutorialId: varchar("tutorial_id", { length: 80 }).notNull(),
    userId: varchar("user_id", { length: 64 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    pk: uniqueIndex("tutorial_bookmark_pk_idx").on(t.tutorialId, t.userId),
    byUser: index("tutorial_bookmark_user_idx").on(t.userId, t.createdAt),
  }),
);

export type TutorialBookmark = typeof tutorialBookmarksTable.$inferSelect;

// Curator-managed demo clips for individual tutorial steps. The tutorials
// themselves (and any default media shipped in the catalogue) live in the
// static file; this table only stores curator uploads — a short clip plus an
// optional poster frame — keyed by (tutorialId, stepIndex). The detail page
// merges these over the static step, so removing a row falls back to whatever
// the catalogue ships. `videoUrl`/`videoPoster` are canonical object-storage
// entity paths (`/objects/<id>`) that resolve to the served `/api/storage`
// route on the client.
export const tutorialStepVideosTable = pgTable(
  "tutorial_step_videos",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tutorialId: varchar("tutorial_id", { length: 80 }).notNull(),
    stepIndex: integer("step_index").notNull(),
    videoUrl: text("video_url").notNull(),
    videoPoster: text("video_poster"),
    updatedBy: varchar("updated_by", { length: 64 }).notNull(), // -> profiles.userId
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    // One clip per (tutorial, step) — upsert semantics.
    pk: uniqueIndex("tutorial_step_video_pk_idx").on(t.tutorialId, t.stepIndex),
  }),
);

// Body for PUT /tutorials/:id/steps/:stepIndex/video. Both URLs must be
// canonical object-storage entity paths (the `/objects/` prefix is enforced so
// arbitrary/`javascript:` URLs can't be injected into a publicly rendered page;
// the route additionally verifies the stored object's real content-type/size).
export const upsertTutorialStepVideoSchema = z.object({
  videoUrl: z.string().min(1).startsWith("/objects/"),
  videoPoster: z.string().startsWith("/objects/").optional(),
});

export type UpsertTutorialStepVideo = z.infer<typeof upsertTutorialStepVideoSchema>;
export type TutorialStepVideo = typeof tutorialStepVideosTable.$inferSelect;
