import { and, eq, inArray, isNotNull, or, sql } from "drizzle-orm";
import {
  db,
  affiliateClicksTable,
  chatMessagesTable,
  chatThreadsTable,
  classesTable,
  classReservationsTable,
  commentsTable,
  conversationsTable,
  digestSendsTable,
  emailPreferencesTable,
  followsTable,
  likesTable,
  messagesTable,
  notificationsTable,
  objectAclsTable,
  postsTable,
  profilesTable,
  reportsTable,
  savedCombosTable,
  submittedTutorialsTable,
  tutorialBookmarksTable,
  tutorialReviewsTable,
  tutorialStepVideosTable,
  userBlocksTable,
  wigTryonsTable,
} from "@workspace/db";
import { getStripeClient } from "./stripeClient";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { logger } from "./logger";

const objectStorage = new ObjectStorageService();

export interface DeletionSummary {
  stripeCustomerDeleted: boolean;
  objectsDeleted: number;
  objectsFailed: number;
}

/**
 * Permanently delete everything we hold about `userId` (App Store 5.1.1(v)).
 *
 * Order matters:
 *  1. Stripe first. If we can't stop billing, abort before touching data so
 *     the user can retry instead of being charged with no account.
 *  2. Stored files (best effort; failures are logged and left for cleanup).
 *  3. All database rows, in one transaction.
 * The caller deletes the Clerk user last. Every step is idempotent, so a
 * retry after a partial failure finishes the job.
 *
 * DM conversations the user took part in are deleted entirely (both sides'
 * messages and attachments): a thread with a deleted account can't
 * continue, and its messages are the deleted user's personal data too.
 */
