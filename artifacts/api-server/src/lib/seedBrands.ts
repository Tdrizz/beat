import { db, brandsTable, productsTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "./logger";

// Idempotent seed — populates a starter brand + product set the first time the
// server boots against an empty brands table. Keeps the affiliate ecosystem
// usable without requiring any manual setup.
export async function seedBrandsIfEmpty(): Promise<void> {
  const [{ c }] = await db.select({ c: sql<number>`count(*)::int` }).from(brandsTable);
  if (c > 0) return;

  logger.info("Seeding starter brands and products");

  await db.insert(brandsTable).values([
    { id: "rare-beauty", name: "Rare Beauty", website: "https://rarebeauty.com", bio: "Selena Gomez's clean beauty line." },
    { id: "fenty-beauty", name: "Fenty Beauty", website: "https://fentybeauty.com", bio: "By Rihanna. 50 shades for all." },
    { id: "charlotte-tilbury", name: "Charlotte Tilbury", website: "https://charlottetilbury.com", bio: "Iconic English glam." },
    { id: "nyx", name: "NYX Cosmetics", website: "https://nyxcosmetics.com", bio: "Pro pigments, accessible price." },
    { id: "glossier", name: "Glossier", website: "https://glossier.com", bio: "Skin first. Makeup second." },
    { id: "pat-mcgrath", name: "Pat McGrath Labs", website: "https://patmcgrath.com", bio: "Mother of high-fashion makeup." },
  ]);

  await db.insert(productsTable).values([
    {
      brandId: "rare-beauty",
      name: "Soft Pinch Liquid Blush — Joy",
      category: "cheeks",
      color: "#f0909a",
      priceCents: 2300,
      affiliateUrl: "https://rarebeauty.com/products/soft-pinch-liquid-blush?utm=glamr",
      commissionBps: 800,
    },
    {
      brandId: "fenty-beauty",
      name: "Pro Filt'r Soft Matte Foundation",
      category: "base",
      color: "#cc8d5a",
      priceCents: 4000,
      affiliateUrl: "https://fentybeauty.com/products/pro-filtr-soft-matte-longwear-foundation?utm=glamr",
      commissionBps: 700,
    },
    {
      brandId: "charlotte-tilbury",
      name: "Pillow Talk Lipstick",
      category: "lips",
      color: "#c08580",
      priceCents: 3500,
      affiliateUrl: "https://charlottetilbury.com/products/pillow-talk-lipstick?utm=glamr",
      commissionBps: 1000,
    },
    {
      brandId: "nyx",
      name: "Vivid Brights Liquid Liner — Aqua",
      category: "eyes",
      color: "#3fb8c4",
      priceCents: 900,
      affiliateUrl: "https://nyxcosmetics.com/products/vivid-brights?utm=glamr",
      commissionBps: 1200,
    },
    {
      brandId: "glossier",
      name: "Cloud Paint — Beam",
      category: "cheeks",
      color: "#e88068",
      priceCents: 2200,
      affiliateUrl: "https://glossier.com/products/cloud-paint?utm=glamr",
      commissionBps: 900,
    },
    {
      brandId: "pat-mcgrath",
      name: "Mothership Eyeshadow Palette — Subliminal",
      category: "eyes",
      color: "#7a4a30",
      priceCents: 12800,
      affiliateUrl: "https://patmcgrath.com/products/mothership-subliminal?utm=glamr",
      commissionBps: 1500,
    },
  ]);

  logger.info("Brand seed complete");
}
