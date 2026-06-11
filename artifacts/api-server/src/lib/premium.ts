import { db, profilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

// Source of truth for the "is this user premium right now?" question.
// Reads `premium_until` from the profile and compares to wall-clock now.
export async function isUserPremium(userId: string): Promise<boolean> {
  const rows = await db
    .select({ until: profilesTable.premiumUntil })
    .from(profilesTable)
    .where(eq(profilesTable.userId, userId))
    .limit(1);
  const until = rows[0]?.until;
  return !!until && until.getTime() > Date.now();
}

export async function getPremiumStatus(userId: string): Promise<{ active: boolean; until: string | null }> {
  const rows = await db
    .select({ until: profilesTable.premiumUntil })
    .from(profilesTable)
    .where(eq(profilesTable.userId, userId))
    .limit(1);
  const until = rows[0]?.until ?? null;
  return {
    active: !!until && until.getTime() > Date.now(),
    until: until ? until.toISOString() : null,
  };
}
