import { pgTable, text, timestamp, varchar, uuid, jsonb, index, uniqueIndex } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

// A blocks B: neither sees the other's posts, comments or profile, they
// can't follow or message each other, and B's activity doesn't notify A.
export const userBlocksTable = pgTable(
  "user_blocks",
  {
    blockerId: varchar("blocker_id", { length: 64 }).notNull(),
    blockedId: varchar("blocked_id", { length: 64 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    pk: uniqueIndex("user_blocks_pk_idx").on(t.blockerId, t.blockedId),
    byBlocked: index("user_blocks_blocked_idx").on(t.blockedId),
  }),
);
export type UserBlock = typeof userBlocksTable.$inferSelect;

export const REPORT_TARGET_TYPES = ["post", "comment", "message", "user"] as const;
export type ReportTargetType = typeof REPORT_TARGET_TYPES[number];

export const REPORT_REASONS = [
  "spam",
  "harassment",
  "hate",
  "nudity",
  "violence",
  "self_harm",
  "impersonation",
  "minor_safety",
  "other",
] as const;
export type ReportReason = typeof REPORT_REASONS[number];

export const REPORT_STATUSES = ["open", "dismissed", "actioned"] as const;
export type ReportStatus = typeof REPORT_STATUSES[number];

// User reports of content or accounts, reviewed by ADMIN_USER_IDS in the
// admin queue. `snapshot` keeps a copy of the reported content so it can
// still be reviewed after the author deletes it.
export const reportsTable = pgTable(
  "reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    reporterId: varchar("reporter_id", { length: 64 }).notNull(),
    targetType: varchar("target_type", { length: 16 }).$type<ReportTargetType>().notNull(),
    targetId: varchar("target_id", { length: 64 }).notNull(),
    targetUserId: varchar("target_user_id", { length: 64 }).notNull(),
    reason: varchar("reason", { length: 24 }).$type<ReportReason>().notNull(),
    details: text("details").default("").notNull(),
    snapshot: jsonb("snapshot").$type<Record<string, unknown>>().default({}).notNull(),
    status: varchar("status", { length: 16 }).$type<ReportStatus>().default("open").notNull(),
    resolvedBy: varchar("resolved_by", { length: 64 }),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    resolutionNote: text("resolution_note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    // One report per reporter per target; re-reporting is a no-op.
    uniq: uniqueIndex("reports_reporter_target_idx").on(t.reporterId, t.targetType, t.targetId),
    byStatus: index("reports_status_idx").on(t.status, t.createdAt),
    byTargetUser: index("reports_target_user_idx").on(t.targetUserId),
  }),
);
export type Report = typeof reportsTable.$inferSelect;

export const createReportSchema = z.object({
  targetType: z.enum(REPORT_TARGET_TYPES),
  targetId: z.string().min(1).max(64),
  reason: z.enum(REPORT_REASONS),
  details: z.string().trim().max(1000).optional(),
});

export const resolveReportSchema = z.object({
  action: z.enum(["dismiss", "remove_content", "ban_user"]),
  note: z.string().trim().max(1000).optional(),
});
