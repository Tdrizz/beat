import { pgTable, date, varchar, integer, primaryKey } from "drizzle-orm/pg-core";

// Global per-day counters for paid AI calls (UTC day). Backs the spending
// cap in artifacts/api-server/src/lib/aiBudget.ts, which sits alongside
// the per-user rate limits.
export const aiUsageDailyTable = pgTable(
  "ai_usage_daily",
  {
    day: date("day").notNull(),
    kind: varchar("kind", { length: 24 }).notNull(), // "tryon" | "chat"
    count: integer("count").default(0).notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.day, t.kind] }),
  }),
);
