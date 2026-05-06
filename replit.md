# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Design system & habit mechanics

`artifacts/glamr` is tuned for women aged 14–35. Key decisions documented in
`src/index.css` comments; daily-habit components live alongside features:

- **Theme** (`src/index.css`): warm cream / deep plum-mocha backgrounds,
  rose-pink primary (340°), coral accent (18°), `--radius: .75rem`. Replaces
  the older amber-on-black palette. Includes `.blush-glow` utility and a
  re-tinted `.vanity-bg`.
- **Streak** (`src/hooks/useStreak.ts` + `src/components/StreakBadge.tsx`):
  localStorage daily-action counter. `recordToday()` is called on `TryOn`
  mount and is idempotent.
- **Mood-first picker** (`src/components/MoodRail.tsx`): 6 mood pills above
  the fold on Home; each maps to a search query into the existing look filter.
- **Always-visible card CTAs**: `LookCard`'s footer no longer uses
  `opacity-0 group-hover` (broken on touch); primary "Try with AI" + secondary
  "Details" link stay visible.

## Personalisation

- **Beauty archetype quiz** ("Iola test"): 5-question on-device quiz at
  `/archetype` (no auth needed; result persisted in `localStorage` via
  `useArchetype`). Six archetypes (Romantic / Siren / Icon / Muse / Rebel /
  Naturalist) each carry a signature palette, mood-keyword matchers, and
  per-area tips. Definitions in `lib/archetypes.ts`, questions/scoring in
  `lib/archetypeQuiz.ts`. Quiz has an Undo button that clears the prior
  answer (so re-picking the same option still triggers auto-advance).
- **Server mirror**: `profilesTable.archetype` (varchar(16),
  enum-validated). `useArchetype` syncs to `PUT /profiles/me/archetype`
  best-effort; ProfileSetup seeds the archetype on first profile create.
- The archetype is plumbed into the AI try-on prompt — `useAITryOn` sends
  `{ archetype }`, `aiTryon.ts` enum-validates it and adds a short
  finish-bias paragraph (`ARCHETYPE_GUIDANCE`) so the generated image
  leans the right direction on top of skin tone + per-step shades.
- Home shows an `<ArchetypeCallout />`; TopNav has a permanent "Iola" link.

### Archetype-driven features
- **Iola feed scope** (`GET /api/feed?scope=iola`): server picks viewer's
  archetype (profile col, falls back to `?archetype=`) and ILIKE-filters
  posts by `mood` against `ARCHETYPE_MOOD_MATCHERS` (mirror of frontend
  matchers in `artifacts/api-server/src/lib/archetypeMatch.ts`).
- **Weekly challenge** (`GET /api/archetype/challenge?archetype=`):
  pure-function rotation per ISO week, copy in `ARCHETYPE_CHALLENGES`.
  Surfaced via `<WeeklyChallenge />` on Iola feed tab.
- **Archetype-match notifications**: on `POST /api/posts`, server fans out
  `kind: "match"` notifs (parallel, capped 50) to followers whose
  archetype matches the post's mood. Rendered with Wand2 icon.
- **Profile archetype card** on `UserProfile` + inline `<ArchetypeBadge />`
  next to author handle on every PostCard.
- **Brands "For the {archetype}" rail**: curated category + keyword
  affinity per archetype filters the products grid.
- **Shareable card**: result page has "Save card" → vanilla canvas
  renders a 1080² PNG (gradient + name + tagline + palette + description).
- **Post-to-feed from AI try-on**: AITryOnModal stashes the current
  generated dataURL in sessionStorage (`beat:upload:prefill`); Upload
  picks it up on mount, blob-uploads via the standard presigned PUT, and
  prefills caption + lookId.

## AI

- Gemini AI integration (Replit-managed, no key required) is the **only** try-on
  mechanism in `artifacts/glamr`. Endpoint: `POST /api/ai-tryon`. Frontend:
  `useCamera` (live preview) + `useAITryOn` hook + `AITryOnModal`. Model:
  `gemini-2.5-flash-image` (nano banana).
- **Skin-tone adaptation**: `useAITryOn` samples the captured frame
  (cheek/nose patches) and sends `{ hex, category, undertone }` to the API.
  `aiTryon.ts` enum-validates these (no prompt injection) and adds
  per-undertone guidance to the prompt so foundation matches and
  blush/lip shades flatter the user, while preserving original skin texture.
- **Collapsible side panel**: `TryOn.tsx` ships a `panelCollapsed` toggle
  (defaults collapsed on mobile via `matchMedia`). Collapsed → camera fills
  the viewport and a floating "Look details" pill restores the panel.
- **Multi-angle gallery**: `useAITryOn` now exposes `gallery: AngleResult[]`
  + `currentIndex` instead of a single `result`. Each `run({ angleLabel })`
  appends a generated image. `AITryOnModal` shows a live mirrored PiP of the
  parent camera stream, suggests the next un-captured angle (Front, Slight
  left/right, Chin up/down), and renders thumbnails + prev/next chevrons +
  arrow-key nav so the user can swipe through every captured angle.
