import path from "node:path";
import pg from "pg";
import { runMigrations } from "@workspace/db/migrate";

// Recreates the test database schema from the committed migrations, so tests
// also prove the migrations apply cleanly.
export default async function setup(): Promise<void> {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) {
    throw new Error("Set TEST_DATABASE_URL to a disposable Postgres database to run API tests");
  }
  if (!new URL(url).pathname.toLowerCase().includes("test")) {
    throw new Error("Refusing to run: TEST_DATABASE_URL's database name must contain 'test'");
  }
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  await client.query("DROP SCHEMA IF EXISTS public CASCADE; DROP SCHEMA IF EXISTS drizzle CASCADE; CREATE SCHEMA public;");
  await client.end();
  await runMigrations(url, path.resolve(import.meta.dirname, "../../../lib/db/migrations"));
}
