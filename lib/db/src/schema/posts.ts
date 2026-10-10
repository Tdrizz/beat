import { pgTable, text, timestamp, varchar, integer, uuid, jsonb, index, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// User-uploaded looks/results. A post can either reference a catalogue look
// (lookId) and/or be a fully custom user-created look (steps stored inline).
export const postsTable = pgTable(
  "posts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    authorId: varchar("author_id", { length: 64 }).notNull(),     // -> profiles.userId
    kind: varchar("kind", { length: 16 }).notNull(),              // 'result' | 'look' | 'tutorial'
    caption: text("caption").default("").notNull(),
    imageUrl: text("image_url").notNull(),                        // /objects/...
    lookId: varchar("look_id", { length: 80 }),                   // catalogue look id, optional
    customLook: jsonb("custom_look"),                             // { steps:{...}, palette:[...] } for user-created
    season: varchar("season", { length: 16 }),                    // 'spring'|'summer'|'fall'|'winter'|'allyear'
    mood: varchar("mood", { length: 32 }),
    likeCount: integer("like_count").default(0).notNull(),
    commentCount: integer("comment_count").default(0).notNull(),
    productIds: jsonb("product_ids").$type<string[]>().default([]).notNull(), // tagged products
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    byAuthor: index("posts_author_idx").on(t.authorId),
    byCreated: index("posts_created_idx").on(t.createdAt),
    bySeason: index("posts_season_idx").on(t.season),
  }),
);

export const insertPostSchema = createInsertSchema(postsTable, {
  caption: z.string().max(500).optional(),
  kind: z.enum(["result", "look", "tutorial"]),
  imageUrl: z.string().min(1),
  season: z.enum(["spring", "summer", "fall", "winter", "allyear"]).optional(),
  productIds: z.array(z.string()).max(20).optional(),
}).omit({ id: true, likeCount: true, commentCount: true, createdAt: true, authorId: true });

export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof postsTable.$inferSelect;

// Likes
export const likesTable = pgTable(
  "post_likes",
  {
    postId: uuid("post_id").notNull(),
    userId: varchar("user_id", { length: 64 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    pk: uniqueIndex("likes_pk_idx").on(t.postId, t.userId),
    byUser: index("likes_user_idx").on(t.userId),
  }),
);
export type Like = typeof likesTable.$inferSelect;

// Comments
export const commentsTable = pgTable(
  "post_comments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    postId: uuid("post_id").notNull(),
    authorId: varchar("author_id", { length: 64 }).notNull(),
    body: text("body").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    byPost: index("comments_post_idx").on(t.postId, t.createdAt),
  }),
);
// postId comes from the URL (/posts/:id/comments), not the body.
export const insertCommentSchema = createInsertSchema(commentsTable, {
  body: z.string().min(1).max(500),
}).omit({ id: true, createdAt: true, authorId: true, postId: true });
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof commentsTable.$inferSelect;

// Follows (directed)
export const followsTable = pgTable(
  "follows",
  {
    followerId: varchar("follower_id", { length: 64 }).notNull(),
    followeeId: varchar("followee_id", { length: 64 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    pk: uniqueIndex("follows_pk_idx").on(t.followerId, t.followeeId),
    byFollowee: index("follows_followee_idx").on(t.followeeId),
  }),
);
export type Follow = typeof followsTable.$inferSelect;
