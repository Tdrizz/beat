import { defineConfig } from "vitest/config";

// API integration tests run the real Express app against a disposable
// Postgres database (TEST_DATABASE_URL, which must contain "test" in its
// name). Clerk is mocked so tests sign in with an `x-test-user` header.
export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    globalSetup: ["test/globalSetup.ts"],
    setupFiles: ["test/setup.ts"],
    fileParallelism: false,
    testTimeout: 20_000,
    env: {
      NODE_ENV: "test",
      LOG_LEVEL: "silent",
      DATABASE_URL: process.env.TEST_DATABASE_URL ?? "",
      GEMINI_API_KEY: "test-key",
      CRON_SECRET: "test-cron-secret",
      PUBLIC_APP_URL: "https://glamr.test",
      ADMIN_USER_IDS: "user_admin",
      CURATOR_USER_IDS: "user_curator",
    },
  },
});
