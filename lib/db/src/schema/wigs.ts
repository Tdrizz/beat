import { pgTable, text, timestamp, varchar, uuid, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Saved AI wig try-ons. Each row pins a generated render (stored in object
// storage as a private entity path) to the wig style + colour the user was
// wearing, so they can revisit their "My Wigs" gallery later. The image
// itself is served via the ACL-gated `GET /storage/objects/*` route, so
// `imagePath` is the canonical `/objects/<id>` entity path, not a CDN URL.
export const wigTryonsTable = pgTable(
  "wig_tryons",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: varchar("user_id", { length: 64 }).notNull(),
    wigId: varchar("wig_id", { length: 64 }).notNull(),
    wigName: varchar("wig_name", { length: 80 }).notNull(),
    colorId: varchar("color_id", { length: 40 }).notNull(),
    colorName: varchar("color_name", { length: 60 }).notNull(),
    // Canonical object-storage entity path, e.g. `/objects/uploads/<uuid>`.
    imagePath: text("image_path").notNull(),
    // Which captured angle this render is (Front, Slight left, …).
    angleLabel: varchar("angle_label", { length: 40 }).default("Front").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    byUser: index("wig_tryons_user_idx").on(t.userId, t.createdAt),
  }),
);
export type WigTryon = typeof wigTryonsTable.$inferSelect;

export const insertWigTryonSchema = createInsertSchema(wigTryonsTable, {
  wigId: z.string().min(1).max(64),
  wigName: z.string().min(1).max(80),
  colorId: z.string().min(1).max(40),
  colorName: z.string().min(1).max(60),
  imagePath: z.string().startsWith("/objects/").max(512),
  angleLabel: z.string().min(1).max(40).optional(),
}).omit({ id: true, userId: true, createdAt: true });

export type InsertWigTryon = z.infer<typeof insertWigTryonSchema>;
