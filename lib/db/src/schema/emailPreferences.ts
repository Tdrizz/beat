import { pgTable, varchar, boolean, timestamp, uuid, jsonb, date, uniqueIndex, index } from "drizzle-orm/pg-core";

// Per-user email preferences. Rows are created LAZILY — the absence of a
// row means "subscribed" (digest is opt-out, default on). A row is
// upserted the first time we send a user a digest (to mint their
// unsubscribe token), or when they opt out via the one-click link.
export const emailPreferencesTable = pgTable("email_preferences", {
  userId: varchar("user_id", { length: 64 }).primaryKey(), // Clerk userId
  // Weekly "new tutorials you'd love" digest. Defaults on; flipped off by
  // the one-click unsubscribe route.
  weeklyDigest: boolean("weekly_digest").default(true).notNull(),
  // Random, unguessable token embedded in the unsubscribe link. We look up
  // rows by this token only (never by userId), so the link can't be forged
  // to unsubscribe someone else.
  unsubscribeToken: uuid("unsubscribe_token").defaultRandom().notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type EmailPreference = typeof emailPreferencesTable.$inferSelect;

// Idempotency + audit log for digest emails — one row per (user, ISO
// week). The unique (userId, weekStart) index guarantees a user is emailed
// at most once per week even if the trigger fires multiple times (cron
// retry, overlapping runs, manual re-trigger). The digest run CLAIMS the
// row (insert … onConflictDoNothing … returning) BEFORE sending: an empty
// return means another run already owns this user's slot this week, so we
// skip. The claim is deleted again if the send itself fails, so a later
// run can retry.
export const digestSendsTable = pgTable(
  "digest_sends",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: varchar("user_id", { length: 64 }).notNull(),
    weekStart: date("week_start").notNull(), // Monday (UTC) of the ISO week, YYYY-MM-DD
    tutorialIds: jsonb("tutorial_ids").$type<string[]>().default([]).notNull(),
    sentAt: timestamp("sent_at").defaultNow().notNull(),
  },
  (t) => ({
    pk: uniqueIndex("digest_send_pk_idx").on(t.userId, t.weekStart),
    byUser: index("digest_send_user_idx").on(t.userId, t.sentAt),
  }),
);

export type DigestSend = typeof digestSendsTable.$inferSelect;
