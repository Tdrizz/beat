import {
  db,
  submittedTutorialsTable,
  tutorialBookmarksTable,
  emailPreferencesTable,
  digestSendsTable,
  profilesTable,
  CURATED_TUTORIAL_META,
  type TutorialCategory,
  type TutorialDifficulty,
} from "@workspace/db";
import { and, desc, eq, gte, inArray, or, sql } from "drizzle-orm";
import { notify } from "./notify";

// ---------------------------------------------------------------------------
// Weekly "new tutorials you'd love" digest.
//
// Selection: for every user with >=1 bookmark (and not opted out), infer the
// categories/difficulties they like from what they've saved, then pick fresh
// (recently published) creator tutorials in those categories. Curated
// catalogue tutorials never change week to week, so "fresh" content comes
// from the submitted_tutorials table.
//
// This module owns all DB access but takes the two *external* side effects —
// sending mail (Resend) and resolving Clerk emails — as injected functions so
// it stays testable and decoupled from any specific provider.
// ---------------------------------------------------------------------------

export interface DigestEmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
  headers: Record<string, string>;
}

/** Sends one email. Must throw on failure so the caller can release the claim. */
export type EmailSender = (msg: DigestEmailMessage) => Promise<void>;

/** Resolves Clerk userIds to their primary email address (missing = skip). */
export type EmailLookup = (userIds: string[]) => Promise<Map<string, string>>;

export interface DigestLogger {
  info: (obj: unknown, msg?: string) => void;
  warn: (obj: unknown, msg?: string) => void;
  error: (obj: unknown, msg?: string) => void;
}

export interface RunWeeklyDigestOptions {
  send: EmailSender;
  lookupEmails: EmailLookup;
  /** Public origin of the app, no trailing slash, e.g. `https://glamr.app`. */
  appBaseUrl: string;
  /** Full unsubscribe endpoint, e.g. `https://glamr.app/api/digest/unsubscribe`. */
  unsubscribeUrl: string;
  now?: Date;
  freshWithinDays?: number; // default 7
  maxTutorials?: number; // default 5
  minTutorials?: number; // default 3 (pad target when matches are thin)
  log?: DigestLogger;
}

export interface RunWeeklyDigestResult {
  weekStart: string;
  freshCount: number;
  candidates: number;
  sent: number;
  skippedNoMatch: number;
  skippedNoEmail: number;
  skippedAlreadySent: number;
  skippedOptedOut: number;
  failed: number;
}

interface FreshTutorial {
  id: string;
  title: string;
  category: TutorialCategory;
  difficulty: TutorialDifficulty;
  minutes: number;
  summary: string;
  thumbnail: string;
  authorId: string;
}

interface Tastes {
  categories: Set<TutorialCategory>;
  difficulties: Set<TutorialDifficulty>;
  bookmarkedIds: Set<string>;
}

const noopLog: DigestLogger = { info: () => {}, warn: () => {}, error: () => {} };

/** Monday (UTC) of the ISO week containing `d`, as a `YYYY-MM-DD` string. */
export function weekStartUTC(d: Date): string {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = date.getUTCDay(); // 0 = Sunday … 6 = Saturday
  const shift = day === 0 ? -6 : 1 - day; // back up to Monday
  date.setUTCDate(date.getUTCDate() + shift);
  return date.toISOString().slice(0, 10);
}

/**
 * Pick the tutorials to feature for one user.
 *
 * Ranking: category AND difficulty match first, then category-only match
 * (newest first within each tier). If fewer than `min` category matches
 * exist, pad with other fresh tutorials (newest first) up to `min`. Returns
 * `[]` when there is no category match at all — those users are skipped so we
 * never send an irrelevant digest.
 */
export function pickForUser(
  fresh: FreshTutorial[],
  tastes: Tastes,
  authorId: string,
  min: number,
  max: number,
): FreshTutorial[] {
  const eligible = fresh.filter(
    (t) => t.authorId !== authorId && !tastes.bookmarkedIds.has(t.id),
  );
  const categoryMatches = eligible.filter((t) => tastes.categories.has(t.category));
  if (categoryMatches.length === 0) return [];

  categoryMatches.sort((a, b) => {
    const aBoth = tastes.difficulties.has(a.difficulty) ? 1 : 0;
    const bBoth = tastes.difficulties.has(b.difficulty) ? 1 : 0;
    return bBoth - aBoth; // both-match tier first; array is already newest-first
  });

  const selected = categoryMatches.slice(0, max);
  if (selected.length < min) {
    const chosen = new Set(selected.map((t) => t.id));
    for (const t of eligible) {
      if (selected.length >= min) break;
      if (chosen.has(t.id)) continue;
      selected.push(t);
      chosen.add(t.id);
    }
  }
  return selected;
}

