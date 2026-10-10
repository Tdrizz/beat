# Phase 1 audit: Replit dependencies and storage plan

Status: Step 0 done. This document lists everything found, and proposes a storage design. No Phase 1 code changes yet.

## Step 0: leaked `CRON_SECRET`

- Removed the hardcoded value from `.replit` (`[userenv.shared]`). It first appeared in commit `3fea3f8`, so it's still in git history. Rotation is the fix, not a history rewrite.
- The code already reads `CRON_SECRET` only from `process.env` (`routes/digest.ts`, `routes/storage.ts`). Both fail closed when it's unset.
- Note: `CRON_SECRET` guards **two** endpoints, not one. Besides `POST /api/digest/run`, it also guards `POST /api/storage/uploads/cleanup`. Both need a scheduler on the new stack.
- `.gitignore` now ignores `.env` and `.env.*`, except `.env.example`.
- Re-scanned the working tree and full git history for Stripe, Clerk, Resend, Google API keys, Postgres URLs with passwords, and private keys. Nothing else turned up.
- **Action for Tittan:** rotate `CRON_SECRET` in Replit Secrets for the live app, and update whatever scheduled deployment calls it. Generate the new-stack value with `openssl rand -hex 32` directly in the host's secret store.

## Replit dependency inventory

### The five services (confirmed against the handoff doc)

| Service | Where | Finding |
| --- | --- | --- |
| Clerk | `middlewares/clerkProxyMiddleware.ts`, `app.ts` (`publishableKeyFromHost`) | As described. The frontend `ClerkProvider` sets no `proxyUrl`, so the proxy is used only because the Replit-issued publishable key points at it. With the owner's own Clerk app on a custom domain (`clerk.<domain>` CNAME), **drop the proxy and `publishableKeyFromHost`** and pass `CLERK_PUBLISHABLE_KEY` directly. |
| Object storage | `lib/objectStorage.ts`, `lib/objectAcl.ts` (sidecar `127.0.0.1:1106`) | As described. Routes also call raw GCS `File` methods directly (`getMetadata`, `delete`, `copy`) in `tutorials.ts`, `messages.ts`, `posts.ts`, so the GCS type leaks past the service. See the plan below. |
| Stripe | `lib/stripeClient.ts` | Uses Replit Connectors, and chooses test vs. live with `REPLIT_DEPLOYMENT`. It becomes `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY`, with test or live chosen by which keys are set. |
| Resend | `lib/email.ts` | As described: delete the connector fallback and require the env vars. |
| Gemini | `lib/integrations-gemini-ai/src/client.ts` | Replit proxy `baseUrl` with `apiVersion: ""`. It becomes `new GoogleGenAI({ apiKey: GEMINI_API_KEY })` with default endpoint and version. The model `gemini-2.5-flash-image` (`routes/aiTryon.ts:225`) still needs checking against Google's current model list. |

### Other Replit-specific code and config

