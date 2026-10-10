import { Router, type IRouter } from "express";
import { ai, GEMINI_CHAT_MODEL } from "@workspace/integrations-gemini-ai";
import { aiBudget } from "../lib/aiBudget";
import {
  db,
  chatThreadsTable,
  chatMessagesTable,
  profilesTable,
  type ChatMessage,
  type Profile,
} from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../middlewares/requireAuth";
import { rateLimit } from "../middlewares/rateLimit";

const router: IRouter = Router();

// How many of the most recent messages we restore to the client and feed
// back to the model as context. Keeps the prompt bounded (and cost
// predictable) on long-running threads.
const HISTORY_LIMIT = 30;

// Human-readable labels for the six beauty archetypes so the system prompt
// can speak to the user by name ("Hey, Siren …"). Mirrors lib/archetypes.
const ARCHETYPE_LABELS: Record<string, string> = {
  romantic: "The Romantic",
  siren: "The Siren",
  icon: "The Icon",
  muse: "The Muse",
  rebel: "The Rebel",
  naturalist: "The Naturalist",
};

// Short finish-focused nudges per archetype, so Iola tailors advice to the
// user's stated personality without us re-deriving them client-side.
const ARCHETYPE_FLAVOUR: Record<string, string> = {
  romantic: "soft, dewy, rose/peach palettes, glowy lit-from-within skin.",
  siren: "smouldering high-impact eyes, bold lips, bronze sculpting, satin skin.",
  icon: "polished, timeless, precise lines, classic red, second-skin base.",
  muse: "painterly, iridescent, unexpected colour temperatures, ethereal skin.",
  rebel: "graphic, high-contrast liner, matte/dark lips, unconventional brows.",
  naturalist: "fresh, skin-first, sheer washes, tinted balms, no heavy product.",
};

/** First name for a friendly greeting — falls back to the @handle. */
function firstName(p: Profile | null): string {
  if (!p) return "there";
  const dn = p.displayName?.trim();
  if (dn) return dn.split(/\s+/)[0];
  return p.handle ?? "there";
}

/**
 * Compose Iola's system prompt: a static persona block grounded in the
 * signed-in user's archetype + skin tone, plus an optional bounded list of
 * their favourite look names (the client owns favourites in localStorage, so
 * it passes a short list along). Topic-locked to beauty.
 */
function buildSystemPrompt(profile: Profile | null, favourites: string[]): string {
  const name = firstName(profile);
  const lines: string[] = [];
  lines.push(
    "You are Iola, the in-house beauty muse for Beat — a warm, witty, encouraging makeup, skincare and beauty expert.",
  );
  lines.push(
    `You are chatting with ${name}. Greet them by name occasionally and keep a friendly, hype-girl-but-knowledgeable tone. Be concise: 1-3 short paragraphs or a tight bulleted list, never a wall of text.`,
  );
  lines.push("");
  lines.push("YOU CAN HELP WITH:");
  lines.push(
    "- Product picks, shade/undertone matching, dupes for high-end products, routines (e.g. 5-minute glam), application technique, what to pair, and interpreting their beauty archetype.",
  );
  lines.push(
    "- Flagging allergy/sensitivity red-flags (e.g. fragrance, essential oils, common irritants) and suggesting patch-testing — but make clear you are not a doctor and serious reactions need a professional.",
  );
  lines.push("");

  if (profile?.archetype && ARCHETYPE_LABELS[profile.archetype]) {
    const label = ARCHETYPE_LABELS[profile.archetype];
    const flavour = ARCHETYPE_FLAVOUR[profile.archetype] ?? "";
    lines.push(
      `${name}'s beauty archetype is ${label} — lean their recommendations toward: ${flavour} Reference this when it helps, but don't force it into every reply.`,
    );
  } else {
    lines.push(
      `${name} hasn't taken the Iola archetype quiz yet — if it's relevant, you can gently suggest it for more personalised picks.`,
    );
  }

  if (profile?.skinTone) {
    lines.push(
      `Their recorded skin tone is "${profile.skinTone}" — keep shade and foundation advice flattering for that tone.`,
    );
  }

  if (favourites.length > 0) {
    lines.push(
      `Looks they've recently saved as favourites: ${favourites.join(", ")}. You can reference these for "what to pair" or "more like this" suggestions.`,
    );
  }

  lines.push("");
  lines.push("STRICT RULES:");
  lines.push(
    "- Stay on beauty topics (makeup, skincare, hair/wigs, nails, fragrance, beauty tools, routines). If asked about something unrelated (coding, finance, politics, general trivia, etc.), gracefully decline with something like \"I'm here for makeup magic — let's stick to that 💄\" and steer back to beauty.",
  );
  lines.push("- Never invent specific prices or claim a product is in stock; speak generally about product types and well-known lines.");
  lines.push("- When you name a product, write it plainly (Brand — Product) so the app can linkify it; do not output markdown links or images.");
  lines.push("- No medical diagnosis. For skin conditions or reactions, recommend a dermatologist.");
  return lines.join("\n");
}

/** Return the user's active (most recent) thread, creating one if none exist. */
async function getOrCreateActiveThread(userId: string) {
  const existing = await db
    .select()
    .from(chatThreadsTable)
    .where(eq(chatThreadsTable.userId, userId))
    .orderBy(desc(chatThreadsTable.createdAt))
    .limit(1);
  if (existing.length > 0) return existing[0];
  const inserted = await db
    .insert(chatThreadsTable)
    .values({ userId })
    .returning();
  return inserted[0];
}

