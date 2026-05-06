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
