import { and, eq, or } from "drizzle-orm";
import { db, userBlocksTable } from "@workspace/db";

/**
 * Users hidden from `userId` in either direction: people they blocked and
 * people who blocked them. Empty for signed-out viewers.
 */
export async function hiddenUserIds(userId: string | undefined): Promise<Set<string>> {
  if (!userId) return new Set();
  const rows = await db
    .select({ blockerId: userBlocksTable.blockerId, blockedId: userBlocksTable.blockedId })
    .from(userBlocksTable)
    .where(or(eq(userBlocksTable.blockerId, userId), eq(userBlocksTable.blockedId, userId)));
  return new Set(rows.map((r) => (r.blockerId === userId ? r.blockedId : r.blockerId)));
}

/** True when either user has blocked the other. */
export async function isBlockedEitherWay(a: string, b: string): Promise<boolean> {
  const rows = await db
    .select({ blockerId: userBlocksTable.blockerId })
    .from(userBlocksTable)
    .where(
      or(
        and(eq(userBlocksTable.blockerId, a), eq(userBlocksTable.blockedId, b)),
        and(eq(userBlocksTable.blockerId, b), eq(userBlocksTable.blockedId, a)),
      ),
    )
    .limit(1);
  return rows.length > 0;
}

/** Whether `blockerId` has blocked `blockedId` (one direction only). */
export async function hasBlocked(blockerId: string, blockedId: string): Promise<boolean> {
  const rows = await db
    .select({ blockerId: userBlocksTable.blockerId })
    .from(userBlocksTable)
    .where(and(eq(userBlocksTable.blockerId, blockerId), eq(userBlocksTable.blockedId, blockedId)))
    .limit(1);
  return rows.length > 0;
}
