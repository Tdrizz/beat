import { Router, type IRouter, type Request, type Response } from "express";
import { db, emailPreferencesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod/v4";
import { clerkClient } from "@clerk/express";
import { runWeeklyDigest, type EmailLookup } from "../lib/digest";
import { sendEmail } from "../lib/email";
import { publicAppUrl } from "../lib/publicUrl";
import { rateLimit } from "../middlewares/rateLimit";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

router.get("/digest/preferences", requireAuth, async (req, res) => {
  const [preference] = await db
    .select({ weeklyDigest: emailPreferencesTable.weeklyDigest })
    .from(emailPreferencesTable)
    .where(eq(emailPreferencesTable.userId, req.userId!))
    .limit(1);
  res.json({ weeklyDigest: preference?.weeklyDigest ?? true });
});

router.put("/digest/preferences", requireAuth, async (req, res) => {
  const parsed = z.object({ weeklyDigest: z.boolean() }).strict().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid preferences" });
    return;
  }
  const [preference] = await db
    .insert(emailPreferencesTable)
    .values({ userId: req.userId!, weeklyDigest: parsed.data.weeklyDigest })
    .onConflictDoUpdate({
      target: emailPreferencesTable.userId,
      set: { weeklyDigest: parsed.data.weeklyDigest, updatedAt: new Date() },
    })
    .returning({ weeklyDigest: emailPreferencesTable.weeklyDigest });
  res.json(preference);
});

// Constant-time compare against CRON_SECRET. Denies when unset so the trigger
// can never be hit before the secret is configured.
function cronSecretOk(provided: string | undefined): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

// Batched Clerk lookup: userId -> primary email address.
const lookupEmails: EmailLookup = async (userIds) => {
  const map = new Map<string, string>();
  for (let i = 0; i < userIds.length; i += 100) {
    const chunk = userIds.slice(i, i + 100);
    const users = await clerkClient.users.getUserList({
      userId: chunk,
      limit: chunk.length,
    });
    for (const u of users.data) {
      const primary =
        u.emailAddresses.find((e) => e.id === u.primaryEmailAddressId)?.emailAddress ??
        u.emailAddresses[0]?.emailAddress;
      if (primary) map.set(u.id, primary);
    }
  }
  return map;
};

// POST /api/digest/run — secret-guarded trigger driven by an external weekly
// scheduler (the API may scale to zero between requests, so an in-process
// timer can't be relied on). Idempotent per user per ISO week.
router.post("/digest/run", async (req, res) => {
  const provided =
    req.get("x-cron-secret") ??
    (typeof req.query["secret"] === "string" ? req.query["secret"] : undefined);
  if (!cronSecretOk(provided)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const base = publicAppUrl();
    const summary = await runWeeklyDigest({
      send: sendEmail,
      lookupEmails,
      appBaseUrl: base,
      unsubscribeUrl: `${base}/api/digest/unsubscribe`,
      log: req.log,
    });
    res.json({ ok: true, ...summary });
  } catch (err) {
    req.log?.error?.({ err }, "Weekly digest run failed");
    res.status(500).json({ error: "Digest run failed" });
  }
});

// ── One-click unsubscribe / resubscribe ───────────────────────────────────
// Rate-limited by IP so corporate link scanners / prefetchers can't hammer it.
const unsubLimit = rateLimit({ scope: "digest-unsub", max: 30, windowMs: 60_000 });

function page(title: string, body: string): string {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>${title} · Glamr</title></head>
<body style="margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#faf5f8;color:#2b2030;">
  <div style="max-width:460px;margin:14vh auto 0;padding:32px 28px;background:#fff;border:1px solid #f0e6ee;border-radius:18px;text-align:center;">
    <div style="font-size:22px;font-weight:800;color:#c0508f;margin-bottom:14px;">Glamr</div>
    ${body}
  </div>
</body></html>`;
}

async function setWeeklyDigest(token: string, value: boolean) {
  return db
    .update(emailPreferencesTable)
    .set({ weeklyDigest: value, updatedAt: new Date() })
    .where(eq(emailPreferencesTable.unsubscribeToken, token))
    .returning({ userId: emailPreferencesTable.userId });
}

function getToken(req: Request): string {
  return typeof req.query["token"] === "string" ? req.query["token"] : "";
}

async function handleUnsubscribe(req: Request, res: Response) {
  const token = getToken(req);
  if (!UUID_RE.test(token)) {
    res
      .status(400)
      .type("html")
      .send(page("Invalid link", `<p style="color:#6b6470;">This unsubscribe link is invalid or expired.</p>`));
    return;
  }
  const rows = await setWeeklyDigest(token, false);
  if (rows.length === 0) {
    res
      .status(404)
      .type("html")
      .send(page("Not found", `<p style="color:#6b6470;">We couldn't find this subscription — it may already be removed.</p>`));
    return;
  }
  const resubscribe = `/api/digest/resubscribe?token=${encodeURIComponent(token)}`;
  res.status(200).type("html").send(
    page(
      "Unsubscribed",
      `<p style="font-size:16px;font-weight:600;margin:0 0 8px;">You're unsubscribed 👋</p>
       <p style="color:#6b6470;margin:0 0 20px;">You won't get weekly tutorial digests anymore. Changed your mind?</p>
       <a href="${resubscribe}" style="display:inline-block;background:#c0508f;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:11px 24px;border-radius:999px;">Resubscribe</a>`,
    ),
  );
}

// GET flips immediately (true one-click). POST supports RFC 8058 one-click
// (List-Unsubscribe-Post) from mail clients.
router.get("/digest/unsubscribe", unsubLimit, handleUnsubscribe);
router.post("/digest/unsubscribe", unsubLimit, handleUnsubscribe);

router.get("/digest/resubscribe", unsubLimit, async (req, res) => {
  const token = getToken(req);
  if (!UUID_RE.test(token)) {
    res
      .status(400)
      .type("html")
      .send(page("Invalid link", `<p style="color:#6b6470;">This link is invalid or expired.</p>`));
    return;
  }
  const rows = await setWeeklyDigest(token, true);
  if (rows.length === 0) {
    res
      .status(404)
      .type("html")
      .send(page("Not found", `<p style="color:#6b6470;">We couldn't find this subscription.</p>`));
    return;
  }
  res.status(200).type("html").send(
    page(
      "Resubscribed",
      `<p style="font-size:16px;font-weight:600;margin:0 0 8px;">You're back in 🎉</p>
       <p style="color:#6b6470;margin:0;">You'll receive weekly tutorial digests again.</p>`,
    ),
  );
});

export default router;
