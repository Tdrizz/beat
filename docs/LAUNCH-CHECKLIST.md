# Launch checklist

Everything is built. What's left is creating the accounts, pasting keys into the right place, and a few one-time settings. Details for each service are in `docs/DEPLOYMENT.md`; moving the live users is in `docs/migration/cutover-runbook.md`.

## 1. Create the accounts (owner)
- [ ] **Supabase** project. Create two storage buckets: `glamr-private` (private; 15 MB limit; types `image/*,video/*`) and `glamr-public`.
- [ ] **Clerk** application. Enable email (with email code) plus the social logins you want. Add the custom domain DNS records.
- [ ] **Stripe:** use test keys for staging and live keys for production. Add a webhook to `https://<api-host>/api/stripe/webhook`.
- [ ] **Resend:** verify the sending domain.
- [ ] **Google AI Studio:** a Gemini API key on a paid plan.
- [ ] **Sentry:** a Node project and a React project (optional but recommended).
- [ ] **Railway** service from this repo (it reads `railway.json`) and a **Vercel** project from this repo (it reads `vercel.json`).

## 2. Paste the keys

**Railway (API).** Railway sets `PORT` itself.

| Variable | Where it comes from |
| --- | --- |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Supabase → transaction pooler string (port 6543) + `?sslmode=require` |
| `DATABASE_DIRECT_URL` | Supabase → direct string (port 5432) + `?sslmode=require` |
| `PUBLIC_APP_URL` | `https://<your domain>` |
| `ALLOWED_ORIGINS` | `https://<your domain>` (comma-separate extra origins) |
| `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY` | Clerk → API keys |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project settings → API |
| `STORAGE_BUCKET_PRIVATE`, `STORAGE_BUCKET_PUBLIC` | `glamr-private`, `glamr-public` |
| `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` | Stripe → Developers |
| `RESEND_API_KEY`, `DIGEST_FROM_EMAIL` | Resend; for example `Glamr <hello@yourdomain.com>` |
| `GEMINI_API_KEY` | Google AI Studio |
| `CRON_SECRET` | Run `openssl rand -hex 32` (a new value, not the one leaked from Replit) |
| `ADMIN_USER_IDS`, `CURATOR_USER_IDS` | Clerk user ids, comma-separated |
| `SENTRY_DSN`, `SENTRY_ENVIRONMENT` | Sentry Node project (optional) |
| `TRUST_PROXY_HOPS` | Probably `2` behind Vercel. Confirm on staging (`docs/DEPLOYMENT.md`) |

**Vercel (web).** These are build-time variables.

| Variable | Where it comes from |
| --- | --- |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk → API keys |
| `VITE_SENTRY_DSN`, `VITE_SENTRY_ENVIRONMENT` | Sentry React project (optional) |

**GitHub → Settings → Secrets → Actions** (for the weekly digest and daily cleanup):

| Secret | Value |
| --- | --- |
| `APP_URL` | `https://<your domain>` |
| `CRON_SECRET` | Same value as on Railway |

## 3. One-time settings that aren't keys
- [ ] In `vercel.json`, replace `REPLACE_WITH_RAILWAY_API_HOST` with the Railway service's domain. Vercel rewrites can't read env vars.
- [ ] Pick the Gemini models. Google has announced deprecation of `gemini-2.5-flash` and `gemini-2.5-flash-image`. Set `GEMINI_CHAT_MODEL` and `GEMINI_IMAGE_MODEL` on Railway, then check try-on quality.
- [ ] Paste the final Privacy Policy and Terms into `artifacts/glamr/src/lib/legalContent.ts` and set `LEGAL_PLACEHOLDER = false`.
- [ ] Replace the 71 flagged look images. Regenerate them with `images:quarantine` → `gen:prompts` → `gen:images` (needs `GEMINI_API_KEY`), then review them. This also makes try-on for those looks match their thumbnails (`docs/content-rights.md`).
- [ ] Rotate `CRON_SECRET` in Replit Secrets for the live app (the old value was public).

## 4. Merge order
Merge the stacked PRs in order into `migration`: CI → security → legal → report/block → account deletion → face consent → content rights → Sentry → code splitting → data migration. When one merges and its branch is deleted, GitHub retargets the next PR to `migration`. Turn on "Automatically delete head branches" in repo settings, or change the base by hand. Deploy staging from `migration`. Then follow the cutover runbook, and merge `migration` into `main` only after cutover is approved.
