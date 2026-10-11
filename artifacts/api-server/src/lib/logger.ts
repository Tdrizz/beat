import pino from "pino";
import { Sentry, sentryEnabled } from "./sentry";

const isProduction = process.env.NODE_ENV === "production";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  hooks: {
    // Routes catch their own errors and log them (req.log.error({ err })),
    // so forward every error-level log with an Error to Sentry as well.
    logMethod(args, method, level) {
      if (sentryEnabled && level >= 50) {
        const first = args[0] as unknown;
        const err = first instanceof Error ? first : (first as { err?: unknown } | null)?.err;
        if (err instanceof Error) {
          const msg = typeof args[1] === "string" ? args[1] : undefined;
          Sentry.captureException(err, msg ? { extra: { message: msg } } : undefined);
        }
      }
      return method.apply(this, args as Parameters<typeof method>);
    },
  },
  redact: [
    "req.headers.authorization",
    "req.headers.cookie",
    "res.headers['set-cookie']",
  ],
  ...(isProduction
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: { colorize: true },
        },
      }),
});
