import { Router, type IRouter } from "express";
import {
  db, wigTryonsTable, insertWigTryonSchema, type WigTryon, postsTable,
} from "@workspace/db";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod/v4";
import { requireAuth } from "../middlewares/requireAuth";
import { ObjectStorageService, ObjectNotFoundError } from "../lib/objectStorage";

const router: IRouter = Router();
const objectStorage = new ObjectStorageService();

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

/* ── Share a saved wig render to the community feed ─────────────────────── */
router.post("/wig-tryons/:id/share", requireAuth, async (req, res) => {
  const id = z.string().uuid().safeParse(req.params.id);
  if (!id.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [tryon] = await db
    .select()
    .from(wigTryonsTable)
    .where(and(eq(wigTryonsTable.id, id.data), eq(wigTryonsTable.userId, req.userId!)))
    .limit(1);
  if (!tryon) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  try {
    const source = await objectStorage.getObjectEntityFile(tryon.imagePath);
    if (!(await objectStorage.canAccessObjectEntity({ userId: req.userId, objectFile: source }))) {
      res.status(403).json({ error: "You cannot share this render" });
      return;
    }
    const imageUrl = await objectStorage.copyObjectEntityToPublic(tryon.imagePath, req.userId!);
    const caption = z.string().max(500).optional().safeParse(req.body?.caption);
    const [post] = await db.insert(postsTable).values({
      authorId: req.userId!,
      kind: "result",
      caption: caption.success && caption.data?.trim()
        ? caption.data.trim()
        : `Trying ${tryon.wigName} in ${tryon.colorName}`,
      imageUrl,
      mood: `wig:${tryon.wigId}`,
    }).returning();
    res.status(201).json(post);
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      res.status(404).json({ error: "Saved render not found" });
      return;
    }
    req.log.error({ err: error, tryonId: id.data }, "Error sharing wig try-on");
    res.status(500).json({ error: "Failed to share wig render" });
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
