import { pgTable, text, timestamp, varchar, uuid, boolean, index } from "drizzle-orm/pg-core";

// Unified notifications inbox. One row per actionable event surfaced to
// `recipientId`. `kind` drives the icon + copy on the frontend; `payload`
// carries any extra context (post id, comment id, conversation id, etc).
export const notificationsTable = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    recipientId: varchar("recipient_id", { length: 64 }).notNull(),
    actorId: varchar("actor_id", { length: 64 }),       // null for system
    kind: varchar("kind", { length: 24 }).notNull(),     // like|comment|follow|message|system
    postId: uuid("post_id"),
    conversationId: uuid("conversation_id"),
    body: text("body").default("").notNull(),
    readAt: timestamp("read_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    byRecipient: index("notif_recipient_idx").on(t.recipientId, t.createdAt),
    byUnread: index("notif_unread_idx").on(t.recipientId, t.readAt),
  }),
);
export type Notification = typeof notificationsTable.$inferSelect;
