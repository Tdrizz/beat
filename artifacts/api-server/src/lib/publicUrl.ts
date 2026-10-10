// Canonical public origin of the web app (e.g. https://glamr.app), used for
// absolute links in emails and Stripe redirect URLs. Never derive these from
// request headers: Host / X-Forwarded-Host are client-controllable.
export function publicAppUrl(): string {
  const raw = process.env.PUBLIC_APP_URL?.trim();
  if (raw) return raw.replace(/\/+$/, "");
  if (process.env.NODE_ENV === "production") {
    throw new Error("PUBLIC_APP_URL must be set in production");
  }
  return "http://localhost:5173";
}
