// Production migration entry point, bundled to dist/migrate.mjs and run as
// the host's pre-deploy step: `node artifacts/api-server/dist/migrate.mjs`.
// Runs from the repo root so the committed SQL in lib/db/migrations is found.
import path from "node:path";
import { runMigrations } from "@workspace/db/migrate";

const url = process.env.DATABASE_DIRECT_URL || process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_DIRECT_URL or DATABASE_URL must be set");
}
const migrationsFolder = process.env.MIGRATIONS_DIR || path.resolve(process.cwd(), "lib/db/migrations");

await runMigrations(url, migrationsFolder);
console.log(`Migrations applied from ${migrationsFolder}`);