| Item | Where | Action |
| --- | --- | --- |
| CORS allowlist from `REPLIT_DOMAINS` | `api-server/src/app.ts:74` | Replace with `ALLOWED_ORIGINS`. |
| Digest links from `REPLIT_DOMAINS` / `REPLIT_DEV_DOMAIN` | `routes/digest.ts:45` | Replace with `PUBLIC_APP_URL`. |
| Stripe checkout success/cancel URLs from `x-forwarded-host` | `routes/premium.ts:68` | Not in the handoff doc. Use `PUBLIC_APP_URL`. Building redirect URLs from a client-controllable header is also a small open-redirect risk. |
| Webhook dev bypass checks `REPLIT_DEPLOYMENT` | `lib/stripeWebhook.ts:70` | Rely on `NODE_ENV === "production"` only. |
| `stripe-replit-sync` dependency | `api-server/package.json` | **Unused** (no imports). Remove it. |
| `@replit/vite-plugin-*` and `REPL_ID` checks | `artifacts/*/vite.config.ts`, `package.json`s, `pnpm-workspace.yaml` catalog | Remove. Default `BASE_PATH=/`. Default `PORT` for dev and preview only, since `vite build` doesn't need it. |
| `minimumReleaseAgeExclude` entries | `pnpm-workspace.yaml` | Drop `@replit/*` and `stripe-replit-sync` when the packages go. `@clerk/*` is also excluded "temporarily" per its own comment. I recommend removing that exclusion too; it weakens the supply-chain defense. `minimumReleaseAge` itself stays. |
| Platform `overrides` strip every non-linux-x64 native binary | `pnpm-workspace.yaml:80+` (esbuild, rollup, lightningcss, tailwind oxide) | The comment says "replit uses linux-x64 only". This **breaks installs and builds on macOS, Apple Silicon, and ARM hosts**, including your laptop and Capacitor builds later. Vercel and Railway are linux-x64, so it's not a blocker there. Recommend deleting the overrides block. |
| `.replit-artifact/artifact.toml` (x4) | `artifacts/*/` | Encodes the real deploy config: API build `pnpm --filter @workspace/api-server run build`, start `node --enable-source-maps artifacts/api-server/dist/index.mjs`, health check `/api/healthz`, and SPA fallback rewrite `/* -> /index.html`. Port these to Railway and Vercel config, then delete. |
| `.replit`, `.replitignore`, `scripts/post-merge.sh` | root | Delete in Phase 1. `post-merge.sh` runs `drizzle-kit push` on every merge, which must not carry over. (`replit.nix` doesn't exist.) |
| `.agents/` | root | Replit Agent memory and generated-asset metadata. Useful history (`presigned-upload-verification.md`, `gemini-tryon-fidelity.md`). Recommend moving the memory notes into `docs/notes/` and deleting the rest. |
| `trust proxy = 1` | `app.ts:24` | Behind a Vercel rewrite to Railway there may be two proxy hops. Needs verifying on staging, or every user could share one rate-limit bucket. |
| `replit.md` | root | Rename to `docs/ARCHITECTURE.md`. |
| `// @replit` comments | shadcn `button.tsx`, `badge.tsx` | Cosmetic. Leave them. |
| Node version | — | Repo targets Node 24, but nothing pins it. Add `engines.node` and `.nvmrc` so Vercel and Railway pick it up. |

### Prototypes

`artifacts/makeup-ar` and `artifacts/mockup-sandbox` aren't imported or referenced by `glamr`, `api-server`, or any `lib/*` package. Their only wiring is their own `artifact.toml` (served on `/makeup-ar/` and `/__mockup` inside Replit). Right now they are still typechecked and built by `pnpm run build`. **Recommend deleting both.** They live in git history if ever needed. The alternative is excluding them from the workspace `packages` list.

### Database

- `lib/db` has only `push` and `push-force` scripts, with no migrations directory. The plan: add `generate` and `migrate` scripts, generate a baseline migration from the current schema, and mark it as applied on the existing DB rather than re-running it.
- **Seeds run on every API boot** (`api-server/src/index.ts:29`: `seedBrandsIfEmpty`, `seedClassesIfEmpty`). They're idempotent ("if empty"), but they insert placeholder `seed_creator_*` profiles into production. **Decision needed:** gate them behind `NODE_ENV !== "production"` or a `RUN_SEEDS=1` flag, or keep them in prod.

### `.env.example`

Created at the repo root with the target list from the handoff doc, plus `BASE_PATH` and the dev-only `STRIPE_WEBHOOK_DEV_INSECURE`, which the code reads.

## Storage swap plan (for review before any code)

### Goals

1. Keep the external contract identical:
   - `POST /storage/uploads/request-url` returns `{ uploadURL, objectPath, metadata }`, and the client PUTs the raw file to `uploadURL`.
   - `POST /storage/uploads/finalize` stays single-shot and owner-bound.
   - `GET /storage/objects/*` stays ACL-gated (public visibility readable by all, private for owner only, no policy means unreadable).
   - `GET /storage/public-objects/*` and `POST /storage/uploads/cleanup` keep working.
   - Stored paths keep the format `/objects/uploads/<uuid>` and `/objects/shared/<uuid>`, so **no DB rewrite** is needed for existing rows.
2. Make no frontend changes. `lib/object-storage-web`, `Upload.tsx`, `saveWigTryOn.ts`, and `TutorialStepVideoUploader.tsx` should keep working as they are.

### Design

**Client.** Use `@supabase/supabase-js` with `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, server-side only. Drop `@google-cloud/storage`.

**Buckets.**
- `STORAGE_BUCKET_PRIVATE` is a **private** bucket holding `uploads/<uuid>` and `shared/<uuid>`. It's private even for objects with "public" visibility, because all reads go through our ACL-gated route, exactly as today.
- `STORAGE_BUCKET_PUBLIC` replaces `PUBLIC_OBJECT_SEARCH_PATHS` for `/storage/public-objects/*`. Nothing in the frontend currently calls this route, but I'll keep it for parity.
- I'll set bucket-level `file_size_limit` and `allowed_mime_types` (image/*, video/*) as an extra upload guard on top of the existing route checks.

**ACL storage: move from object metadata to a Postgres table** (recommended change). Supabase Storage can't update custom metadata on an existing object without re-uploading it, and the upload happens client-side before `finalize`. So the policy lives in a new Drizzle table:

```
object_acls(
  object_path text primary key,   -- "/objects/uploads/<uuid>"
  owner_id    text not null,
  visibility  text not null check (visibility in ('public','private')),
  acl_rules   jsonb,
  created_at  timestamptz default now()
)
```

This also improves on today's behavior:
- `finalize` becomes `INSERT ... ON CONFLICT DO NOTHING RETURNING`, which is atomic. Today it does check-then-set, and two concurrent finalizes can race.
- Account deletion (Phase 2) can find every upload a user owns with one query.
- Abandoned-upload cleanup becomes "objects under `uploads/` older than 24h with no `object_acls` row".

`objectAcl.ts` keeps its exported API (`ObjectAclPolicy`, `ObjectPermission`, `canAccessObject`, `getObjectAclPolicy`, `setObjectAclPolicy`), but the functions take an object path instead of a GCS `File`.

**Storage interface.** `objectStorage.ts` exposes a small `StoredObject` (`{ path, bucket, getMetadata(): { contentType, size, createdAt }, delete() }`) instead of GCS `File`. The service method names stay the same. Route changes come to about five call sites, swapping `const [metadata] = await file.getMetadata()` for `await file.getMetadata()` in `tutorials.ts`, `messages.ts`, and `posts.ts`.

| Operation | Today (GCS via sidecar) | Supabase |
| --- | --- | --- |
| Presigned upload | sidecar-signed GCS PUT, 15 min TTL | `createSignedUploadUrl("uploads/<uuid>")`. Browser PUTs the raw body. The API returns `objectPath` directly instead of parsing it from the URL. |
| Exists / metadata | `file.exists()` / `getMetadata()` | `storage.from(bucket).info(path)` (or `list` on the parent with a `search`) |
| Download | GCS read stream to Express | Stream `fetch(${SUPABASE_URL}/storage/v1/object/authenticated/<bucket>/<path>)` with the service key and pipe it. This keeps the same `Content-Type`, `Content-Length`, and `Cache-Control` (public/private) behavior. `supabase-js` `download()` would buffer the whole file, so I'm avoiding it. |
| Copy to public (`wigs.ts`) | `file.copy` + set ACL | `storage.copy("uploads/x", "shared/<uuid>")` + insert an `object_acls` row |
| Delete | `file.delete()` | `storage.remove([path])` + delete the ACL row |
| Cleanup | list prefix + metadata per file | paginated `list("uploads")` + left-join against `object_acls` |

**Differences to know about:**
- Supabase signed upload URLs live **2 hours**, and the TTL isn't configurable. Today it's 15 minutes. That's acceptable because finalize is owner-bound and unfinalized objects are unreadable and cleaned up. The alternative is Supabase's S3-compatible endpoint with `@aws-sdk/s3-request-presigner`, which gives configurable TTL and signed `Content-Type` and `Content-Length`. The cost is two more secrets (S3 access key and secret). I recommend the native API unless you want the tighter TTL.
- I'll verify in a spike that a raw `fetch(PUT, body=file, Content-Type)` to the signed URL stores the correct `contentType`, since the routes validate it. That spike runs first, against a dev Supabase project.
- Range requests for video aren't supported today either, so there's no regression. It could be added later with a 302 to a short-lived signed URL, which also offloads bandwidth from Railway.

**Data migration (Phase 3, noted now).** A script running inside the Replit project, where the sidecar credentials work, walks `PRIVATE_OBJECT_DIR`. For each object it uploads the bytes to the same relative path in the private bucket and writes an `object_acls` row from the `custom:aclPolicy` metadata. Objects with no policy are skipped, since they're abandoned uploads. It's idempotent and re-runnable for the final sync.

**Tests.** Unit tests for `canAccessObject` and finalize semantics (single-shot, owner-only no-op, 404 on missing). Then a manual end-to-end pass on post image upload, DM image attach, wig try-on save to public, and tutorial video upload.

## Decisions needed

1. Approve the storage design, especially **ACLs moving to a Postgres table** and **native signed URLs (2h TTL) vs. the S3 endpoint**.
2. Seeds in production: gate them or keep them?
3. Delete `makeup-ar` and `mockup-sandbox` outright, or only exclude them?
4. OK to delete the non-x64 platform overrides in `pnpm-workspace.yaml` and the `@clerk/*` release-age exclusion?
5. Branch: CLAUDE.md says `migration`. This session is pinned to `snowbaby/keen-darwin-x07c4l`. Either way nothing goes to `main`. Say if you want it renamed.
