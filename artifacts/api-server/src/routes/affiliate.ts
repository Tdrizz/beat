import { Router, type IRouter } from "express";
import { db, productsTable, affiliateClicksTable, brandsTable } from "@workspace/db";
import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { requireAuth, optionalAuth } from "../middlewares/requireAuth";
import { p } from "../lib/params";

const router: IRouter = Router();

router.get("/affiliate/click/:productId", optionalAuth, async (req, res) => {
  const productId = p(req.params.productId);
  const product = await db.select().from(productsTable).where(eq(productsTable.id, productId)).limit(1);
  if (product.length === 0) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  const creatorId = typeof req.query.creator === "string" ? req.query.creator : null;
  const postId = typeof req.query.post === "string" ? req.query.post : null;
  await db.insert(affiliateClicksTable).values({
    productId: product[0].id,
    creatorId,
    postId,
    viewerId: req.userId ?? null,
    referrer: req.headers.referer ?? null,
  });
  res.redirect(302, product[0].affiliateUrl);
});

router.get("/affiliate/me/stats", requireAuth, async (req, res) => {
  const days = Math.min(Math.max(parseInt(String(req.query.days ?? "30"), 10) || 30, 1), 90);
  const limit = Math.min(parseInt(String(req.query.limit ?? "50"), 10) || 50, 200);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const clicks = await db
    .select({ productId: affiliateClicksTable.productId, c: sql<number>`count(*)::int` })
    .from(affiliateClicksTable)
    .where(and(eq(affiliateClicksTable.creatorId, req.userId!), gte(affiliateClicksTable.createdAt, since)))
    .groupBy(affiliateClicksTable.productId)
    .orderBy(desc(sql`count(*)`))
    .limit(limit);
  const productIds = clicks.map((c) => c.productId);
  const products = productIds.length === 0 ? [] : await db.select().from(productsTable).where(inArray(productsTable.id, productIds));
  // Estimated earnings model:
  //   est_clicks_to_buyers = clicks * estConversionRate (5% industry baseline)
  //   est_commission       = price * buyers * (bps / 10000)
  const estConversionRate = 0.05;
  const enriched = clicks.map((row) => {
    const product = products.find((pr) => pr.id === row.productId);
    const bps = product?.commissionBps ?? 800;
    const estCommissionCents = Math.round((product?.priceCents ?? 0) * (row.c * estConversionRate) * (bps / 10000));
    return { ...row, product: product ?? null, estCommissionCents };
  });
  const totalClicks = clicks.reduce((s, r) => s + r.c, 0);
  const totalEstCents = enriched.reduce((s, r) => s + r.estCommissionCents, 0);
  // Daily click sparkline for the dashboard chart.
  const series = await db
    .select({
      day: sql<string>`to_char(${affiliateClicksTable.createdAt}, 'YYYY-MM-DD')`,
      c: sql<number>`count(*)::int`,
    })
    .from(affiliateClicksTable)
    .where(and(eq(affiliateClicksTable.creatorId, req.userId!), gte(affiliateClicksTable.createdAt, since)))
    .groupBy(sql`to_char(${affiliateClicksTable.createdAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${affiliateClicksTable.createdAt}, 'YYYY-MM-DD')`);
  res.json({ totalClicks, totalEstCents, byProduct: enriched, series, days, estConversionRate });
});

router.get("/affiliate/_status", async (_req, res) => {
  const c = await db.select({ c: sql<number>`count(*)::int` }).from(brandsTable);
  res.json({ brandCount: c[0].c });
});

export default router;
