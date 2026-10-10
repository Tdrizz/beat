import { defineConfig } from "drizzle-kit";
import path from "path";

// Schema work (generate/migrate) should use a direct, non-pooled connection.
// On Supabase that's the "direct connection" string; the running app uses the
// pooled DATABASE_URL instead.
const url = process.env.DATABASE_DIRECT_URL || process.env.DATABASE_URL;

if (!url) {
  throw new Error("DATABASE_DIRECT_URL or DATABASE_URL must be set");
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url,
  },
});