export async function deleteAccountData(userId: string): Promise<DeletionSummary> {
  const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.userId, userId)).limit(1);

  // 1. Stripe: deleting the customer cancels every subscription at once.
  let stripeCustomerDeleted = false;
  if (profile?.stripeCustomerId) {
    try {
      await getStripeClient().customers.del(profile.stripeCustomerId);
      stripeCustomerDeleted = true;
    } catch (err) {
      const code = (err as { code?: string; statusCode?: number }).code;
      const status = (err as { statusCode?: number }).statusCode;
      if (code === "resource_missing" || status === 404) {
        stripeCustomerDeleted = true; // already gone
      } else {
        throw new Error("Could not cancel the Stripe subscription; account not deleted", { cause: err });
      }
    }
  }

  // 2. Files: everything this user owns, plus attachments in their DM threads.
  const conversations = await db
    .select({ id: conversationsTable.id })
    .from(conversationsTable)
    .where(or(eq(conversationsTable.userA, userId), eq(conversationsTable.userB, userId)));
  const conversationIds = conversations.map((c) => c.id);
  const owned = await db
    .select({ path: objectAclsTable.objectPath })
    .from(objectAclsTable)
    .where(eq(objectAclsTable.ownerId, userId));
  const dmAttachments = conversationIds.length
    ? await db
        .select({ path: messagesTable.imageUrl })
        .from(messagesTable)
        .where(and(inArray(messagesTable.conversationId, conversationIds), isNotNull(messagesTable.imageUrl)))
    : [];
  const paths = new Set<string>();
  for (const row of [...owned, ...dmAttachments]) {
    if (row.path?.startsWith("/objects/")) paths.add(row.path);
  }
  let objectsDeleted = 0;
  let objectsFailed = 0;
  for (const path of paths) {
    try {
      await (await objectStorage.getObjectEntityFile(path)).delete();
      objectsDeleted += 1;
    } catch (err) {
      if (err instanceof ObjectNotFoundError) continue;
      objectsFailed += 1;
      logger.warn({ err, path }, "Account deletion: failed to delete object");
    }
  }

  // 3. Database rows.
  await db.transaction(async (tx) => {
    // Keep other users' counters right before removing likes/comments.
    await tx.execute(sql`
      UPDATE ${postsTable} SET like_count = GREATEST(like_count - 1, 0)
      WHERE id IN (SELECT post_id FROM ${likesTable} WHERE user_id = ${userId})
        AND author_id <> ${userId}
    `);
    await tx.execute(sql`
      UPDATE ${postsTable} p SET comment_count = GREATEST(p.comment_count - c.n, 0)
      FROM (SELECT post_id, count(*)::int AS n FROM ${commentsTable} WHERE author_id = ${userId} GROUP BY post_id) c
      WHERE p.id = c.post_id AND p.author_id <> ${userId}
    `);

    const myPosts = tx.select({ id: postsTable.id }).from(postsTable).where(eq(postsTable.authorId, userId));
    await tx.delete(likesTable).where(or(eq(likesTable.userId, userId), inArray(likesTable.postId, myPosts)));
    await tx.delete(commentsTable).where(or(eq(commentsTable.authorId, userId), inArray(commentsTable.postId, myPosts)));
    await tx.delete(postsTable).where(eq(postsTable.authorId, userId));

    await tx.delete(followsTable).where(or(eq(followsTable.followerId, userId), eq(followsTable.followeeId, userId)));
    if (conversationIds.length) {
      await tx.delete(messagesTable).where(inArray(messagesTable.conversationId, conversationIds));
      await tx.delete(conversationsTable).where(inArray(conversationsTable.id, conversationIds));
    }
    await tx.delete(notificationsTable).where(or(eq(notificationsTable.recipientId, userId), eq(notificationsTable.actorId, userId)));

    const myThreads = tx.select({ id: chatThreadsTable.id }).from(chatThreadsTable).where(eq(chatThreadsTable.userId, userId));
    await tx.delete(chatMessagesTable).where(inArray(chatMessagesTable.threadId, myThreads));
    await tx.delete(chatThreadsTable).where(eq(chatThreadsTable.userId, userId));

    const myClasses = tx.select({ id: classesTable.id }).from(classesTable).where(eq(classesTable.instructorId, userId));
    await tx.delete(classReservationsTable).where(or(eq(classReservationsTable.userId, userId), inArray(classReservationsTable.classId, myClasses)));
    await tx.delete(classesTable).where(eq(classesTable.instructorId, userId));

    await tx.delete(tutorialReviewsTable).where(eq(tutorialReviewsTable.authorId, userId));
    await tx.delete(tutorialBookmarksTable).where(eq(tutorialBookmarksTable.userId, userId));
    await tx.delete(submittedTutorialsTable).where(eq(submittedTutorialsTable.authorId, userId));
    await tx.delete(tutorialStepVideosTable).where(eq(tutorialStepVideosTable.updatedBy, userId));

    await tx.delete(savedCombosTable).where(eq(savedCombosTable.userId, userId));
    await tx.delete(wigTryonsTable).where(eq(wigTryonsTable.userId, userId));
    await tx.delete(emailPreferencesTable).where(eq(emailPreferencesTable.userId, userId));
    await tx.delete(digestSendsTable).where(eq(digestSendsTable.userId, userId));
    await tx.delete(userBlocksTable).where(or(eq(userBlocksTable.blockerId, userId), eq(userBlocksTable.blockedId, userId)));
    await tx.delete(objectAclsTable).where(eq(objectAclsTable.ownerId, userId));

    // Affiliate stats stay as anonymous aggregates.
    await tx.update(affiliateClicksTable).set({ creatorId: null }).where(eq(affiliateClicksTable.creatorId, userId));
    await tx.update(affiliateClicksTable).set({ viewerId: null }).where(eq(affiliateClicksTable.viewerId, userId));

    // Reports they filed go; reports about them are closed but kept as a
    // moderation record, with the content snapshot wiped.
    await tx.delete(reportsTable).where(eq(reportsTable.reporterId, userId));
    await tx.update(reportsTable).set({ snapshot: {} }).where(eq(reportsTable.targetUserId, userId));
    await tx
      .update(reportsTable)
      .set({ status: "actioned", resolvedAt: new Date(), resolutionNote: "account deleted" })
      .where(and(eq(reportsTable.targetUserId, userId), eq(reportsTable.status, "open")));

    await tx.delete(profilesTable).where(eq(profilesTable.userId, userId));
  });

  return { stripeCustomerDeleted, objectsDeleted, objectsFailed };
}
