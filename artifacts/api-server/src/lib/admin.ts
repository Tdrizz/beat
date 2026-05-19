// Tiny admin allow-list. Comma-separated Clerk userIds in the
// `ADMIN_USER_IDS` env var get to moderate user-generated content
// (currently: submitted tutorials). We deliberately keep this out of the
// DB so promoting a moderator is a config change, not a write — and so
// nobody can grant themselves moderator via a compromised account.
const ids = (process.env.ADMIN_USER_IDS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const adminSet: ReadonlySet<string> = new Set(ids);

export function isAdmin(userId: string | undefined | null): boolean {
  return !!userId && adminSet.has(userId);
}
