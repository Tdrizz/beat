# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

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