- The previous canvas-based AR overlay engine (MediaPipe FaceLandmarker +
  `makeupRenderer` + `shadeMatch` + `useFaceAR`) has been removed from the
  try-on flow. `useFaceAnalysis` is still used by `LookMatch.tsx` for face/skin
  scanning to recommend looks — that's a separate feature.

## Notifications, ranking & rate limiting

- **Notifications**: `notifications` table (`lib/db/src/schema/notifications.ts`),
  `notify()` helper (`artifacts/api-server/src/lib/notify.ts`) called from
  like/comment/follow/message inserts (best-effort, swallows errors, skips
  self-notify). Routes: `GET /api/notifications`, `GET /unread-count`,
  `POST /mark-all-read`. UI: `<NotificationsBell />` in `TopNav` with 30s poll.
- **Rate limiting**: in-memory token-bucket middleware
  (`middlewares/rateLimit.ts`), keyed by Clerk userId (falls back to IP).
  Applied to post-create (10/min), like (60/min), comment (20/min), follow
  (30/min), message (30/min), profile-create (5/min). Returns 429 + Retry-After.
  Single-instance only — would need Redis for horizontal scale.
- **Feed**: `GET /api/feed?scope=foryou|following&season=&cursor=&limit=`
  returns `{ posts, nextCursor }`. For-You ranks by
  `likeCount + 2*commentCount` decayed by hours since post (no cursor on
  ranked page); subsequent paginated fetches fall back to recency. Following
  scope requires auth. Response shape changed — frontend uses `data.posts`.
- **Remix tree**: `GET /api/looks/:lookId/remix-stats` → `{ count, recent[] }`.
  Surfaced via `<RemixCount lookId>` on `LookDetail`.
- **Share to DM**: `<ShareToDmButton shareBody>` modal lists existing
  conversations and posts the prefilled body. Mounted on every PostCard and
  next to the Try-On CTA on `LookDetail`.
- **Onboarding**: `<OnboardingChecklist />` (auth-guarded) in `Feed`'s empty
  state — auto-ticks 3 steps from real DB data (5 follows / try a look /
  share a post).
- **Object storage cleanup**: `DELETE /api/posts/:id` now deletes the backing
  storage object (best-effort, tolerates `ObjectNotFoundError`) plus
  cascades likes/comments rows.
- **Affiliate dashboard**: `GET /api/affiliate/me/stats?days=&limit=` returns
  `{ totalClicks, totalEstCents, byProduct, series, days, estConversionRate }`.
  `series` powers the daily-clicks sparkline; `estConversionRate` (5%) drives
  the disclaimer copy on `AffiliateStats`.

## Social ecosystem

`artifacts/glamr` has been extended into a TikTok-style social platform.

- **Auth**: `@clerk/react` (v6) wraps the whole app in `main.tsx`. Clerk publishable
  key comes from `VITE_CLERK_PUBLISHABLE_KEY`. The API uses `@clerk/express`
  middleware (`artifacts/api-server/src/app.ts`) plus a Clerk frontend-API
  proxy. `requireAuth` / `optionalAuth` middlewares populate `req.userId`
  (augmented in `src/types/express.d.ts`).
- **Mandatory profile**: every signed-in user must create a `@handle` profile
  before accessing the feed/upload/messages. `AuthedRoute` redirects to
  `/sign-in` (no session) or `/onboarding` (no profile row).
- **DB**: profiles, posts, post_likes, post_comments, follows, conversations,
  messages, brands, products, look_products, affiliate_clicks. Schema in
  `lib/db/src/schema/{profiles,posts,messages,affiliate}.ts`.
- **API routes** live in `artifacts/api-server/src/routes/{profiles,posts,
  social,messages,brands,affiliate,storage}.ts`. Storage is the only group
  defined in OpenAPI; the social/DM/affiliate endpoints intentionally bypass
  codegen and are typed via the frontend `lib/api.ts` fetch wrapper.
- **Object storage**: app-storage bucket via `objectStorage.ts` +
  `lib/object-storage-web` `<ObjectUploader>` (Uppy-based). User uploads go
  through a presigned PUT (`POST /api/storage/uploads/request-url`) and are
  served back via `/api/storage/objects/...`.
- **Affiliate**: brands seeded on first boot (`lib/seedBrands.ts`).
  `AffiliateProductsForLook` widget renders on `LookDetail` and inside `TryOn`
  side-panel; clicks go through `GET /api/affiliate/click/:productId?creator=`
  which records the click and 302s to the brand URL. Creators see aggregated
  stats at `/affiliate`.
- **Catalogue**: `lib/looks.ts` adds a `season?: Season` field plus the
  `seasonalCapsule2026` set (Spring/Summer/Fall/Winter/All-Year). Helpers:
  `SEASONS`, `seasonByLookId`, `getLookSeason`, `ALL_LOOKS_FLAT`.
- **Pages**: SignIn, SignUp, ProfileSetup, Feed, Upload, Messages,
  MessageThread, Brands, UserProfile, AffiliateStats. `TopNav` is the shared
  shell.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
