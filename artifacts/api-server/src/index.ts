import app from "./app";
import { logger } from "./lib/logger";
import { seedBrandsIfEmpty } from "./lib/seedBrands";
import { seedClassesIfEmpty } from "./lib/seedClasses";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, async (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // Seeds insert placeholder creator profiles, so they never run in
  // production unless explicitly requested.
  if (process.env.NODE_ENV === "production" && process.env.RUN_SEEDS !== "1") {
    return;
  }
  try {
    await seedBrandsIfEmpty();
    await seedClassesIfEmpty();
  } catch (e) {
    logger.error({ err: e }, "Brand seed failed");
  }
});
