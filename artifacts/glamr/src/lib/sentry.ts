import * as Sentry from "@sentry/react";

// Frontend error monitoring. A no-op unless VITE_SENTRY_DSN is set at
// build time. No session replay, and no PII: user ids only, never emails.
const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;

export const sentryEnabled = !!dsn;

if (sentryEnabled) {
  Sentry.init({
    dsn,
    environment: (import.meta.env.VITE_SENTRY_ENVIRONMENT as string | undefined) || import.meta.env.MODE,
    release: (import.meta.env.VITE_SENTRY_RELEASE as string | undefined) || undefined,
    sendDefaultPii: false,
    tracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? "0") || 0,
    // Noise from browser extensions and aborted navigations.
    ignoreErrors: ["ResizeObserver loop", "AbortError", "Non-Error promise rejection captured"],
  });
}

export { Sentry };
