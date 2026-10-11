# Deployment

Glamr runs on four services: Supabase (Postgres + Storage), Railway (API), Vercel (frontend), and a GitHub Actions scheduler. Every setting comes from environment variables; `.env.example` lists them all.

```
browser ──► Vercel (static SPA) ──/api/* rewrite──► Railway (Express API) ──► Supabase Postgres
                                                                         └──► Supabase Storage
GitHub Actions (cron) ──► POST /api/digest/run, /api/storage/uploads/cleanup
```

The browser only ever talks to the app's own domain, so Clerk's cookies work and the frontend keeps calling relative `/api`.

## Local development

Requires Node 24 (`.nvmrc`) and pnpm 10.

```bash
pnpm install
cp .env.example .env            # fill in values; use Stripe test keys
set -a; . ./.env; set +a
pnpm --filter @workspace/db run migrate
PORT=8080 pnpm --filter @workspace/api-server run dev    # API on :8080
pnpm --filter @workspace/glamr run dev                   # SPA on :5173, proxies /api to :8080
```

- Set `PORT=8080` for the API only. The SPA dev server defaults to `:5173`.
- For storage, point `SUPABASE_URL` at a dev Supabase project, or at a local stack (`supabase start`).
- Outside production, the dev seed data (brands, classes) is inserted on API boot.

API tests run the real app against a throwaway Postgres database whose name must contain `test`. Clerk is mocked: a test signs in by sending the header `x-test-user: <id>`. CI (`.github/workflows/ci.yml`) runs typecheck, build and these tests on every PR.

```bash
createdb glamr_test
TEST_DATABASE_URL=postgres://localhost/glamr_test pnpm --filter @workspace/api-server test
```

## 1. Supabase

1. Create the project, then copy:
   - **Project URL** to `SUPABASE_URL`.
   - **service_role key** to `SUPABASE_SERVICE_ROLE_KEY`. It's server-only; never expose it to the frontend.
   - **Transaction pooler** connection string (port 6543) to `DATABASE_URL`, used by the running app.
   - **Direct** connection string (port 5432) to `DATABASE_DIRECT_URL`, used by migrations.
   - Append `?sslmode=require` to both connection strings.
2. **Storage → New bucket**, twice:
   - `STORAGE_BUCKET_PRIVATE` (for example `glamr-private`). **Private.** Set a file size limit of 15 MB and allowed MIME types `image/*,video/*`. Leave it with no RLS policies: only the API's service role touches it, and every read goes through the API's ACL check.
   - `STORAGE_BUCKET_PUBLIC` (for example `glamr-public`). Holds static public assets served at `/api/storage/public-objects/*`.
3. Schema: Railway's pre-deploy step runs the migrations. To run them by hand: `DATABASE_DIRECT_URL=... pnpm --filter @workspace/db run migrate`.

## 2. Railway (API)

`railway.json` at the repo root configures this service.

- **Build:** `pnpm --filter @workspace/api-server run build` produces `dist/index.mjs` and `dist/migrate.mjs`.
- **Pre-deploy:** `node artifacts/api-server/dist/migrate.mjs` applies pending migrations. A failed migration blocks the deploy.
- **Start:** `node --enable-source-maps artifacts/api-server/dist/index.mjs`.
- **Health check:** `GET /api/healthz`.

Set these variables: `NODE_ENV=production`, `DATABASE_URL`, `DATABASE_DIRECT_URL`, `PUBLIC_APP_URL`, `ALLOWED_ORIGINS`, `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STORAGE_BUCKET_PRIVATE`, `STORAGE_BUCKET_PUBLIC`, `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `DIGEST_FROM_EMAIL`, `GEMINI_API_KEY`, `CRON_SECRET`, `ADMIN_USER_IDS`, `CURATOR_USER_IDS`, and optionally `LOG_LEVEL`. Railway provides `PORT` itself.

**`TRUST_PROXY_HOPS`** (default 1) tells the API how many proxies sit in front of it. Requests come through Vercel and then Railway's edge, so this probably needs to be `2`. To check on staging: log `req.ip` for a request from your phone. It should show your real IP, not a Vercel or Railway address. If it's wrong, every user shares one rate-limit bucket.

## 3. Vercel (frontend)

`vercel.json` at the repo root configures this. Import the repo with the root directory left at the repo root.

- **Before the first deploy**, replace `REPLACE_WITH_RAILWAY_API_HOST` in `vercel.json` with the Railway service's public domain. Vercel rewrites can't read environment variables.
- Set `VITE_CLERK_PUBLISHABLE_KEY`. It's needed at build time.
- `/api/*` is proxied to Railway. Every other path falls back to `index.html` so the SPA routes work.

## 4. Clerk

Use the owner's own Clerk application. For production, add the custom domain in the Clerk dashboard and create the DNS records it asks for (`clerk.<domain>` and the email-related records). The old Replit FAPI proxy (`/api/__clerk`) has been removed.

## 5. Stripe

- Staging uses `sk_test_` and `pk_test_` keys; production uses live keys.
- Add a webhook endpoint at `https://<railway-api-host>/api/stripe/webhook`, or at `https://<app-domain>/api/stripe/webhook` (the rewrite keeps the raw body). Subscribe to the subscription and checkout events the handler uses. Copy the signing secret to `STRIPE_WEBHOOK_SECRET`.
- Checkout and portal redirects use `PUBLIC_APP_URL`.

## 6. Scheduled jobs

`.github/workflows/scheduled-jobs.yml` calls:

- `POST /api/digest/run` weekly (Mondays 16:07 UTC).
- `POST /api/storage/uploads/cleanup` daily (03:17 UTC).

Add repository secrets `APP_URL` (for example `https://glamr.app`) and `CRON_SECRET`. GitHub only runs scheduled workflows from the default branch, so this starts after cutover. To trigger either job by hand, use **Actions → Scheduled jobs → Run workflow**.

## Error monitoring (Sentry)

Create two Sentry projects, Node for the API and React for the web app, and set:
- **Railway:** `SENTRY_DSN` and `SENTRY_ENVIRONMENT` (`production` or `staging`). The release defaults to `RAILWAY_GIT_COMMIT_SHA`.
- **Vercel:** `VITE_SENTRY_DSN` and `VITE_SENTRY_ENVIRONMENT`. These are build-time variables.

With no DSN set, both SDKs do nothing.

What gets reported:
- **API:** unhandled errors, plus every error-level log entry that carries an Error. Request bodies, cookies, `Authorization`, `x-cron-secret` and `stripe-signature` are stripped before sending, because bodies can contain selfies and DMs.
- **Web:** render crashes (caught by `AppErrorBoundary`, which shows a recovery screen) and uncaught errors. Users are tagged by id only, never by email.

Performance tracing is off by default. Set `SENTRY_TRACES_SAMPLE_RATE` to sample it. Uploading source maps for readable frontend stack traces is optional; it needs `@sentry/vite-plugin` and a `SENTRY_AUTH_TOKEN`.

## Rate limiting

Rate limits are in memory, per instance (`express-rate-limit` in `app.ts`, plus `middlewares/rateLimit.ts`). That's correct for a single Railway instance. Before scaling to more than one instance, give those limiters a shared store (for example `rate-limit-redis` with Upstash). Without one, each instance enforces its own separate limit.
