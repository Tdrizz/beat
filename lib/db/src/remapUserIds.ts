import { sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

/**
 * Every column that stores a Clerk user id. Used when moving users to a new
 * Clerk instance, where every user gets a new id. A test fails if a column
 * that looks like a user id is missing from this list, so new tables can't
 * be forgotten.
 */
export const USER_ID_COLUMNS: ReadonlyArray<readonly [table: string, column: string]> = [
  ["affiliate_clicks", "creator_id"],
  ["affiliate_clicks", "viewer_id"],
  ["chat_threads", "user_id"],
  ["class_reservations", "user_id"],
  ["classes", "instructor_id"],
  ["conversations", "user_a"],
  ["conversations", "user_b"],
  ["digest_sends", "user_id"],
  ["email_preferences", "user_id"],
  ["follows", "follower_id"],
  ["follows", "followee_id"],
  ["messages", "sender_id"],
  ["notifications", "actor_id"],
  ["notifications", "recipient_id"],
  ["object_acls", "owner_id"],
  ["post_comments", "author_id"],
  ["post_likes", "user_id"],
  ["posts", "author_id"],
  ["profiles", "user_id"],
  ["reports", "reporter_id"],
  ["reports", "resolved_by"],
  ["reports", "target_user_id"],
  ["saved_combos", "user_id"],
  ["submitted_tutorials", "author_id"],
  ["tutorial_bookmarks", "user_id"],
  ["tutorial_reviews", "author_id"],
  ["tutorial_step_videos", "updated_by"],
  ["user_blocks", "blocker_id"],
  ["user_blocks", "blocked_id"],
  ["user_consents", "user_id"],
  ["wig_tryons", "user_id"],
];

export interface RemapResult {
  mapped: number;
  rowsUpdated: Record<string, number>;
}

/**
 * Rewrite user ids across the whole database in one transaction, using
 * `mapping` (old id -> new id). Ids not in the mapping are left alone.
 * Also keeps conversations' (user_a < user_b) ordering, which the app
 * relies on to find a pair's thread, and account-report targets.
 */
export async function remapUserIds(
  db: NodePgDatabase<Record<string, unknown>>,
  mapping: Record<string, string>,
): Promise<RemapResult> {
  const pairs = Object.entries(mapping).filter(([from, to]) => from && to && from !== to);
  const rowsUpdated: Record<string, number> = {};
  if (pairs.length === 0) return { mapped: 0, rowsUpdated };

  await db.transaction(async (tx) => {
    await tx.execute(sql`CREATE TEMP TABLE user_id_map (old_id text PRIMARY KEY, new_id text NOT NULL) ON COMMIT DROP`);
    for (let i = 0; i < pairs.length; i += 500) {
      const chunk = pairs.slice(i, i + 500);
      await tx.execute(sql`INSERT INTO user_id_map (old_id, new_id) VALUES ${sql.join(
        chunk.map(([from, to]) => sql`(${from}, ${to})`),
        sql`, `,
      )}`);
    }
    for (const [table, column] of USER_ID_COLUMNS) {
      const res = await tx.execute(sql`
        UPDATE ${sql.identifier(table)} t SET ${sql.identifier(column)} = m.new_id
        FROM user_id_map m WHERE t.${sql.identifier(column)} = m.old_id
      `);
      rowsUpdated[`${table}.${column}`] = res.rowCount ?? 0;
    }
    // Account reports store the reported user's id as the target.
    const reports = await tx.execute(sql`
      UPDATE reports r SET target_id = m.new_id FROM user_id_map m
      WHERE r.target_type = 'user' AND r.target_id = m.old_id
    `);
    rowsUpdated["reports.target_id"] = reports.rowCount ?? 0;
    // Restore the user_a < user_b invariant the conversation lookup uses.
    await tx.execute(sql`
      UPDATE conversations SET user_a = user_b, user_b = user_a WHERE user_a > user_b
    `);
  });
  return { mapped: pairs.length, rowsUpdated };
}
