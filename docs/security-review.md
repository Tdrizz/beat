# Security review (pre-launch)

Scope: every API route in `artifacts/api-server/src/routes`, auth and ownership checks, `publicProfile` redaction, upload validation, and AI spend. Fixes are covered by `artifacts/api-server/test/security.test.ts`.

## Fixed

| Severity | Issue | Fix |
| --- | --- | --- |
| **Critical** | `POST /profiles` and `PUT /profiles/me` accepted `stripeCustomerId` and `isCreator`, plus `premiumUntil` as `null`. A user could bind another user's Stripe customer to their profile. That opened the victim's billing portal to them. And because the webhook resolves customer → profile, the victim's subscription payments could grant Premium to the attacker. | Those fields are removed from `insertProfileSchema`. Only Stripe and server code set them. |
| High | Public `GET /tutorials/submitted` and `GET /tutorials/:id/reviews` embedded full author profiles, including `stripeCustomerId` and `premiumUntil`. | Both use `publicProfileOrNull`; the test fails without the fix. |
| High | `POST /posts` accepted any string as `imageUrl`. A post could reference another user's upload, and deleting that post deleted their file. | Post images must be the author's own upload, finalized public, `image/*`, ≤ 15 MB. Post delete removes the file only if the post's author owns it. |
| High | Class `videoUrl` and `coverUrl` accepted `javascript:` URLs. They're rendered as a link and a CSS background, which is stored XSS for every viewer. | Only http(s) is accepted. Tutorial thumbnails are restricted to uploaded paths or http(s). |
| Medium | A curator attaching a step clip could re-own any object by path (`trySetObjectEntityAclPolicy` overwrote the ACL). | Curators may attach only objects they uploaded. |
| Medium | No global cap on paid AI calls. Per-user limits don't stop many accounts. | Global daily caps in the `ai_usage_daily` table, enforced atomically by `lib/aiBudget.ts`. `AI_DAILY_TRYON_CAP` defaults to 2000, `AI_DAILY_CHAT_CAP` to 5000. Over the cap, the endpoint returns 503. |
| Low | DMs could be sent to yourself or to arbitrary `user_*` ids with no profile. | The recipient must have a profile and must not be the sender. |
| Low | Affiliate click attribution stored unvalidated `creator`/`post` query params. A non-uuid `post` caused a 500. | Malformed values are stored as null. The referrer is truncated. |
| Low | Malformed ids (for example `/posts/abc`) returned 500 with the default HTML error page. | A JSON error handler returns 400 for invalid ids and never leaks stack traces. A CORS rejection now returns 403, not 500. |
| Bug | **Commenting was broken.** `insertCommentSchema` required `postId` in the body, but the app sends only `{ body }`, so every comment got a 400. Comments on non-existent posts were also accepted. | `postId` is taken from the URL, and missing posts return 404. |
| Bug | `GET /profiles/me` (used by Social links settings and the profile page) fell through to the `:handle` route and returned 404. | Explicit route. |

Two unused dependencies were removed: `google-auth-library` (left over from the Replit GCS client) and `cookie-parser`.

## Verified OK

- **Auth:** every mutating route requires auth (`requireAuth`, `requireCurator`, or the `CRON_SECRET` guard), except intentionally public ones: the Stripe webhook (signature-verified, fails closed) and digest unsubscribe/resubscribe (unguessable token, rate-limited).
- **Ownership checks are present for:**
  - deleting posts and comments (comment author or post author)
  - tutorial drafts (author, editable only in draft/rejected)
  - moderation (`ADMIN_USER_IDS`)
  - wig try-ons (owner)
  - combos (owner)
  - DM image fetch (conversation participant)
  - storage finalize (single-shot, owner-bound, atomic)
  - Stripe portal (own customer)
- **`publicProfile`:** after the tutorials fix above, used in every response that returns profiles to other users: feed, comments, notifications, conversations, profile pages, classes, tutorials, reviews, `/me`. The social list endpoints (`/profiles/featured`, `/profiles/search`, `/profiles/me/friends`) select an explicit column list that excludes billing fields.
- **Uploads:** objects are unreadable until finalized. Routes re-check real content-type and size from storage before using an object (posts, DM images, tutorial clips). Supabase bucket limits (15 MB, `image/*`, `video/*`) add a second guard (`docs/DEPLOYMENT.md`).
- **Premium:** `POST /classes` requires Premium server-side, as does reserving premium classes.
- **Rate limits:** per-user token buckets on writes and AI routes, plus a global 300 req/min per IP. They're in memory and per instance; see `docs/DEPLOYMENT.md` for where Redis plugs in.

## Open (product decisions, not fixed here)

- **Find by email:** `GET /profiles/search?q=<email>` tells a signed-in user whether an email has an account (via Clerk). It's useful for "find friends", but it's an enumeration vector. Options: keep it, rate-limit harder, or require an exact match plus mutual opt-in.
- **Curator clips are private:** `PUT /tutorials/:id/steps/:stepIndex/video` marks them private to the uploading curator, and `GET /tutorials/:id/step-videos` returns only the caller's own. So other users never see curator clips, although `docs/ARCHITECTURE.md` says curated clips should be public. Confirm the intended behavior before launch.
- **Untrusted images:** user-supplied http(s) image URLs (tutorial thumbnails, class covers) still load third-party content and can expose viewers' IPs to that host. Consider requiring uploads for these too.
