import { pgTable, text, timestamp, varchar, uuid, index } from "drizzle-orm/pg-core";

// "Ask Iola" chatbot persistence. One active thread per user at a time
// (the most recently created thread); "Start new chat" inserts a fresh
// thread which becomes the active one, preserving prior history in the DB.
export const CHAT_ROLES = ["user", "assistant"] as const;
export type ChatRole = (typeof CHAT_ROLES)[number];

export const chatThreadsTable = pgTable(
  "chat_threads",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: varchar("user_id", { length: 64 }).notNull(), // Clerk userId
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    // Bumped on every message so the catalog/active-thread lookup can order
    // by recency without scanning the messages table.
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    // Active-thread lookup: latest thread for a user.
    byUser: index("chat_threads_user_idx").on(t.userId, t.createdAt),
  }),
);
export type ChatThread = typeof chatThreadsTable.$inferSelect;

export const chatMessagesTable = pgTable(
  "chat_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    threadId: uuid("thread_id").notNull(),
    role: varchar("role", { length: 16 }).notNull(), // "user" | "assistant"
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    // Restore a thread's transcript in chronological order.
    byThread: index("chat_messages_thread_idx").on(t.threadId, t.createdAt),
  }),
);
export type ChatMessage = typeof chatMessagesTable.$inferSelect;