export async function runWeeklyDigest(
  opts: RunWeeklyDigestOptions,
): Promise<RunWeeklyDigestResult> {
  const log = opts.log ?? noopLog;
  const now = opts.now ?? new Date();
  const freshWithinDays = opts.freshWithinDays ?? 7;
  const maxTutorials = opts.maxTutorials ?? 5;
  const minTutorials = opts.minTutorials ?? 3;
  const weekStart = weekStartUTC(now);

  const result: RunWeeklyDigestResult = {
    weekStart,
    freshCount: 0,
    candidates: 0,
    sent: 0,
    skippedNoMatch: 0,
    skippedNoEmail: 0,
    skippedAlreadySent: 0,
    skippedOptedOut: 0,
    failed: 0,
  };

  // 1. Fresh pool — recently published/featured creator tutorials.
  const cutoff = new Date(now.getTime() - freshWithinDays * 24 * 60 * 60 * 1000);
  const fresh: FreshTutorial[] = await db
    .select({
      id: submittedTutorialsTable.id,
      title: submittedTutorialsTable.title,
      category: submittedTutorialsTable.category,
      difficulty: submittedTutorialsTable.difficulty,
      minutes: submittedTutorialsTable.minutes,
      summary: submittedTutorialsTable.summary,
      thumbnail: submittedTutorialsTable.thumbnail,
      authorId: submittedTutorialsTable.authorId,
    })
    .from(submittedTutorialsTable)
    .where(
      and(
        or(
          eq(submittedTutorialsTable.status, "published"),
          eq(submittedTutorialsTable.status, "featured"),
        ),
        gte(submittedTutorialsTable.reviewedAt, cutoff),
      ),
    )
    .orderBy(desc(submittedTutorialsTable.reviewedAt));
  result.freshCount = fresh.length;
  if (fresh.length === 0) {
    log.info({ weekStart }, "Weekly digest: no fresh tutorials this week, nothing to send");
    return result;
  }

  // 2. Candidate users — everyone with at least one bookmark.
  const bookmarkUsers = await db
    .selectDistinct({ userId: tutorialBookmarksTable.userId })
    .from(tutorialBookmarksTable);
  let candidateIds = bookmarkUsers.map((r) => r.userId);
  if (candidateIds.length === 0) return result;

  // 3. Drop opted-out users (absence of a prefs row = subscribed).
  const optedOut = new Set(
    (
      await db
        .select({ userId: emailPreferencesTable.userId })
        .from(emailPreferencesTable)
        .where(eq(emailPreferencesTable.weeklyDigest, false))
    ).map((r) => r.userId),
  );
  // 4. Drop users already sent this week (claim is still authoritative below).
  const alreadySent = new Set(
    (
      await db
        .select({ userId: digestSendsTable.userId })
        .from(digestSendsTable)
        .where(eq(digestSendsTable.weekStart, weekStart))
    ).map((r) => r.userId),
  );
  candidateIds = candidateIds.filter((id) => {
    if (optedOut.has(id)) {
      result.skippedOptedOut += 1;
      return false;
    }
    if (alreadySent.has(id)) {
      result.skippedAlreadySent += 1;
      return false;
    }
    return true;
  });
  result.candidates = candidateIds.length;
  if (candidateIds.length === 0) return result;

  // 5. Bookmarks for all candidates, grouped per user.
  const bookmarkRows = await db
    .select({
      userId: tutorialBookmarksTable.userId,
      tutorialId: tutorialBookmarksTable.tutorialId,
    })
    .from(tutorialBookmarksTable)
    .where(inArray(tutorialBookmarksTable.userId, candidateIds));
  const bookmarksByUser = new Map<string, string[]>();
  for (const row of bookmarkRows) {
    const list = bookmarksByUser.get(row.userId) ?? [];
    list.push(row.tutorialId);
    bookmarksByUser.set(row.userId, list);
  }

  // 6. Taxonomy for submitted tutorials referenced by any bookmark (curated
  //    ids resolve from CURATED_TUTORIAL_META without a query).
  const submittedBookmarkIds = Array.from(
    new Set(
      bookmarkRows
        .map((r) => r.tutorialId)
        .filter((id) => !(id in CURATED_TUTORIAL_META)),
    ),
  );
  const submittedMeta = new Map<string, { category: TutorialCategory; difficulty: TutorialDifficulty }>();
  if (submittedBookmarkIds.length > 0) {
    const rows = await db
      .select({
        id: submittedTutorialsTable.id,
        category: submittedTutorialsTable.category,
        difficulty: submittedTutorialsTable.difficulty,
      })
      .from(submittedTutorialsTable)
      .where(inArray(submittedTutorialsTable.id, submittedBookmarkIds));
    for (const r of rows) submittedMeta.set(r.id, { category: r.category, difficulty: r.difficulty });
  }

  // 7. Resolve emails (batched) + display names for the greeting.
  const emailMap = await opts.lookupEmails(candidateIds);
  const profiles = await db
    .select({ userId: profilesTable.userId, displayName: profilesTable.displayName })
    .from(profilesTable)
    .where(inArray(profilesTable.userId, candidateIds));
  const nameMap = new Map(profiles.map((p) => [p.userId, p.displayName]));

  // 8. Per-user: build, claim, send.
  for (const userId of candidateIds) {
    const tastes = tastesFor(bookmarksByUser.get(userId) ?? [], submittedMeta);
    const picks = pickForUser(fresh, tastes, userId, minTutorials, maxTutorials);
    if (picks.length === 0) {
      result.skippedNoMatch += 1;
      continue;
    }

    // Keep the recommendation useful for members who opted out of email (or
    // whose account has no email address): surface one in-app alert per
    // weekly run. The claim below still makes the overall run idempotent.
    await notify({
      recipientId: userId,
      kind: "system",
      body: picks.length === 1
        ? `A new tutorial matches your taste: ${picks[0].title}`
        : `${picks.length} fresh tutorials match your taste`,
    });

    const email = emailMap.get(userId);
    if (!email) {
      result.skippedNoEmail += 1;
      continue;
    }

    // Claim the weekly slot BEFORE sending. An empty return means another
    // run grabbed it first (race) — skip without sending.
    const claim = await db
      .insert(digestSendsTable)
      .values({ userId, weekStart, tutorialIds: picks.map((t) => t.id) })
      .onConflictDoNothing({ target: [digestSendsTable.userId, digestSendsTable.weekStart] })
      .returning({ id: digestSendsTable.id });
    if (claim.length === 0) {
      result.skippedAlreadySent += 1;
      continue;
    }

    try {
      const token = await ensureUnsubscribeToken(userId);
      const unsubscribeLink = `${opts.unsubscribeUrl}?token=${token}`;
      const message = renderDigestEmail({
        to: email,
        displayName: nameMap.get(userId) ?? null,
        tutorials: picks,
        appBaseUrl: opts.appBaseUrl,
        unsubscribeLink,
      });
      await opts.send(message);
      result.sent += 1;
    } catch (err) {
      // Release the claim so a later run can retry this user this week.
      await db
        .delete(digestSendsTable)
        .where(
          and(eq(digestSendsTable.userId, userId), eq(digestSendsTable.weekStart, weekStart)),
        );
      result.failed += 1;
      log.error({ err, userId }, "Weekly digest: send failed, released claim");
    }
  }

  log.info({ ...result }, "Weekly digest run complete");
  return result;
}