/* ── GET active thread + recent messages ───────────────────────────────── */
router.get("/chat/thread", requireAuth, async (req, res) => {
  const userId = req.userId!;
  const thread = await getOrCreateActiveThread(userId);
  // Fetch the most recent N, then flip to chronological (oldest→newest) so
  // the transcript renders in order. Selecting asc().limit() would return
  // the OLDEST N and hide recent turns on long threads.
  const recent = await db
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.threadId, thread.id))
    .orderBy(desc(chatMessagesTable.createdAt))
    .limit(HISTORY_LIMIT);
  const messages = recent.reverse();

  const profileRows = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.userId, userId))
    .limit(1);
  const profile = profileRows[0] ?? null;

  res.json({
    threadId: thread.id,
    messages: messages.map((m) => ({ id: m.id, role: m.role, content: m.content, createdAt: m.createdAt })),
    greetingName: firstName(profile),
    archetype: profile?.archetype ?? null,
  });
});

/* ── Reset: start a fresh thread (history preserved in DB) ──────────────── */
router.post("/chat/thread/reset", requireAuth, async (req, res) => {
  const userId = req.userId!;
  const inserted = await db
    .insert(chatThreadsTable)
    .values({ userId })
    .returning();
  res.status(201).json({ threadId: inserted[0].id });
});

const MessageBody = z.object({
  content: z.string().min(1).max(2000),
  // Optional bounded list of favourite look names from the client's
  // localStorage, used only to ground the system prompt. Sanitised &
  // length-capped to keep the prompt bounded.
  favourites: z.array(z.string().min(1).max(80)).max(12).optional(),
});

/* ── POST a message → stream Iola's reply over SSE ─────────────────────── *
 * SECURITY/COST: requireAuth + a 30/5-min token bucket are mandatory — each
 * call hits Gemini text generation (metered). The bucket covers an active
 * chat session without enabling abuse. */
router.post(
  "/chat/messages",
  requireAuth,
  rateLimit({ scope: "chat", max: 30, windowMs: 5 * 60_000 }),
  aiBudget("chat"),
  async (req, res) => {
    const log = req.log;
    const userId = req.userId!;
    const parsed = MessageBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
      return;
    }
    const { content } = parsed.data;
    const favourites = parsed.data.favourites ?? [];

    const thread = await getOrCreateActiveThread(userId);

    // Load prior transcript (before persisting the new user message) so we
    // can replay it to the model as context. Take the most recent N, then
    // flip to chronological order — asc().limit() would feed the model the
    // OLDEST turns and ignore recent context on long threads.
    const history = (
      await db
        .select()
        .from(chatMessagesTable)
        .where(eq(chatMessagesTable.threadId, thread.id))
        .orderBy(desc(chatMessagesTable.createdAt))
        .limit(HISTORY_LIMIT)
    ).reverse();

    // Persist the user's message immediately so it survives a dropped stream.
    await db.insert(chatMessagesTable).values({
      threadId: thread.id,
      role: "user",
      content,
    });
    await db
      .update(chatThreadsTable)
      .set({ lastMessageAt: new Date() })
      .where(eq(chatThreadsTable.id, thread.id));

    const profileRows = await db
      .select()
      .from(profilesTable)
      .where(eq(profilesTable.userId, userId))
      .limit(1);
    const systemPrompt = buildSystemPrompt(profileRows[0] ?? null, favourites);

    // Map our stored transcript + the new turn into Gemini's content format.
    // Gemini uses role "model" for assistant turns.
    const contents = [
      ...history.map((m: ChatMessage) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      { role: "user", parts: [{ text: content }] },
    ];

    // Open the SSE stream.
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders?.();

    const send = (event: string, data: unknown) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    let assistantText = "";
    try {
      const stream = await ai.models.generateContentStream({
        model: GEMINI_CHAT_MODEL,
        contents,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.8,
          maxOutputTokens: 1024,
        },
      });

      for await (const chunk of stream) {
        const piece = chunk.text;
        if (piece) {
          assistantText += piece;
          send("token", { text: piece });
        }
        const usage = chunk.usageMetadata;
        if (usage) {
          log.info(
            {
              promptTokens: usage.promptTokenCount,
              outputTokens: usage.candidatesTokenCount,
              totalTokens: usage.totalTokenCount,
            },
            "chat token usage",
          );
        }
      }

      if (!assistantText.trim()) {
        assistantText = "Sorry, I blanked for a second — try asking that again?";
        send("token", { text: assistantText });
      }

      // Persist the assistant reply on completion.
      const [saved] = await db
        .insert(chatMessagesTable)
        .values({ threadId: thread.id, role: "assistant", content: assistantText })
        .returning();
      await db
        .update(chatThreadsTable)
        .set({ lastMessageAt: new Date() })
        .where(eq(chatThreadsTable.id, thread.id));

      send("done", { id: saved.id, content: assistantText });
      res.end();
    } catch (err) {
      log.error({ err }, "chat stream failed");
      // If we already started streaming, surface the error over SSE;
      // otherwise the headers are committed so we can't switch to JSON.
      send("error", { error: "Iola hit a snag. Try again in a moment." });
      // Best-effort: persist whatever partial text we streamed so the thread
      // stays consistent on reload.
      if (assistantText.trim()) {
        await db
          .insert(chatMessagesTable)
          .values({ threadId: thread.id, role: "assistant", content: assistantText })
          .catch(() => undefined);
      }
      res.end();
    }
  },
);

export default router;
