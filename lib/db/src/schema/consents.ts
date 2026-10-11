import { pgTable, timestamp, varchar, uniqueIndex } from "drizzle-orm/pg-core";

export const CONSENT_KINDS = ["face_data"] as const;
export type ConsentKind = typeof CONSENT_KINDS[number];

// Explicit user consents (currently: camera / face data for try-on and look
// matching). One row per user per kind holding the latest decision; a
// withdrawal keeps the row with `withdrawnAt` set as an audit record.
export const userConsentsTable = pgTable(
  "user_consents",
  {
    userId: varchar("user_id", { length: 64 }).notNull(),
    kind: varchar("kind", { length: 32 }).$type<ConsentKind>().notNull(),
    version: varchar("version", { length: 16 }).notNull(),
    grantedAt: timestamp("granted_at", { withTimezone: true }).defaultNow().notNull(),
    withdrawnAt: timestamp("withdrawn_at", { withTimezone: true }),
  },
  (t) => ({
    pk: uniqueIndex("user_consents_pk_idx").on(t.userId, t.kind),
  }),
);
export type UserConsent = typeof userConsentsTable.$inferSelect;
