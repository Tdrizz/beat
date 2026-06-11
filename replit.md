# Glamr

Glamr is a social platform focused on beauty and fashion, offering AI-powered try-ons, personalized recommendations, and community features.

## Run & Operate

- `pnpm run typecheck`: Full typecheck across all packages.
- `pnpm run build`: Typecheck + build all packages.
- `pnpm --filter @workspace/api-spec run codegen`: Regenerate API hooks and Zod schemas from OpenAPI spec.
- `pnpm --filter @workspace/db run push`: Push DB schema changes (dev only).
- `pnpm --filter @workspace/api-server run dev`: Run API server locally.

**Environment Variables:**
- `VITE_CLERK_PUBLISHABLE_KEY`: For Clerk authentication.
- `CURATOR_USER_IDS`: Comma-separated Clerk user IDs allowed to upload/manage tutorial step demo clips (fail-closed; unset ⇒ no curators). See "Tutorial step video clips".

## Stack

- **Monorepo Tool**: pnpm workspaces
- **Node.js Version**: 24
- **Package Manager**: pnpm
- **TypeScript Version**: 5.9
- **API Framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (v4), `drizzle-zod`
- **API Codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Where things live

- **Design System**: `artifacts/glamr/src/index.css` (theme), `src/index.css` (comments for key decisions)
- **Database Schema**: `lib/db/src/schema/{profiles,posts,messages,affiliate,tutorials}.ts`
- **Tutorial step clips (curator)**: schema + step counts `lib/db/src/schema/tutorials.ts`; routes `artifacts/api-server/src/routes/tutorials.ts`; curator gate `artifacts/api-server/src/middlewares/requireCurator.ts`; uploader UI `artifacts/glamr/src/components/TutorialStepVideoUploader.tsx`; detail page `artifacts/glamr/src/pages/TutorialDetail.tsx`
- **API Routes**: `artifacts/api-server/src/routes/{profiles,posts,social,messages,brands,affiliate,storage}.ts` (`social.ts` includes `/profiles/me/friends`, `/profiles/featured`, `/profiles/search`, `/follows/status` — must mount **before** `profilesRouter`)
- **Friends page**: `artifacts/glamr/src/pages/Friends.tsx`
- **Archetype Definitions**: `lib/archetypes.ts`, `lib/archetypeQuiz.ts`
- **Notification Helpers**: `lib/db/src/schema/notifications.ts`, `artifacts/api-server/src/lib/notify.ts`
- **Social Links Metadata**: `lib/socialLinks.ts`
- **Skin Nutrition Data**: `lib/skinNutrition.ts`
- **Makeup Tools Data**: `lib/tools.ts`
- **Seasonal Look Catalogue**: `lib/looks.ts`
- **Slay Bible (Skincare Guide)**: `artifacts/glamr/src/lib/slayBible.ts`, `artifacts/glamr/src/pages/SlayBible.tsx`
- **Beauty Pageant Looks**: `artifacts/glamr/src/lib/pageantLooks.ts`
- **Drag Queen Looks**: `artifacts/glamr/src/lib/dragLooks.ts`
- **The Teapot (Community Feed)**: `artifacts/glamr/src/pages/Teapot.tsx`
- **Esthetician Hub (Premium)**: `artifacts/glamr/src/pages/EstheticianHub.tsx`
- **Kindness Prompt**: `artifacts/glamr/src/components/KindnessPrompt.tsx`
- **Period/Cycle Tracker**: `artifacts/glamr/src/pages/PeriodTracker.tsx`
- **Live Classes**: `artifacts/glamr/src/pages/{Classes,ClassDetail,HostClass}.tsx`, `artifacts/api-server/src/routes/classes.ts`, schema `lib/db/src/schema/classes.ts`, seed `artifacts/api-server/src/lib/seedClasses.ts`
- **Premium (Stripe)**: `artifacts/glamr/src/pages/Premium.tsx`, hook `artifacts/glamr/src/hooks/usePremium.ts`, server `artifacts/api-server/src/{routes/premium.ts,lib/stripeClient.ts,lib/stripeWebhook.ts,lib/premium.ts,middlewares/requirePremium.ts}` — `premium_until` + `stripe_customer_id` columns on `profiles`

## Architecture decisions

