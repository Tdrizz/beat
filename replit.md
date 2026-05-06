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

## AI

- Gemini AI integration (Replit-managed, no key required) is the **only** try-on
  mechanism in `artifacts/glamr`. Endpoint: `POST /api/ai-tryon`. Frontend:
  `useCamera` (live preview) + `useAITryOn` hook + `AITryOnModal`. Model:
  `gemini-2.5-flash-image` (nano banana).
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
