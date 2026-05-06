import { Router, type IRouter } from "express";
import { db, followsTable, profilesTable } from "@workspace/db";
import { and, eq, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { p } from "../lib/params";

const router: IRouter = Router();

router.post("/follows/:userId", requireAuth, async (req, res) => {
  const target = p(req.params.userId);
  if (target === req.userId) {
    res.status(400).json({ error: "Cannot follow yourself" });
    return;
  }
  const existing = await db
    .select()
    .from(followsTable)
    .where(and(eq(followsTable.followerId, req.userId!), eq(followsTable.followeeId, target)))
    .limit(1);
  if (existing.length === 0) {
    await db
      .insert(followsTable)
      .values({ followerId: req.userId!, followeeId: target })
      .onConflictDoNothing({ target: [followsTable.followerId, followsTable.followeeId] });
  }
  res.status(204).end();
});

router.delete("/follows/:userId", requireAuth, async (req, res) => {
  const target = p(req.params.userId);
  await db
    .delete(followsTable)
    .where(and(eq(followsTable.followerId, req.userId!), eq(followsTable.followeeId, target)));
  res.status(204).end();
});

router.get("/profiles/:handle/follow-stats", async (req, res) => {
  const handle = p(req.params.handle);
  const profile = await db.select().from(profilesTable).where(eq(profilesTable.handle, handle)).limit(1);
  if (profile.length === 0) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const followers = await db.select({ c: sql<number>`count(*)::int` }).from(followsTable).where(eq(followsTable.followeeId, profile[0].userId));
  const following = await db.select({ c: sql<number>`count(*)::int` }).from(followsTable).where(eq(followsTable.followerId, profile[0].userId));
  res.json({ followers: followers[0].c, following: following[0].c });
});

export default router;
