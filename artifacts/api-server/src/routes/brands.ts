import { Router, type IRouter } from "express";
import { db, brandsTable, productsTable, lookProductsTable } from "@workspace/db";
import { eq, inArray, asc } from "drizzle-orm";
import { p } from "../lib/params";

const router: IRouter = Router();

router.get("/brands", async (_req, res) => {
  const rows = await db.select().from(brandsTable).orderBy(asc(brandsTable.name));
  res.json(rows);
});

router.get("/brands/:id", async (req, res) => {
  const id = p(req.params.id);
  const rows = await db.select().from(brandsTable).where(eq(brandsTable.id, id)).limit(1);
  if (rows.length === 0) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(rows[0]);
});

router.get("/brands/:id/products", async (req, res) => {
  const id = p(req.params.id);
  const rows = await db.select().from(productsTable).where(eq(productsTable.brandId, id));
  res.json(rows);
});

router.get("/products", async (req, res) => {
  const ids = typeof req.query.ids === "string" ? req.query.ids.split(",").filter(Boolean) : null;
  const lookId = typeof req.query.lookId === "string" ? req.query.lookId : null;
  if (lookId) {
    const links = await db.select().from(lookProductsTable).where(eq(lookProductsTable.lookId, lookId));
    if (links.length === 0) {
      res.json([]);
      return;
    }
    const products = await db.select().from(productsTable).where(inArray(productsTable.id, links.map((l) => l.productId)));
    const stepBy = new Map(links.map((l) => [l.productId, l.step]));
    res.json(products.map((pr) => ({ ...pr, step: stepBy.get(pr.id) })));
    return;
  }
  if (ids && ids.length > 0) {
    const products = await db.select().from(productsTable).where(inArray(productsTable.id, ids));
    res.json(products);
    return;
  }
  const all = await db.select().from(productsTable).limit(100);
  res.json(all);
});

export default router;
