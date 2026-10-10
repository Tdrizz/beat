import { Router, type IRouter } from "express";
import { db, followsTable, profilesTable } from "@workspace/db";
import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { clerkClient } from "@clerk/express";
import { requireAuth, optionalAuth } from "../middlewares/requireAuth";
import { rateLimit } from "../middlewares/rateLimit";
import { notify } from "../lib/notify";
import { p } from "../lib/params";
import { hiddenUserIds, isBlockedEitherWay } from "../lib/blocks";

const router: IRouter = Router();

/* Shared select shape used by Friends/Discover/Featured endpoints.
 * We expose a `followerCount` aggregate so the client can render social
 * proof badges ("12.3k followers") without an N+1 round-trip. */
const profileWithFollowersCols = {
  userId: profilesTable.userId,
  handle: profilesTable.handle,
  displayName: profilesTable.displayName,
  bio: profilesTable.bio,
  avatarUrl: profilesTable.avatarUrl,
  archetype: profilesTable.archetype,
  isCreator: profilesTable.isCreator,
  socialLinks: profilesTable.socialLinks,
  createdAt: profilesTable.createdAt,
  followerCount: sql<number>`(
    SELECT COUNT(*)::int FROM ${followsTable}
    WHERE ${followsTable.followeeId} = ${profilesTable.userId}
  )`.as("follower_count"),
};

router.post("/follows/:userId", requireAuth, rateLimit({ scope: "follow", max: 30, windowMs: 60_000 }), async (req, res) => {
  const target = p(req.params.userId);
  if (target === req.userId) {
    res.status(400).json({ error: "Cannot follow yourself" });
    return;
  }
  if (await isBlockedEitherWay(req.userId!, target)) {
    res.status(403).json({ error: "You can't follow this account" });
    return;
  }
  const existing = await db
    .select()
    .from(followsTable)
    .where(and(eq(followsTable.followerId, req.userId!), eq(followsTable.followeeId, target)))
    .limit(1);
  if (existing.length === 0) {
    const ins = await db
      .insert(followsTable)
      .values({ followerId: req.userId!, followeeId: target })
      .onConflictDoNothing({ target: [followsTable.followerId, followsTable.followeeId] })
      .returning();
    if (ins.length > 0) {
      await notify({ recipientId: target, actorId: req.userId!, kind: "follow" });
    }
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

/* ── Friends list ────────────────────────────────────────────────────────
 * "Friends" in the product = accounts the signed-in user follows. Returns
 * the full profile row + followerCount + followedAt so the Friends page
 * can render rich rows without further round-trips. Most-recently-followed
 * first to mirror the user's mental model ("who did I just add?"). */
router.get("/profiles/me/friends", requireAuth, async (req, res) => {
  const rows = await db
    .select({
      ...profileWithFollowersCols,
      followedAt: followsTable.createdAt,
    })
    .from(followsTable)
    .innerJoin(profilesTable, eq(profilesTable.userId, followsTable.followeeId))
    .where(eq(followsTable.followerId, req.userId!))
    .orderBy(desc(followsTable.createdAt))
    .limit(200);
  res.json({ friends: rows });
});

/* ── Featured creators ───────────────────────────────────────────────────
 * Promoted accounts surfaced on the Friends > Discover tab. Ranking:
 *   1) `is_creator` flag wins (manually curated / affiliate-eligible).
 *   2) follower count desc (organic social proof).
 *   3) profile recency desc (so brand-new creators get a fair chance).
 * Capped at 12 to keep the carousel snappy. */
router.get("/profiles/featured", optionalAuth, async (req, res) => {
  const hidden = await hiddenUserIds(req.userId);
  const rows = await db
    .select(profileWithFollowersCols)
    .from(profilesTable)
    .orderBy(
      desc(profilesTable.isCreator),
      desc(sql`follower_count`),
      desc(profilesTable.createdAt),
    )
    .limit(12 + hidden.size);
  res.json({ featured: rows.filter((r) => !hidden.has(r.userId)).slice(0, 12) });
});

/* ── Search creators by handle / display name / email ────────────────────
 * `q` is matched two ways and merged:
 *   • SQL ILIKE against handle + display_name (always runs).
 *   • If `q` looks like an email (contains "@"), we additionally ask Clerk
 *     for users with that email and look up matching profiles by userId.
 * Email lookup is silently skipped on Clerk failure so a flaky 3rd-party
 * never breaks the primary search. Results are deduped by userId and
 * capped at 25. Self is filtered out for signed-in callers. */
router.get(
  "/profiles/search",
  // requireAuth gates the whole route. We deliberately refuse anonymous
  // callers because the email branch below queries Clerk by emailAddress —
  // exposing that without auth would let anyone enumerate which emails
  // have accounts on the platform (privacy leak).
  requireAuth,
  rateLimit({ scope: "search", max: 60, windowMs: 60_000 }),
  async (req, res) => {
    const q = String(req.query["q"] ?? "").trim();
    if (q.length < 2) {
      res.json({ results: [] });
      return;
    }
    const like = `%${q.replace(/[%_]/g, (m) => `\\${m}`)}%`;

    // Primary: handle / display name match.
    const baseRows = await db
      .select(profileWithFollowersCols)
      .from(profilesTable)
      .where(or(ilike(profilesTable.handle, like), ilike(profilesTable.displayName, like)))
      .orderBy(desc(sql`follower_count`))
      .limit(25);

    // Optional: email lookup via Clerk → profile rows.
    let emailRows: typeof baseRows = [];
    if (q.includes("@")) {
      try {
        const clerkUsers = await clerkClient.users.getUserList({
          emailAddress: [q],
          limit: 10,
        });
        const ids = clerkUsers.data.map((u) => u.id);
        if (ids.length > 0) {
          emailRows = await db
            .select(profileWithFollowersCols)
            .from(profilesTable)
            .where(inArray(profilesTable.userId, ids));
        }
      } catch (err) {
        req.log?.warn?.({ err }, "Clerk email lookup failed; falling back to handle/name search only");
      }
    }

    // Dedupe (handle/name match wins over email match for ordering).
    const seen = await hiddenUserIds(req.userId);
    const merged: typeof baseRows = [];
    for (const row of [...baseRows, ...emailRows]) {
      if (row.userId === req.userId) continue; // never surface self
      if (seen.has(row.userId)) continue;
      seen.add(row.userId);
      merged.push(row);
    }
    res.json({ results: merged.slice(0, 25) });
  },
);

/* ── Bulk follow status ──────────────────────────────────────────────────
 * Given a list of userIds, return the subset the signed-in user already
 * follows. Lets the client paint correct "Follow" vs "Following" labels
 * across an arbitrary list (search results, featured carousel) in one
 * request instead of N. */
router.get("/follows/status", requireAuth, async (req, res) => {
  const ids = String(req.query["ids"] ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 100);
  if (ids.length === 0) {
    res.json({ followingIds: [] });
    return;
  }
  const rows = await db
    .select({ followeeId: followsTable.followeeId })
    .from(followsTable)
    .where(and(eq(followsTable.followerId, req.userId!), inArray(followsTable.followeeId, ids)));
  res.json({ followingIds: rows.map((r) => r.followeeId) });
});

export default router;
