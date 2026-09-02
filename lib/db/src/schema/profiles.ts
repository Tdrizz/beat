import { pgTable, text, timestamp, varchar, boolean, jsonb, uuid, integer, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Social-account links a user can attach to their Beat profile. Stored as
// a flat key/value blob in jsonb so we can grow the supported set without
// a migration each time. Values are bare handles for the platform-native
// services and a full https:// URL for `website`. Validation lives in
// `socialLinksSchema` below — DB column is intentionally permissive.
export const SOCIAL_PLATFORMS = [
  "instagram", "tiktok", "youtube", "twitter", "pinterest",
  "threads", "snapchat", "website",
] as const;
export type SocialPlatform = typeof SOCIAL_PLATFORMS[number];
export type SocialLinks = Partial<Record<SocialPlatform, string>>;

const handleRegex = /^[A-Za-z0-9_.\-]{1,40}$/;
const handleField = z.string().regex(handleRegex, "letters, digits, _ . or -").optional();
export const socialLinksSchema = z.object({
  instagram: handleField,
  tiktok:    handleField,
  youtube:   handleField,                            // either @handle or channel slug
  twitter:   handleField,                            // x.com handle
  pinterest: handleField,
  threads:   handleField,
  snapchat:  handleField,
  // Defence in depth: even though the frontend disallows it, restrict
  // `website` to http(s) so a stored value can never become a
  // `javascript:` href when rendered in <SocialLinkChips>.
  website:   z.string().url().max(200).refine(
    (u) => { try { return /^https?:$/.test(new URL(u).protocol); } catch { return false; } },
    { message: "Use an http:// or https:// URL" },
  ).optional(),
}).strict();

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
  // Linked social accounts — see SOCIAL_PLATFORMS / socialLinksSchema above.
  socialLinks: jsonb("social_links").$type<SocialLinks>().default({}).notNull(),
  isCreator: boolean("is_creator").default(false).notNull(),     // affiliate-eligible
  // Subscription expiry timestamp set by the Stripe webhook. The user is
  // "Premium" iff this is in the future. Drives both the host-class gate
  // and the watch-premium-class gate. Null = never subscribed.
  premiumUntil: timestamp("premium_until", { withTimezone: true }),
  // Stripe customer id, set lazily on first checkout to keep one customer
  // per user across renewals/upgrades.
  stripeCustomerId: varchar("stripe_customer_id", { length: 64 }),
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
  socialLinks: socialLinksSchema.optional(),
}).omit({ createdAt: true, updatedAt: true });

export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Profile = typeof profilesTable.$inferSelect;

// A favourited makeup-look + wig pairing the user explored in try-on, saved
// so they can revisit and re-run the AI try-on later. The catalogue ids
// (lookId / wigStyleId / wigColorId) are stored verbatim — they're stable
// string keys defined in the frontend `looks`/`wigs` catalogues. We keep the
// row deliberately denormalised (no FKs to a wigs/looks table, which live in
// code) so the catalogue can evolve without migrations; a combo whose ids no
// longer resolve is simply skipped on render. `wigStyleId` of "none" means
// "my own hair", in which case `wigColorId` is null.
export const savedCombosTable = pgTable(
  "saved_combos",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: varchar("user_id", { length: 64 }).notNull(),     // Clerk userId
    lookId: varchar("look_id", { length: 64 }).notNull(),
    wigStyleId: varchar("wig_style_id", { length: 48 }).notNull(), // "none" ⇒ own hair
    wigColorId: varchar("wig_color_id", { length: 48 }),           // null when no wig
    intensity: integer("intensity").notNull().default(60),         // 0–100 AI strength
    name: varchar("name", { length: 80 }).notNull().default("Untitled combo"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    byUser: index("saved_combos_user_idx").on(t.userId, t.createdAt),
  }),
);

export const insertSavedComboSchema = createInsertSchema(savedCombosTable, {
  lookId: z.string().min(1).max(64),
  wigStyleId: z.string().min(1).max(48),
  wigColorId: z.string().min(1).max(48).nullable().optional(),
  intensity: z.number().int().min(0).max(100).optional(),
  name: z.string().trim().min(1).max(80).optional(),
}).omit({ id: true, userId: true, createdAt: true });

export type InsertSavedCombo = z.infer<typeof insertSavedComboSchema>;
export type SavedCombo = typeof savedCombosTable.$inferSelect;
