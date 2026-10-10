import { Router, type IRouter } from "express";
import { db, conversationsTable, messagesTable, profilesTable, insertMessageSchema } from "@workspace/db";
import { and, asc, desc, eq, or, inArray } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { rateLimit } from "../middlewares/rateLimit";
import { notify } from "../lib/notify";
import { p } from "../lib/params";
import { publicProfileOrNull } from "../lib/publicProfile";
import { ObjectStorageService, ObjectNotFoundError } from "../lib/objectStorage";
import { Readable } from "stream";

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();
const MAX_MESSAGE_IMAGE_BYTES = 10 * 1024 * 1024;

async function publicMessage(message: typeof messagesTable.$inferSelect) {
  return {
    ...message,
    imageUrl: message.imageUrl
      ? `/api/conversations/${message.conversationId}/messages/${message.id}/image`
      : null,
  };
}

function pairKey(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

async function getOrCreateConversation(meId: string, otherId: string) {
  const [a, b] = pairKey(meId, otherId);
  const existing = await db
    .select()
    .from(conversationsTable)
    .where(and(eq(conversationsTable.userA, a), eq(conversationsTable.userB, b)))
    .limit(1);
  if (existing.length > 0) return existing[0];
  const [created] = await db.insert(conversationsTable).values({ userA: a, userB: b }).returning();
  return created;
}

router.get("/conversations", requireAuth, async (req, res) => {
  const me = req.userId!;
  const rows = await db
    .select()
    .from(conversationsTable)
    .where(or(eq(conversationsTable.userA, me), eq(conversationsTable.userB, me)))
    .orderBy(desc(conversationsTable.lastMessageAt));
  if (rows.length === 0) {
    res.json([]);
    return;
  }
  const otherIds = rows.map((r) => (r.userA === me ? r.userB : r.userA));
  const profiles = await db.select().from(profilesTable).where(inArray(profilesTable.userId, otherIds));
  const byId = new Map(profiles.map((pr) => [pr.userId, pr]));
  res.json(rows.map((r) => {
    const otherId = r.userA === me ? r.userB : r.userA;
    return { ...r, other: publicProfileOrNull(byId.get(otherId) ?? null) };
  }));
});

// We accept either a Clerk userId or a @handle as the URL segment so the
// frontend can deep-link by handle.
async function resolveOtherId(raw: string): Promise<string | null> {
  if (raw.startsWith("user_")) return raw;
  const found = await db.select({ userId: profilesTable.userId }).from(profilesTable).where(eq(profilesTable.handle, raw)).limit(1);
  return found[0]?.userId ?? null;
}

router.get("/conversations/:other/messages", requireAuth, async (req, res) => {
  const otherId = await resolveOtherId(p(req.params.other));
  if (!otherId) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const conv = await getOrCreateConversation(req.userId!, otherId);
  // Cap to a generous size so threads aren't silently truncated. We pull the
  // most recent N then reverse for ascending display. Clients can pass
  // `?limit=` if they want fewer.
  const limit = Math.min(parseInt(String(req.query.limit ?? "500"), 10) || 500, 1000);
  const rows = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, conv.id))
    .orderBy(desc(messagesTable.createdAt))
    .limit(limit);
  rows.reverse();
  const other = await db.select().from(profilesTable).where(eq(profilesTable.userId, otherId)).limit(1);
  res.json({
    conversation: conv,
    other: publicProfileOrNull(other[0] ?? null),
    messages: await Promise.all(rows.map(publicMessage)),
  });
});

router.post("/conversations/:other/messages", requireAuth, rateLimit({ scope: "message", max: 30, windowMs: 60_000 }), async (req, res) => {
  const otherId = await resolveOtherId(p(req.params.other));
  if (!otherId) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const parsed = insertMessageSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid" });
    return;
  }
  const imageUrl = parsed.data.imageUrl ?? null;
  if (imageUrl) {
    try {
      const file = await objectStorageService.getObjectEntityFile(imageUrl);
      const metadata = await file.getMetadata();
      if (!String(metadata.contentType ?? "").startsWith("image/")) {
        res.status(400).json({ error: "The attachment must be an image" });
        return;
      }
      if (Number(metadata.size ?? 0) > MAX_MESSAGE_IMAGE_BYTES) {
        res.status(400).json({ error: "The attachment is too large (max 10 MB)" });
        return;
      }
      if (!(await objectStorageService.canAccessObjectEntity({
        userId: req.userId,
        objectFile: file,
      }))) {
        res.status(403).json({ error: "You cannot attach that image" });
        return;
      }
    } catch (error) {
      if (error instanceof ObjectNotFoundError) {
        res.status(400).json({ error: "Attachment not found" });
        return;
      }
      throw error;
    }
  }
  const conv = await getOrCreateConversation(req.userId!, otherId);
  const body = parsed.data.body?.trim() ?? "";
  const [msg] = await db
    .insert(messagesTable)
    .values({ conversationId: conv.id, senderId: req.userId!, body, imageUrl })
    .returning();
  await db
    .update(conversationsTable)
    .set({ lastMessageAt: new Date(), lastMessagePreview: (body || "Photo").slice(0, 120) })
    .where(eq(conversationsTable.id, conv.id));
  await notify({
    recipientId: otherId,
    actorId: req.userId!,
    kind: "message",
    conversationId: conv.id,
    body: (body || "Photo").slice(0, 120),
  });
  res.status(201).json(await publicMessage(msg));
});

router.get("/conversations/:conversationId/messages/:messageId/image", requireAuth, async (req, res) => {
  const conversationId = p(req.params.conversationId);
  const messageId = p(req.params.messageId);
  const [conversation] = await db
    .select()
    .from(conversationsTable)
    .where(
      and(
        eq(conversationsTable.id, conversationId),
        or(eq(conversationsTable.userA, req.userId!), eq(conversationsTable.userB, req.userId!)),
      ),
    )
    .limit(1);
  if (!conversation) {
    res.status(404).json({ error: "Message not found" });
    return;
  }
  const [message] = await db
    .select()
    .from(messagesTable)
    .where(and(eq(messagesTable.id, messageId), eq(messagesTable.conversationId, conversationId)))
    .limit(1);
  if (!message?.imageUrl) {
    res.status(404).json({ error: "Image not found" });
    return;
  }
  try {
    const file = await objectStorageService.getObjectEntityFile(message.imageUrl);
    const response = await objectStorageService.downloadObject(file, 300);
    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));
    if (response.body) {
      Readable.fromWeb(response.body as ReadableStream<Uint8Array>).pipe(res);
    } else {
      res.end();
    }
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      res.status(404).json({ error: "Image not found" });
      return;
    }
    throw error;
  }
});

export default router;