- **Mood-first navigation**: 6 mood pills prominently displayed on the Home screen to guide user search.
- **Always-visible CTAs**: `LookCard` actions are always visible, improving touch usability and discoverability.
- **On-device Archetype Quiz**: The "Iola test" is fully client-side and stores results locally, with best-effort server syncing.
- **Gemini AI Integration**: The only try-on mechanism is via Gemini AI, with skin-tone adaptation integrated directly into the prompt generation.
- **Foundation matched to NECK, not face**: `useFaceAnalysis` extrapolates sample points below the chin/jawline because face pixels are contaminated by makeup, redness, and sun. Cheek samples are kept only as a fallback when the neck is occluded.
- **In-memory Rate Limiting**: Token-bucket middleware is used for rate limiting, keyed by Clerk userId, but is single-instance only (no Redis for horizontal scaling).

## Product

- **AI Try-On**: Gemini AI-powered virtual try-on with multi-angle gallery and skin-tone adaptation.
- **Personalized Content**: Beauty archetype quiz drives personalized content, feed filtering, challenges, and AI try-on guidance.
- **Social Features**: User profiles, posts, likes, comments, follows, DMs, and notifications.
- **Affiliate Program**: Creators can earn from product recommendations with an affiliate dashboard.
- **Curated Content**: Dedicated sections for skin nutrition guidance and makeup tools catalogue.
- **Onboarding Checklist**: Guides new users through initial engagement steps.
- **The Slay Bible**: Skincare guide covering 16 conditions (eczema, blemishes, dark circles, etc.) with do/avoid lists, key ingredients, and makeup tips.
- **Beauty Pageant Looks**: 12 stage-ready pageant looks from teen fresh to crown-worthy finale.
- **Drag Queen Looks**: 12 drag looks from classic queen to alien fantasy and ballroom eleganza.
- **The Teapot**: Public community feed where all users can post and interact.
- **Esthetician Hub**: Premium directory for licensed estheticians to promote their services.
- **Kindness Prompt**: Anti-bullying overlay triggered by derogatory language in posts/captions — shows "be kind" message for 5 seconds before allowing resume.
- **Cycle Tracker**: On-device period tracker with phase detection (menstrual, follicular, ovulation, luteal), next-period prediction, and phase-specific skin/makeup/self-care tips. All data stored in localStorage.

### Tutorial step video clips

`TutorialStep` supports an optional `videoUrl` (and optional `videoPoster`) for a short demo clip rendered inline above the written body on `TutorialDetail`. There are two ways a clip gets onto a step:

1. **In-app curator uploader (preferred).** Signed-in **curators** see an inline "Add clip / Replace clip / Remove" control under each step on `TutorialDetail` (`artifacts/glamr/src/components/TutorialStepVideoUploader.tsx`). It validates type/size/duration client-side, uploads the clip (and a best-effort auto-captured poster frame) via the presigned-URL flow, then writes the object paths back to `PUT /api/tutorials/:id/steps/:stepIndex/video`. These uploads are stored per `(tutorialId, stepIndex)` in the `tutorial_step_videos` table and **override** the static catalogue entry for that step; removing the row falls back to whatever the catalogue ships. The server re-verifies each uploaded object's **real** GCS content-type/size before persisting (a presigned URL can't constrain what the client PUTs), and marks the objects public so the served route is readable.

2. **Static catalogue (defaults shipped in code).** Paste an `objectPath` (e.g. `/objects/uploads/<uuid>`) — or a fully-qualified CDN URL — into a step's `videoUrl` in `artifacts/glamr/src/lib/tutorials.ts` (same for `videoPoster`). Use the manual presigned flow to get the path:
   - `POST /api/storage/uploads/request-url` with `{ name, size, contentType: "video/mp4" }` to get a presigned `uploadURL` + canonical `objectPath`.
   - `PUT` the file directly to `uploadURL`.
   - `POST /api/storage/uploads/finalize` with `{ objectPath, visibility: "public" }` — this is **required** for curated clips. The `GET /storage/objects/*` route is ACL-gated, so without a `public` finalize the clip will 401 for everyone except you.
   - Paste the returned `objectPath` (e.g. `/objects/uploads/<uuid>`) into the catalogue.

The detail page resolves `/objects/...` to the served `/api/storage/objects/...` route automatically (see `resolveTutorialMediaUrl`), so you can store the canonical entity path verbatim.

