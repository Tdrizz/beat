import { pgTable, text, timestamp, varchar, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// One row per signed-in user. Mirrors the Clerk user id (1:1, primary key).
// `handle` is the public @username used everywhere in the social feed.
export const profilesTable = pgTable("profiles", {
  userId: varchar("user_id", { length: 64 }).primaryKey(),       // Clerk userId
  handle: varchar("handle", { length: 32 }).notNull().unique(),  // @glow.gem
  displayName: varchar("display_name", { length: 80 }).notNull(),
  bio: text("bio").default("").notNull(),
  avatarUrl: text("avatar_url"),                                 // /objects/...
  skinTone: varchar("skin_tone", { length: 24 }),                // optional
  // Result of the on-device "Iola archetype test" mirrored to the server so
  // the feed can serve archetype-personalised content, the profile can show
  // a badge, and the AI try-on can avoid trusting client-only state.
  archetype: varchar("archetype", { length: 16 }),               // romantic|siren|icon|muse|rebel|naturalist
  isCreator: boolean("is_creator").default(false).notNull(),     // affiliate-eligible
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const ARCHETYPE_IDS = ["romantic", "siren", "icon", "muse", "rebel", "naturalist"] as const;
export type ArchetypeId = typeof ARCHETYPE_IDS[number];

export const insertProfileSchema = createInsertSchema(profilesTable, {
  handle: z.string().min(3).max(32).regex(/^[a-z0-9._]+$/, "lowercase letters, digits, . or _"),
  displayName: z.string().min(1).max(80),
  bio: z.string().max(280).optional(),
  archetype: z.enum(ARCHETYPE_IDS).nullable().optional(),
}).omit({ createdAt: true, updatedAt: true });

export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Profile = typeof profilesTable.$inferSelect;
