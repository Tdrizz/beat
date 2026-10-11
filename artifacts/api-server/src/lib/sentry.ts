import * as Sentry from "@sentry/node";

// Error monitoring. A no-op unless SENTRY_DSN is set, so local dev and
// tests never report. Request bodies, cookies and auth headers are
// stripped: bodies can carry selfies (try-on) and DMs.
export const sentryEnabled = !!process.env.SENTRY_DSN;

if (sentryEnabled) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || "development",
    release: process.env.SENTRY_RELEASE || process.env.RAILWAY_GIT_COMMIT_SHA || undefined,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0") || 0,
    sendDefaultPii: false,
    beforeSend(event) {
      if (event.request) {
        delete event.request.data;
        delete event.request.cookies;
        if (event.request.headers) {
          for (const h of Object.keys(event.request.headers)) {
            if (/^(authorization|cookie|x-cron-secret|stripe-signature)$/i.test(h)) {
              delete event.request.headers[h];
            }
          }
        }
      }
      return event;
    },
  });
}

export { Sentry };
