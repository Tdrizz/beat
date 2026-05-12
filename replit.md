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
- **Database Schema**: `lib/db/src/schema/{profiles,posts,messages,affiliate}.ts`
- **API Routes**: `artifacts/api-server/src/routes/{profiles,posts,social,messages,brands,affiliate,storage}.ts` (`social.ts` includes `/profiles/me/friends`, `/profiles/featured`, `/profiles/search`, `/follows/status` — must mount **before** `profilesRouter`)
- **Friends page**: `artifacts/glamr/src/pages/Friends.tsx`
- **Archetype Definitions**: `lib/archetypes.ts`, `lib/archetypeQuiz.ts`
- **Notification Helpers**: `lib/db/src/schema/notifications.ts`, `artifacts/api-server/src/lib/notify.ts`
- **Social Links Metadata**: `lib/socialLinks.ts`
- **Skin Nutrition Data**: `lib/skinNutrition.ts`
- **Makeup Tools Data**: `lib/tools.ts`
- **Seasonal Look Catalogue**: `lib/looks.ts`

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

## User preferences

- _Populate as you build_

## Gotchas

- `TopNav` is globally mounted in `App.tsx`; pages must not render their own `TopNav`.
- Conditional `return null` for `TopNav` must be **after** all hook calls to prevent "Rendered fewer hooks than expected" errors.
- Selfies are mirrored on both preview and capture to ensure text reads correctly.
- Rate limiting is in-memory; horizontal scaling would require Redis.
- `POST /ai-tryon` is auth + rate-limited (10 calls / 5 min / user). Never remove either guard — the route hits Gemini image generation on every call (paid, unbounded cost if left open).
- `socialRouter` must remain mounted **before** `profilesRouter` in `routes/index.ts`, otherwise `/profiles/:handle` swallows `/profiles/featured`, `/profiles/search`, and `/profiles/me/friends`.
- `GET /storage/objects/*` currently has no auth/ACL guard (placeholder). If/when private user uploads start being stored there, uncomment the auth + ACL block in `storage.ts` first.

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