Storage limits / authoring guidance (enforced by both the in-app uploader and the server):
- **Length**: 10-30 seconds per clip. Anything longer belongs in a full tutorial.
- **Size**: keep each clip ≤ 8 MB (poster ≤ 4 MB). H.264 MP4, 720p, ~1.5 Mbps, AAC audio (or muted) hits this comfortably.
- **Aspect**: 16:9 to match the inline player's `aspect-video` frame; vertical clips will be letterboxed.
- **Privacy**: served via the ACL-gated `GET /api/storage/objects/*` route. Curated tutorial clips must be finalized as `public` (step 3 above) so signed-out and other users can play them; user-private uploads should be finalized as `private` so only the uploader can read them.

## User preferences

- _Populate as you build_

## Gotchas

- `TopNav` is globally mounted in `App.tsx`; pages must not render their own `TopNav`.
- Conditional `return null` for `TopNav` must be **after** all hook calls to prevent "Rendered fewer hooks than expected" errors.
- Selfies are mirrored on both preview and capture to ensure text reads correctly.
- Rate limiting is in-memory; horizontal scaling would require Redis.
- `POST /ai-tryon` is auth + rate-limited (10 calls / 5 min / user). Never remove either guard — the route hits Gemini image generation on every call (paid, unbounded cost if left open).
- `socialRouter` must remain mounted **before** `profilesRouter` in `routes/index.ts`, otherwise `/profiles/:handle` swallows `/profiles/featured`, `/profiles/search`, and `/profiles/me/friends`.
- `GET /storage/objects/*` is ACL-gated: objects with `visibility: "public"` are world-readable, everything else requires the caller's Clerk userId to match the ACL owner, and objects with no policy at all return 401/403. Uploaders MUST call `POST /storage/uploads/finalize` after their PUT — without it the object is permanently unreadable through this route.
- Stripe webhook (`/api/stripe/webhook`) must be mounted **before** `express.json()` in `app.ts` so the raw body is preserved for signature verification.
- `POST /classes` is gated by `requirePremium` — host-class form must hide/disable for non-premium users (handled by `usePremium()` in `HostClass.tsx`).
- Classes seed (`seedClassesIfEmpty`) inserts placeholder instructor profiles with `userId` like `seed_creator_*` — these are not real Clerk users; do not assume `profiles.userId` always maps to a Clerk identity.
- **publicProfile Redaction**: `lib/publicProfile.ts` provides `publicProfile` and `publicProfileOrNull` helpers that strip sensitive billing fields (`stripeCustomerId`, `premiumUntil`) from profile objects. These MUST be used in any route returning profile data to other users (e.g., feed, comments, instructor profiles) to avoid leaking PII/billing status.

### Health sweep — May 2026

- **Typecheck**: green across all 5 workspace projects (`pnpm run typecheck`).
- **Builds**: `@workspace/api-server` and `@workspace/glamr` both build cleanly when invoked through the configured workflows (which provide the `PORT` / `BASE_PATH` env vars Vite relies on); a bare `pnpm --filter ... run build` from a plain shell will fail without those vars set. Vite emits a "sourcemap reporting" notice on a few Radix-wrapping `ui/*` files (`tooltip`, `sheet`, `progress`, `avatar`, `dropdown-menu`); cosmetic, build still succeeds.
- **Static**: zero `any`, `@ts-ignore`, `@ts-expect-error`, or `TODO/FIXME` left in app code. Only one `console.warn` (in `useFaceAnalysis` when `video.play()` rejects), which is intentional.
- **Auth audit**: every mutating route is auth-gated except the now-fixed `POST /ai-tryon`, which was open to anonymous callers and burning Gemini credits. Added `requireAuth` + a 10/5-min token-bucket rate limit.
- **A11y**: search input on `Friends.tsx` was relying on a placeholder for context — added `aria-label`. All `<img>` tags carry alt text. No `<button>` was rendering with neither text nor aria-label on any audited page.
- **Smoke**: `/`, `/api/profiles/featured` → 200; `/api/profiles/search` and `/api/ai-tryon` → 401 anonymously, as expected.
- **Known but out-of-scope**: ~36 unused shadcn `ui/*` components scaffolded but never imported (kept — shadcn is a component library); main JS bundle is 1.5 MB ungzipped (447 kB gzipped) — would benefit from route-level code splitting later.

## Pointers

- [pnpm-workspace skill](https://www.replit.com/talk/pnpm-workspace-skill) for workspace structure and TypeScript setup.
- Clerk documentation for authentication: `@clerk/react`, `@clerk/express`.
- Drizzle ORM documentation.
- Zod documentation for validation.
- Orval documentation for API codegen.
- Uppy documentation for `<ObjectUploader>`.