import { db, notificationsTable } from "@workspace/db";
import { isBlockedEitherWay } from "./blocks";

export type NotifyKind = "like" | "comment" | "follow" | "message" | "system" | "match";

interface NotifyArgs {
  recipientId: string;
  actorId?: string | null;
  kind: NotifyKind;
  postId?: string | null;
  conversationId?: string | null;
  body?: string;
}

// Fire-and-forget notification creator. We never want a failed notification
// insert to break the underlying social action, so this swallows errors and
// no-ops when actor === recipient (don't notify yourself).
export async function notify(args: NotifyArgs): Promise<void> {
  if (args.actorId && args.actorId === args.recipientId) return;
  try {
    if (args.actorId && (await isBlockedEitherWay(args.actorId, args.recipientId))) return;
    await db.insert(notificationsTable).values({
      recipientId: args.recipientId,
      actorId: args.actorId ?? null,
      kind: args.kind,
      postId: args.postId ?? null,
      conversationId: args.conversationId ?? null,
      body: args.body ?? "",
    });
  } catch {
    // intentional swallow — see comment above
  }
}
