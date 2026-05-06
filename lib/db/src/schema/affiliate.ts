import { pgTable, text, timestamp, varchar, uuid, integer, index, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Brands available in the affiliate ecosystem. Either curated by us or
// claimed by a verified brand account in the future.
export const brandsTable = pgTable("brands", {
  id: varchar("id", { length: 48 }).primaryKey(),       // slug, e.g. "fenty-beauty"
  name: varchar("name", { length: 80 }).notNull(),
  logoUrl: text("logo_url"),
  website: text("website"),
  bio: text("bio").default("").notNull(),
  defaultCommissionBps: integer("default_commission_bps").default(800).notNull(), // 8%
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type Brand = typeof brandsTable.$inferSelect;

// Products tagged in posts and looks. `affiliateUrl` is the brand's tracked URL
// — we redirect through `/api/affiliate/click/:productId` to record clicks
// before forwarding the user.
export const productsTable = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    brandId: varchar("brand_id", { length: 48 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    category: varchar("category", { length: 24 }).notNull(),  // base|eyes|brows|lips|cheeks|tools
    imageUrl: text("image_url"),
    color: varchar("color", { length: 16 }),                   // hex
    priceCents: integer("price_cents").default(0).notNull(),
    currency: varchar("currency", { length: 4 }).default("USD").notNull(),
    affiliateUrl: text("affiliate_url").notNull(),
    commissionBps: integer("commission_bps"),                  // overrides brand default
    tags: jsonb("tags").$type<string[]>().default([]).notNull(),
  },
  (t) => ({
    byBrand: index("products_brand_idx").on(t.brandId),
    byCategory: index("products_category_idx").on(t.category),
  }),
);
export const insertProductSchema = createInsertSchema(productsTable, {
  name: z.string().min(1).max(120),
  affiliateUrl: z.string().url(),
}).omit({ id: true });
export type Product = typeof productsTable.$inferSelect;

// Click tracking. Lets creators see which of their tagged products are
// driving traffic and (eventually) commission.
export const affiliateClicksTable = pgTable(
  "affiliate_clicks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id").notNull(),
    creatorId: varchar("creator_id", { length: 64 }),    // who's post drove the click; null for direct
    postId: uuid("post_id"),                              // optional source post
    viewerId: varchar("viewer_id", { length: 64 }),       // null for signed-out
    referrer: text("referrer"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    byCreator: index("clicks_creator_idx").on(t.creatorId, t.createdAt),
    byProduct: index("clicks_product_idx").on(t.productId, t.createdAt),
  }),
);
export type AffiliateClick = typeof affiliateClicksTable.$inferSelect;

// Many-to-many: which products are tagged in a catalogue look (e.g. our seed
// looks). User-uploaded posts use `posts.productIds` directly.
export const lookProductsTable = pgTable(
  "look_products",
  {
    lookId: varchar("look_id", { length: 80 }).notNull(),
    productId: uuid("product_id").notNull(),
    step: varchar("step", { length: 16 }).notNull(),     // base|eyes|...
  },
  (t) => ({
    byLook: index("lp_look_idx").on(t.lookId),
  }),
);
export type LookProduct = typeof lookProductsTable.$inferSelect;
