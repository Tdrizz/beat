import { Router, type IRouter } from "express";
import {
  db, wigTryonsTable, insertWigTryonSchema, type WigTryon,
} from "@workspace/db";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod/v4";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

/* ── Save a wig try-on ──────────────────────────────────────────────────────
 * The client uploads the generated render via the presigned-URL flow first
 * (finalized as `private` so only the owner can read it), then POSTs the
 * resulting `/objects/<id>` entity path here together with the wig metadata.
 * We do NOT re-upload the image here — only persist the pointer + metadata. */
router.post("/wig-tryons", requireAuth, async (req, res) => {
  const parsed = insertWigTryonSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid wig try-on payload" });
    return;
  }
  try {
    const [row] = await db
      .insert(wigTryonsTable)
      .values({ ...parsed.data, userId: req.userId! })
      .returning();
    res.status(201).json({ tryon: row });
  } catch (error) {
    req.log.error({ err: error }, "Error saving wig try-on");
    res.status(500).json({ error: "Failed to save wig try-on" });
  }
});

/* ── List my saved wig try-ons ──────────────────────────────────────────── */
router.get("/wig-tryons", requireAuth, async (req, res) => {
  try {
    const rows: WigTryon[] = await db
      .select()
      .from(wigTryonsTable)
      .where(eq(wigTryonsTable.userId, req.userId!))
      .orderBy(desc(wigTryonsTable.createdAt))
      .limit(200);
    res.json({ tryons: rows });
  } catch (error) {
    req.log.error({ err: error }, "Error listing wig try-ons");
    res.status(500).json({ error: "Failed to list wig try-ons" });
  }
});

/* ── Delete one of my saved wig try-ons ─────────────────────────────────── */
router.delete("/wig-tryons/:id", requireAuth, async (req, res) => {
  const id = z.string().uuid().safeParse(req.params.id);
  if (!id.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  try {
    const deleted = await db
      .delete(wigTryonsTable)
      .where(and(eq(wigTryonsTable.id, id.data), eq(wigTryonsTable.userId, req.userId!)))
      .returning({ id: wigTryonsTable.id });
    if (deleted.length === 0) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.status(204).end();
  } catch (error) {
    req.log.error({ err: error }, "Error deleting wig try-on");
    res.status(500).json({ error: "Failed to delete wig try-on" });
  }
});

export default router;
