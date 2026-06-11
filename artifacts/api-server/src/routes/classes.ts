import { Router, type IRouter } from "express";
import {
  db, classesTable, classReservationsTable, profilesTable,
  insertClassSchema, type Class,
} from "@workspace/db";
import { and, asc, desc, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { requireAuth, optionalAuth } from "../middlewares/requireAuth";
import { requirePremium } from "../middlewares/requirePremium";
import { rateLimit } from "../middlewares/rateLimit";
import { p } from "../lib/params";
import { publicProfileOrNull } from "../lib/publicProfile";

const router: IRouter = Router();

// Hydrate a list of class rows with their instructor profile + RSVP count
// + (optionally) whether the viewer has reserved. Single round-trip per
// auxiliary set so the catalog page never N+1s.
async function hydrateClasses(rows: Class[], viewerId?: string) {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const instructorIds = Array.from(new Set(rows.map((r) => r.instructorId)));
  const { isUserPremium } = await import("../lib/premium");
  const [instructors, counts, mine, viewerPremium] = await Promise.all([
    db.select().from(profilesTable).where(inArray(profilesTable.userId, instructorIds)),
    db
      .select({ classId: classReservationsTable.classId, c: sql<number>`count(*)::int` })
      .from(classReservationsTable)
      .where(inArray(classReservationsTable.classId, ids))
      .groupBy(classReservationsTable.classId),
    viewerId
      ? db
          .select({ classId: classReservationsTable.classId })
          .from(classReservationsTable)
          .where(and(
            eq(classReservationsTable.userId, viewerId),
            inArray(classReservationsTable.classId, ids),
          ))
      : Promise.resolve([] as Array<{ classId: string }>),
    viewerId ? isUserPremium(viewerId) : Promise.resolve(false),
  ]);
  const byId = new Map(instructors.map((i) => [i.userId, i]));
  const countById = new Map(counts.map((c) => [c.classId, c.c]));
  const reservedSet = new Set(mine.map((r) => r.classId));
  return rows.map((r) => {
    // Premium content is gated server-side: the playable URL is redacted
    // for viewers who are neither premium nor the instructor. The boolean
    // `canWatch` lets the client render the right CTA without leaking the
    // URL itself.
    const canWatch = !r.isPremium || viewerPremium || r.instructorId === viewerId;
    return {
      ...r,
      videoUrl: canWatch ? r.videoUrl : null,
      canWatch,
      instructor: publicProfileOrNull(byId.get(r.instructorId) ?? null),
      reservationCount: countById.get(r.id) ?? 0,
      reservedByMe: reservedSet.has(r.id),
    };
  });
}

/* ── Catalog ──────────────────────────────────────────────────────────────
 * `when` filter:
 *   • `upcoming` (default) — classes scheduled now or later, soonest first
 *   • `past` — classes that have already wrapped, most recent first
 *   • `all` — everything, soonest upcoming first
 * `mood` and `difficulty` are optional facets. */
router.get("/classes", optionalAuth, async (req, res) => {
  const when = String(req.query["when"] ?? "upcoming");
  const mood = typeof req.query["mood"] === "string" ? req.query["mood"] : null;
  const difficulty = typeof req.query["difficulty"] === "string" ? req.query["difficulty"] : null;
  const limit = Math.min(parseInt(String(req.query["limit"] ?? "60"), 10) || 60, 200);

  const conds = [];
  const now = new Date();
  if (when === "upcoming") conds.push(gte(classesTable.scheduledFor, now));
  if (when === "past") conds.push(lt(classesTable.scheduledFor, now));
  if (mood) conds.push(eq(classesTable.moodTag, mood));
  if (difficulty) conds.push(eq(classesTable.difficulty, difficulty));

  const rows = await db
    .select()
    .from(classesTable)
    .where(conds.length > 0 ? and(...conds) : undefined)
    .orderBy(when === "past" ? desc(classesTable.scheduledFor) : asc(classesTable.scheduledFor))
    .limit(limit);

  const hydrated = await hydrateClasses(rows, req.userId);
  res.json({ classes: hydrated });
});

/* ── Classes the signed-in user is hosting ─────────────────────────────── */
router.get("/classes/me/hosting", requireAuth, async (req, res) => {
  const rows = await db
    .select()
    .from(classesTable)
    .where(eq(classesTable.instructorId, req.userId!))
    .orderBy(asc(classesTable.scheduledFor));
  const hydrated = await hydrateClasses(rows, req.userId);
  res.json({ classes: hydrated });
});

/* ── Classes the signed-in user has reserved ───────────────────────────── */
router.get("/classes/me/reservations", requireAuth, async (req, res) => {
  const rows = await db
    .select({
      cls: classesTable,
    })
    .from(classReservationsTable)
    .innerJoin(classesTable, eq(classesTable.id, classReservationsTable.classId))
    .where(eq(classReservationsTable.userId, req.userId!))
    .orderBy(asc(classesTable.scheduledFor));
  const hydrated = await hydrateClasses(rows.map((r) => r.cls), req.userId);
  res.json({ classes: hydrated });
});

/* ── Class detail ──────────────────────────────────────────────────────── */
router.get("/classes/:id", optionalAuth, async (req, res) => {
  const id = p(req.params.id);
  const rows = await db.select().from(classesTable).where(eq(classesTable.id, id)).limit(1);
  if (rows.length === 0) {
    res.status(404).json({ error: "Class not found" });
    return;
  }
  const [hydrated] = await hydrateClasses(rows, req.userId);
  res.json({ class: hydrated });
});

/* ── Host a class (Premium required) ───────────────────────────────────── */
router.post(
  "/classes",
  requireAuth,
  requirePremium,
  rateLimit({ scope: "class-create", max: 10, windowMs: 60 * 60_000 }),
  async (req, res) => {
    const parsed = insertClassSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
      return;
    }
    const ins = await db
      .insert(classesTable)
      .values({
        ...parsed.data,
        instructorId: req.userId!,
      })
      .returning();
    res.status(201).json({ class: ins[0] });
  },
);

/* ── Reserve / cancel reservation ──────────────────────────────────────── *
 * Reservations are free for free classes; for premium classes we require
 * an active subscription so the catalog promise ("watch all premium
 * classes with Premium") is enforced server-side too. */
router.post(
  "/classes/:id/reserve",
  requireAuth,
  rateLimit({ scope: "class-rsvp", max: 60, windowMs: 60_000 }),
  async (req, res) => {
    const id = p(req.params.id);
    const cls = await db.select().from(classesTable).where(eq(classesTable.id, id)).limit(1);
    if (cls.length === 0) {
      res.status(404).json({ error: "Class not found" });
      return;
    }
    if (cls[0].isPremium) {
      const { isUserPremium } = await import("../lib/premium");
      if (!(await isUserPremium(req.userId!))) {
        res.status(402).json({ error: "Premium required to reserve this class", code: "PREMIUM_REQUIRED" });
        return;
      }
    }
    await db
      .insert(classReservationsTable)
      .values({ classId: id, userId: req.userId! })
      .onConflictDoNothing({ target: [classReservationsTable.userId, classReservationsTable.classId] });
    res.status(204).end();
  },
);

router.delete("/classes/:id/reserve", requireAuth, async (req, res) => {
  const id = p(req.params.id);
  await db
    .delete(classReservationsTable)
    .where(and(
      eq(classReservationsTable.classId, id),
      eq(classReservationsTable.userId, req.userId!),
    ));
  res.status(204).end();
});

export default router;
