import { pgTable, text, timestamp, varchar, integer, uuid, index, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Canonical list of tutorial IDs that the server will accept reviews for.
// Mirrors the static catalogue in `artifacts/glamr/src/lib/tutorials.ts`
// (which is the source of truth for tutorial *content*). Kept here so the
// API server can validate `:id` without importing frontend code, and so
// orphan review rows can't accumulate for tutorials that were never
// shipped. The frontend asserts its catalogue matches at module load.
export const TUTORIAL_IDS = [
  "soft-glam-smokey",
  "everyday-no-makeup",
  "classic-red-lip",
  "snatched-contour",
  "fluffy-laminated-brows",
  "glass-skin-routine",
  "ombre-lip",
  "winged-eyeliner",
  "barely-there-skin",
  "cut-crease-glam",
  "monochromatic-glow",
  "evening-skincare-recovery",
] as const;
export type TutorialId = (typeof TUTORIAL_IDS)[number];
const tutorialIdSet: ReadonlySet<string> = new Set(TUTORIAL_IDS);
export function isKnownTutorialId(id: string): id is TutorialId {
  return tutorialIdSet.has(id);
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
