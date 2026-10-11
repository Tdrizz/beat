// Create the exported Replit users in the owner's new Clerk instance and
// write old-id -> new-id to id-map.json (input to migrate:remap-user-ids).
// Each new user keeps the old id as external_id for traceability.
// Users without a password sign in with an email code or reset their
// password. Safe to re-run: users that already exist are matched by email.
//
//   CLERK_SECRET_KEY=<new instance key> pnpm --filter @workspace/scripts run \
//     migrate:import-clerk-users users.json id-map.json [--dry-run]
import { existsSync, readFileSync, writeFileSync } from "node:fs";

interface ExportedUser {
  id: string;
  email: string | null;
  emailVerified: boolean;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  banned: boolean;
}

const [input, output = "id-map.json"] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const dryRun = process.argv.includes("--dry-run");
if (!input) throw new Error("Usage: migrate:import-clerk-users <users.json> [id-map.json] [--dry-run]");
const key = process.env.CLERK_SECRET_KEY;
if (!key) throw new Error("CLERK_SECRET_KEY (of the NEW Clerk instance) must be set");

const api = async (path: string, init: RequestInit = {}) => {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`https://api.clerk.com/v1${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
    });
    if (res.status === 429 && attempt < 5) {
      await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
      continue;
    }
    return res;
  }
};

const users = JSON.parse(readFileSync(input, "utf8")) as ExportedUser[];
const map: Record<string, string> = existsSync(output) ? JSON.parse(readFileSync(output, "utf8")) : {};
let created = 0, matched = 0, skipped = 0;

for (const u of users) {
  if (map[u.id]) { matched += 1; continue; }
  if (!u.email) { console.warn(`skip ${u.id}: no email address`); skipped += 1; continue; }
  if (dryRun) { created += 1; continue; }
  const res = await api("/users", {
    method: "POST",
    body: JSON.stringify({
      external_id: u.id,
      email_address: [u.email],
      first_name: u.firstName ?? undefined,
      last_name: u.lastName ?? undefined,
      skip_password_requirement: true,
    }),
  });
  if (res.ok) {
    const body = (await res.json()) as { id: string };
    map[u.id] = body.id;
    created += 1;
  } else if (res.status === 422) {
    // Already there (e.g. a previous run, or the user signed up anew).
    const found = await api(`/users?email_address=${encodeURIComponent(u.email)}`);
    const list = (await found.json()) as Array<{ id: string }>;
    if (list[0]) { map[u.id] = list[0].id; matched += 1; }
    else { console.warn(`skip ${u.id}: ${await res.text()}`); skipped += 1; }
  } else {
    throw new Error(`Clerk ${res.status} for ${u.id}: ${await res.text()}`);
  }
  if (u.banned && map[u.id]) await api(`/users/${map[u.id]}/ban`, { method: "POST" });
  writeFileSync(output, JSON.stringify(map, null, 2)); // checkpoint after each user
}

console.log(`${dryRun ? "[dry run] " : ""}created ${created}, matched ${matched}, skipped ${skipped} of ${users.length}`);
if (!dryRun) console.log(`Wrote ${output}`);
