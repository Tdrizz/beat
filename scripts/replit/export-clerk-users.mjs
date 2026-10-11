// Run INSIDE the Replit project shell (uses Replit's CLERK_SECRET_KEY).
// Exports every Clerk user to users.json for import into the new Clerk
// instance. Password hashes are not available through the API; migrated
// users sign in with an email code or "Forgot password".
//
//   node export-clerk-users.mjs > users.json
const key = process.env.CLERK_SECRET_KEY;
if (!key) throw new Error("CLERK_SECRET_KEY is not set (run this in the Replit shell)");

const users = [];
for (let offset = 0; ; offset += 500) {
  const res = await fetch(`https://api.clerk.com/v1/users?limit=500&offset=${offset}&order_by=created_at`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!res.ok) throw new Error(`Clerk ${res.status}: ${await res.text()}`);
  const page = await res.json();
  for (const u of page) {
    const primary = u.email_addresses.find((e) => e.id === u.primary_email_address_id) ?? u.email_addresses[0];
    users.push({
      id: u.id,
      email: primary?.email_address ?? null,
      emailVerified: primary?.verification?.status === "verified",
      otherEmails: u.email_addresses.filter((e) => e !== primary).map((e) => e.email_address),
      firstName: u.first_name,
      lastName: u.last_name,
      username: u.username,
      imageUrl: u.has_image ? u.image_url : null,
      externalAccounts: (u.external_accounts ?? []).map((a) => a.provider),
      createdAt: u.created_at,
      banned: u.banned,
    });
  }
  if (page.length < 500) break;
}
process.stderr.write(`Exported ${users.length} users\n`);
process.stdout.write(JSON.stringify(users, null, 2));
