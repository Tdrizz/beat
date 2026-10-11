// Rewrite every user id in the database from the old (Replit Clerk) ids to
// the new Clerk ids, using id-map.json from migrate:import-clerk-users.
// One transaction: all or nothing. Run against the direct connection after
// the data restore, and before opening the app to users.
//
//   DATABASE_URL=<direct url> pnpm --filter @workspace/scripts run migrate:remap-user-ids id-map.json
import { readFileSync } from "node:fs";
import { db, pool } from "@workspace/db";
import { remapUserIds } from "@workspace/db/remap";

const file = process.argv[2];
if (!file) throw new Error("Usage: migrate:remap-user-ids <id-map.json>");
const mapping = JSON.parse(readFileSync(file, "utf8")) as Record<string, string>;
const result = await remapUserIds(db, mapping);
console.log(`Remapped ${result.mapped} users`);
for (const [col, n] of Object.entries(result.rowsUpdated)) if (n) console.log(`  ${col}: ${n}`);
await pool.end();
