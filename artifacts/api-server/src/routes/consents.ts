import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { z } from "zod/v4";
import { db, userConsentsTable, CONSENT_KINDS, type ConsentKind } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";
import { rateLimit } from "../middlewares/rateLimit";
import { p } from "../lib/params";

const router: IRouter = Router();

const GrantBody = z.object({ version: z.string().trim().min(1).max(16) });

function parseKind(raw: string): ConsentKind | null {
  return (CONSENT_KINDS as readonly string[]).includes(raw) ? (raw as ConsentKind) : null;
}

/** Active consents for the signed-in user, keyed by kind. */
router.get("/me/consents", requireAuth, async (req, res) => {
  const rows = await db.select().from(userConsentsTable).where(eq(userConsentsTable.userId, req.userId!));
  const consents: Record<string, { version: string; grantedAt: Date }> = {};
  for (const r of rows) {
    if (!r.withdrawnAt) consents[r.kind] = { version: r.version, grantedAt: r.grantedAt };
  }
  res.json({ consents });
});

/** Record consent to `kind` at the given policy version. */
router.put("/me/consents/:kind", requireAuth, rateLimit({ scope: "consent", max: 30, windowMs: 60_000 }), async (req, res) => {
  const kind = parseKind(p(req.params.kind));
  const body = GrantBody.safeParse(req.body);
  if (!kind || !body.success) {
    res.status(400).json({ error: "Invalid consent" });
    return;
  }
  const grantedAt = new Date();
  await db
    .insert(userConsentsTable)
    .values({ userId: req.userId!, kind, version: body.data.version, grantedAt })
    .onConflictDoUpdate({
      target: [userConsentsTable.userId, userConsentsTable.kind],
      set: { version: body.data.version, grantedAt, withdrawnAt: null },
    });
  res.status(204).end();
});

/** Withdraw consent; the app will ask again before the next camera use. */
router.delete("/me/consents/:kind", requireAuth, async (req, res) => {
  const kind = parseKind(p(req.params.kind));
  if (!kind) {
    res.status(400).json({ error: "Invalid consent" });
    return;
  }
  await db
    .update(userConsentsTable)
    .set({ withdrawnAt: new Date() })
    .where(and(eq(userConsentsTable.userId, req.userId!), eq(userConsentsTable.kind, kind)));
  res.status(204).end();
});

export default router;