function tastesFor(
  bookmarkIds: string[],
  submittedMeta: Map<string, { category: TutorialCategory; difficulty: TutorialDifficulty }>,
): Tastes {
  const categories = new Set<TutorialCategory>();
  const difficulties = new Set<TutorialDifficulty>();
  for (const id of bookmarkIds) {
    const meta =
      id in CURATED_TUTORIAL_META
        ? CURATED_TUTORIAL_META[id as keyof typeof CURATED_TUTORIAL_META]
        : submittedMeta.get(id);
    if (!meta) continue;
    categories.add(meta.category);
    difficulties.add(meta.difficulty);
  }
  return { categories, difficulties, bookmarkedIds: new Set(bookmarkIds) };
}

/** Upserts the user's prefs row and returns their unsubscribe token. */
async function ensureUnsubscribeToken(userId: string): Promise<string> {
  const rows = await db
    .insert(emailPreferencesTable)
    .values({ userId })
    .onConflictDoUpdate({
      target: emailPreferencesTable.userId,
      set: { updatedAt: new Date() },
    })
    .returning({ token: emailPreferencesTable.unsubscribeToken });
  return rows[0].token;
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

const CATEGORY_LABELS: Record<TutorialCategory, string> = {
  eyes: "Eyes",
  lips: "Lips",
  contouring: "Contouring",
  skincare: "Skincare",
  brows: "Brows",
  foundation: "Foundation",
};
const DIFFICULTY_LABELS: Record<TutorialDifficulty, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function absThumb(appBaseUrl: string, thumbnail: string): string {
  if (/^https?:/i.test(thumbnail)) return thumbnail;
  if (thumbnail.startsWith("/objects/")) return `${appBaseUrl}/api/storage${thumbnail}`;
  if (thumbnail.startsWith("/")) return `${appBaseUrl}${thumbnail}`;
  return thumbnail;
}

interface RenderArgs {
  to: string;
  displayName: string | null;
  tutorials: FreshTutorial[];
  appBaseUrl: string;
  unsubscribeLink: string;
}

export function renderDigestEmail(args: RenderArgs): DigestEmailMessage {
  const { displayName, tutorials, appBaseUrl, unsubscribeLink } = args;
  const greetingName = displayName ? esc(displayName.split(/\s+/)[0]) : "there";
  const subject =
    tutorials.length === 1
      ? `A new tutorial we think you'll love: ${tutorials[0].title}`
      : `${tutorials.length} new tutorials we think you'll love`;

  const cards = tutorials
    .map((t) => {
      const url = `${appBaseUrl}/tutorials/${encodeURIComponent(t.id)}`;
      const img = esc(absThumb(appBaseUrl, t.thumbnail));
      const meta = `${CATEGORY_LABELS[t.category]} · ${DIFFICULTY_LABELS[t.difficulty]} · ${t.minutes} min`;
      return `
      <tr>
        <td style="padding:0 0 20px 0;">
          <a href="${url}" style="text-decoration:none;color:inherit;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f0e6ee;border-radius:14px;overflow:hidden;background:#ffffff;">
              <tr>
                <td style="width:120px;vertical-align:top;">
                  <img src="${img}" alt="" width="120" height="120" style="display:block;width:120px;height:120px;object-fit:cover;" />
                </td>
                <td style="padding:14px 16px;vertical-align:top;">
                  <div style="font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#b06a9a;font-weight:600;">${esc(meta)}</div>
                  <div style="font-size:17px;font-weight:700;color:#2b2030;margin:4px 0 6px 0;">${esc(t.title)}</div>
                  <div style="font-size:13px;line-height:1.45;color:#6b6470;">${esc(t.summary)}</div>
                </td>
              </tr>
            </table>
          </a>
        </td>
      </tr>`;
    })
    .join("");

  const html = `<!doctype html>
<html lang="en">
<body style="margin:0;padding:0;background:#faf5f8;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf5f8;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
          <tr>
            <td style="padding:8px 4px 20px 4px;">
              <div style="font-size:24px;font-weight:800;color:#c0508f;letter-spacing:-.02em;">Glamr</div>
              <div style="font-size:15px;color:#3a3340;margin-top:14px;">Hi ${greetingName},</div>
              <div style="font-size:15px;line-height:1.5;color:#6b6470;margin-top:6px;">
                Fresh tutorials just dropped in the categories you've been saving. Here's what we think you'll love this week:
              </div>
            </td>
          </tr>
          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${cards}</table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:8px 0 24px 0;">
              <a href="${appBaseUrl}/tutorials" style="display:inline-block;background:#c0508f;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 26px;border-radius:999px;">Browse all tutorials</a>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 4px;border-top:1px solid #efe3ec;">
              <div style="font-size:12px;line-height:1.5;color:#9a93a1;">
                You're receiving this because you saved tutorials on Glamr.
                <a href="${unsubscribeLink}" style="color:#b06a9a;text-decoration:underline;">Unsubscribe from weekly digests</a>.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const textLines = [
    `Hi ${displayName ? displayName.split(/\s+/)[0] : "there"},`,
    "",
    "Fresh tutorials just dropped in the categories you've been saving:",
    "",
    ...tutorials.map(
      (t) =>
        `• ${t.title} (${CATEGORY_LABELS[t.category]} · ${DIFFICULTY_LABELS[t.difficulty]} · ${t.minutes} min)\n  ${appBaseUrl}/tutorials/${encodeURIComponent(t.id)}`,
    ),
    "",
    `Browse all tutorials: ${appBaseUrl}/tutorials`,
    "",
    `Unsubscribe from weekly digests: ${unsubscribeLink}`,
  ];

  return {
    to: args.to,
    subject,
    html,
    text: textLines.join("\n"),
    headers: {
      "List-Unsubscribe": `<${unsubscribeLink}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  };
}
