// Load the ACL manifest written by scripts/replit/copy-objects.mjs into the
// object_acls table. Idempotent (existing rows are left alone).
//
//   DATABASE_URL=... pnpm --filter @workspace/scripts run migrate:import-acls acl-manifest.jsonl
import { readFileSync } from "node:fs";
import { db, objectAclsTable, pool } from "@workspace/db";

interface ManifestLine {
  objectPath: string;
  owner: string;
  visibility: "public" | "private";
  aclRules?: unknown;
}

const file = process.argv[2];
if (!file) throw new Error("Usage: migrate:import-acls <acl-manifest.jsonl>");

const rows: ManifestLine[] = readFileSync(file, "utf8")
  .split("\n")
  .filter((l) => l.trim())
  .map((l) => JSON.parse(l) as ManifestLine)
  .filter((r) => r.objectPath?.startsWith("/objects/") && r.owner && (r.visibility === "public" || r.visibility === "private"));

let inserted = 0;
for (let i = 0; i < rows.length; i += 500) {
  const chunk = rows.slice(i, i + 500);
  const res = await db
    .insert(objectAclsTable)
    .values(chunk.map((r) => ({ objectPath: r.objectPath, ownerId: r.owner, visibility: r.visibility, aclRules: r.aclRules ?? null })))
    .onConflictDoNothing({ target: objectAclsTable.objectPath })
    .returning({ p: objectAclsTable.objectPath });
  inserted += res.length;
}
console.log(`ACL manifest: ${rows.length} entries, ${inserted} inserted, ${rows.length - inserted} already present`);
await pool.end();
