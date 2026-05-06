import { Router, type IRouter } from "express";
import { db, profilesTable, insertProfileSchema } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, optionalAuth } from "../middlewares/requireAuth";
import { p } from "../lib/params";

const router: IRouter = Router();

router.get("/me", requireAuth, async (req, res) => {
  const rows = await db.select().from(profilesTable).where(eq(profilesTable.userId, req.userId!)).limit(1);
  if (rows.length === 0) {
    res.status(404).json({ error: "Profile not created" });
    return;
  }
  res.json(rows[0]);
});

import { rateLimit } from "../middlewares/rateLimit";
router.post("/profiles", requireAuth, rateLimit({ scope: "profile-create", max: 5, windowMs: 60_000 }), async (req, res) => {
  const parsed = insertProfileSchema.omit({ userId: true }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid", details: parsed.error.flatten() });
    return;
  }
  const exists = await db.select().from(profilesTable).where(eq(profilesTable.userId, req.userId!)).limit(1);
  if (exists.length > 0) {
    res.status(409).json({ error: "Profile already exists" });
    return;
  }
  const handleTaken = await db.select().from(profilesTable).where(eq(profilesTable.handle, parsed.data.handle)).limit(1);
  if (handleTaken.length > 0) {
    res.status(409).json({ error: "Handle already taken" });
    return;
  }
  const inserted = await db.insert(profilesTable).values({ ...parsed.data, userId: req.userId! }).returning();
  res.status(201).json(inserted[0]);
});

router.put("/profiles/me", requireAuth, async (req, res) => {
  const parsed = insertProfileSchema.omit({ userId: true }).partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid" });
    return;
  }
  const updated = await db
    .update(profilesTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(profilesTable.userId, req.userId!))
    .returning();
  if (updated.length === 0) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }
  res.json(updated[0]);
});

// Lightweight endpoint just for syncing the on-device archetype quiz result
// to the server. We keep it separate from the full profile PUT so the
// frontend can fire-and-forget on quiz completion without race-merging
// other partial profile fields.
import { ARCHETYPE_IDS } from "@workspace/db";
import { z } from "zod/v4";
const archetypeBody = z.object({ archetype: z.enum(ARCHETYPE_IDS).nullable() });
router.put("/profiles/me/archetype", requireAuth, async (req, res) => {
  const parsed = archetypeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid archetype" });
    return;
  }
  const updated = await db
    .update(profilesTable)
    .set({ archetype: parsed.data.archetype, updatedAt: new Date() })
    .where(eq(profilesTable.userId, req.userId!))
    .returning();
  if (updated.length === 0) {
    // Profile doesn't exist yet (e.g. user took the quiz before onboarding).
    // Returning 204 is a deliberate no-op — the localStorage value is the
    // source of truth until they create a profile, at which point
    // ProfileSetup picks up the existing archetype and posts it.
    res.status(204).end();
    return;
  }
  res.json(updated[0]);
});

router.get("/profiles/:handle", optionalAuth, async (_req, res) => {
  const handle = p(_req.params.handle);
  const rows = await db.select().from(profilesTable).where(eq(profilesTable.handle, handle)).limit(1);
  if (rows.length === 0) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(rows[0]);
});

export default router;
