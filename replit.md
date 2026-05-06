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
- **API Routes**: `artifacts/api-server/src/routes/{profiles,posts,social,messages,brands,affiliate,storage}.ts`
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

## Pointers

- [pnpm-workspace skill](https://www.replit.com/talk/pnpm-workspace-skill) for workspace structure and TypeScript setup.
- Clerk documentation for authentication: `@clerk/react`, `@clerk/express`.
- Drizzle ORM documentation.
- Zod documentation for validation.
- Orval documentation for API codegen.
- Uppy documentation for `<ObjectUploader>`.