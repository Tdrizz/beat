# Cutover runbook: Replit → Supabase / Railway / Vercel

How to move live users, data and files off Replit with minimal downtime and a rollback path. Rehearse the whole thing on staging first. Every step below has been run end to end locally against a simulated Replit database.

Scripts:

| Where it runs | Script | What it does |
| --- | --- | --- |
| Replit shell | `scripts/replit/export-db.sh` | `pg_dump` of live **data only** → `glamr-data.dump`, plus a user count |
| Replit shell | `scripts/replit/export-clerk-users.mjs` | Exports all Clerk users → `users.json` |
| Replit shell | `scripts/replit/copy-objects.mjs` | Copies every stored file to Supabase Storage; writes the ACL policies → `acl-manifest.jsonl` |
| Anywhere with this repo | `pnpm --filter @workspace/scripts run migrate:import-acls` | Loads `acl-manifest.jsonl` into `object_acls` |
| Anywhere with this repo | `pnpm --filter @workspace/scripts run migrate:import-clerk-users` | Creates the users in the **new** Clerk instance → `id-map.json` |
| Anywhere with this repo | `pnpm --filter @workspace/scripts run migrate:remap-user-ids` | Rewrites every user id in the database to the new Clerk ids (one transaction) |

The Replit scripts are plain Node with no workspace dependencies. **Copy them into the Replit shell; don't merge this branch into the Replit project.**

The exported files contain personal data. Keep them off laptops and shared drives where possible, never commit them, and delete them after cutover.

## 0. Decisions and facts to confirm first

1. **Real user count:** `bash export-db.sh` prints it, and `export-clerk-users.mjs` reports the Clerk total.
2. **Stripe:** which Stripe account does the Replit connector use?
   - **The owner's own account:** use the same keys on the new stack. Customers and subscriptions carry over untouched, and `profiles.stripe_customer_id` stays valid.
   - **A Replit-managed account:** active subscriptions live there. Ask Stripe support to copy customers and payment methods to the owner's account, then recreate the subscriptions, or move subscribers over at their next renewal. Count the active subscribers first; if there are only a handful, emailing them a new checkout link is simplest.
3. **Passwords:** the Clerk API can't export password hashes. Migrated users sign in with an email code, or use "Forgot password". Users who signed in with Google or Apple sign in the same way, and Clerk links the account by verified email. Turn on **email code** sign-in in the new Clerk instance and plan the announcement email (step 7).

## 1. Prepare the new stack (no downtime)

1. Set up Supabase, Railway, Vercel, Clerk, Stripe, Resend, Sentry and the scheduler per `docs/DEPLOYMENT.md`. Railway's pre-deploy step creates the schema.
2. In the new Clerk instance, enable the sign-in methods the old app had: email and the same social providers.
3. Deploy, and smoke-test on the Railway or Vercel URLs with a test account.

## 2. Rehearse on staging

Run steps 3–6 against a **staging** Supabase project and a **development** Clerk instance using real exports. Then sign in as a few migrated users (email code) and check their posts, DMs, saved wigs, Premium status and uploads. Fix anything before the real run.

## 3. Copy files (can run while Replit is still live; re-runnable)

In the Replit shell, from the repo root:

```bash
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
STORAGE_BUCKET_PRIVATE=glamr-private STORAGE_BUCKET_PUBLIC=glamr-public \
NODE_PATH=artifacts/api-server/node_modules \
node copy-objects.mjs > acl-manifest.jsonl
```

It copies each file to the same relative key, so stored `/objects/...` paths stay valid. It skips files already copied, so you can run it now and again during the final sync. Files that were never finalized (abandoned uploads) are copied but get no ACL, and the daily cleanup removes them.

## 4. Freeze writes and take the final snapshot (downtime starts)

Pick a quiet hour, and put up a banner a day ahead.

1. Stop writes on Replit: unpublish the deployment, or swap in a static maintenance page.
2. Run `node copy-objects.mjs > acl-manifest.jsonl` once more to pick up the last uploads.
3. Run `bash export-db.sh` to produce `glamr-data.dump`.
4. Run `node export-clerk-users.mjs > users.json`.

## 5. Load data into Supabase

From any machine with this repo checked out and `pnpm install` done:

```bash
# Schema already exists (Railway pre-deploy ran the migrations).
pg_restore --data-only --no-owner --no-privileges -d "$DATABASE_DIRECT_URL" glamr-data.dump
DATABASE_URL="$DATABASE_DIRECT_URL" pnpm --filter @workspace/scripts run migrate:import-acls ./acl-manifest.jsonl
```

If `pg_restore` reports a column the new schema doesn't have, the Replit database drifted from the code. Check that column against `lib/db/migrations` before going further.

## 6. Move users to the new Clerk instance

```bash
CLERK_SECRET_KEY=<new instance secret> \
  pnpm --filter @workspace/scripts run migrate:import-clerk-users ./users.json ./id-map.json --dry-run
CLERK_SECRET_KEY=<new instance secret> \
  pnpm --filter @workspace/scripts run migrate:import-clerk-users ./users.json ./id-map.json
DATABASE_URL="$DATABASE_DIRECT_URL" pnpm --filter @workspace/scripts run migrate:remap-user-ids ./id-map.json
```

- The import checkpoints `id-map.json` after every user and is safe to re-run.
- Each new Clerk user keeps the old id as `external_id`.
- Banned users stay banned.
- The remap is all-or-nothing. A test guarantees it covers every user-id column, including future ones.

**Admin and curator ids:** after the remap, update `ADMIN_USER_IDS` and `CURATOR_USER_IDS` on Railway to the new ids (look them up in `id-map.json`).

## 7. Switch traffic (downtime ends)

1. Point the domain's DNS at Vercel, and set `PUBLIC_APP_URL` and `ALLOWED_ORIGINS` to it.
2. Update the Stripe webhook endpoint to the new URL. Switch to live keys if staging used test keys.
3. Add the `APP_URL` and `CRON_SECRET` GitHub secrets, and merge to `main`, so the scheduled jobs start.
4. Email users: "We've moved! Sign in with your email; you'll get a one-time code."

## 8. Verify

- [ ] Sign in as a migrated user (email code), plus one social-login user.
- [ ] Their feed, profile, posts, comments, DMs (including photos), saved wigs, combos and bookmarks are all present.
- [ ] A Premium user still shows Premium. The billing portal opens. A test webhook arrives.
- [ ] Upload a post image, and attach a DM photo.
- [ ] AI try-on works, and the Sentry test event arrives.
- [ ] `POST /api/digest/run` with the secret returns a summary. Run it manually from the Actions tab.

## Rollback

Until DNS is switched, rollback is just re-publishing the Replit deployment. After the switch, point DNS back to Replit and re-publish. Anything users did on the new stack in between would be lost, so decide quickly, within the first hour. Keep the Replit project and its database untouched for about a week after cutover, then retire it. Also rotate `CRON_SECRET`, and remove Replit's access to the Stripe connector.
