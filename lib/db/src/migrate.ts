import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

/**
 * Apply pending SQL migrations from `migrationsFolder`. Uses the same
 * `drizzle.__drizzle_migrations` bookkeeping as `drizzle-kit migrate`, so
 * either can be used against the same database.
 */
export async function runMigrations(connectionString: string, migrationsFolder: string): Promise<void> {
  const pool = new pg.Pool({ connectionString, max: 1 });
  try {
    await migrate(drizzle(pool), { migrationsFolder });
  } finally {
    await pool.end();
  }
}
