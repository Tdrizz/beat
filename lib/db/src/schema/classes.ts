import { pgTable, text, timestamp, varchar, uuid, integer, boolean, index, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";
import { z } from "zod/v4";

// Live Classes catalog. "Live" here means a published class card with a
// scheduled time + (optionally) a hosted video URL — there is no real
// streaming server. Reservations are the booking primitive.
export const CLASS_DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;
export const CLASS_MOODS = ["everyday", "soft", "bold", "editorial", "bridal", "drag", "pageant", "party"] as const;
export const CLASS_STATUSES = ["scheduled", "live", "ended", "cancelled"] as const;

export const classesTable = pgTable(
  "classes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    instructorId: varchar("instructor_id", { length: 64 }).notNull(),
    title: varchar("title", { length: 120 }).notNull(),
    description: text("description").default("").notNull(),
    // What you'll learn checklist — short bullet strings.
    learnings: text("learnings").array().default(sql`'{}'::text[]`).notNull(),
    scheduledFor: timestamp("scheduled_for", { withTimezone: true }).notNull(),
    durationMin: integer("duration_min").default(30).notNull(),
    difficulty: varchar("difficulty", { length: 16 }).default("beginner").notNull(),
    moodTag: varchar("mood_tag", { length: 24 }).default("everyday").notNull(),
    coverUrl: text("cover_url"),
    videoUrl: text("video_url"),                          // hosted recording or stream URL
    isPremium: boolean("is_premium").default(false).notNull(),
    status: varchar("status", { length: 16 }).default("scheduled").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    byInstructor: index("classes_instructor_idx").on(t.instructorId, t.scheduledFor),
    bySchedule: index("classes_schedule_idx").on(t.scheduledFor),
  }),
);
export type Class = typeof classesTable.$inferSelect;

export const classReservationsTable = pgTable(
  "class_reservations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    classId: uuid("class_id").notNull(),
    userId: varchar("user_id", { length: 64 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    byClass: index("rsvp_class_idx").on(t.classId),
    byUser: index("rsvp_user_idx").on(t.userId),
    uniq: uniqueIndex("rsvp_user_class_uniq").on(t.userId, t.classId),
  }),
);
export type ClassReservation = typeof classReservationsTable.$inferSelect;

const httpUrl = z.string().url().max(2000).refine(
  (u) => { try { return /^https?:$/.test(new URL(u).protocol); } catch { return false; } },
  { message: "Use an http:// or https:// URL" },
);

export const insertClassSchema = createInsertSchema(classesTable, {
  title: z.string().min(3).max(120),
  description: z.string().max(2000).optional(),
  learnings: z.array(z.string().min(1).max(140)).max(10).optional(),
  durationMin: z.number().int().min(5).max(240),
  difficulty: z.enum(CLASS_DIFFICULTIES),
  moodTag: z.enum(CLASS_MOODS),
  // http(s) only: these render as a link and a CSS background, so a
  // javascript: or data: URL would be stored XSS for every viewer.
  coverUrl: httpUrl.nullable().optional(),
  videoUrl: httpUrl.nullable().optional(),
  isPremium: z.boolean().optional(),
  scheduledFor: z.coerce.date(),
}).omit({ id: true, instructorId: true, createdAt: true, status: true });

export type InsertClass = z.infer<typeof insertClassSchema>;
