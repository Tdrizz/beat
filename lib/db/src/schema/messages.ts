import { pgTable, text, timestamp, varchar, uuid, index, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// 1-on-1 DM thread between two users. We canonicalise `userA < userB` so
// (userA, userB) is unique regardless of who initiates.
export const conversationsTable = pgTable(
  "conversations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userA: varchar("user_a", { length: 64 }).notNull(),
    userB: varchar("user_b", { length: 64 }).notNull(),
    lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
    lastMessagePreview: text("last_message_preview").default("").notNull(),
  },
  (t) => ({
    byPair: uniqueIndex("conv_pair_idx").on(t.userA, t.userB),
    byA: index("conv_user_a_idx").on(t.userA, t.lastMessageAt),
    byB: index("conv_user_b_idx").on(t.userB, t.lastMessageAt),
  }),
);
export type Conversation = typeof conversationsTable.$inferSelect;

export const messagesTable = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id").notNull(),
    senderId: varchar("sender_id", { length: 64 }).notNull(),
    body: text("body").notNull(),
    imageUrl: text("image_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    byConv: index("msg_conv_idx").on(t.conversationId, t.createdAt),
  }),
);
export const insertMessageSchema = createInsertSchema(messagesTable, {
  body: z.string().max(2000).optional().default(""),
  imageUrl: z.string().min(1).startsWith("/objects/").optional().nullable(),
}).omit({ id: true, createdAt: true, senderId: true, conversationId: true }).refine(
  (value) => Boolean(value.body?.trim() || value.imageUrl),
  { message: "A message needs text or a photo" },
);
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messagesTable.$inferSelect;
