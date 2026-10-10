---
name: Scheduled work & transactional email
description: How to run periodic/background jobs and send email in this project, and the non-obvious constraints behind those choices.
---

# Scheduled / periodic work

Do NOT use `setInterval` / in-process timers for periodic jobs that must fire on a wall-clock schedule (digests, cleanups, reminders).

**Why:** the API server deploys to **autoscale**, which sleeps (scales to zero) between requests. An in-process timer simply never fires while the instance is asleep, so the job silently never runs in production.

**How to apply:** expose a **secret-guarded HTTP endpoint** (constant-time compare against an internally-generated `CRON_SECRET`, deny when the secret is unset) and drive it from a **Replit scheduled deployment** that POSTs to it on the desired cadence. Make the job **idempotent**: claim a per-(entity, period) row with `insert … onConflictDoNothing … returning` BEFORE doing the side effect, skip if the claim returns nothing, and release the claim (delete it) if the side effect fails so a later run can retry. This survives cron retries / overlapping triggers without double-acting.

# Transactional email (Resend)

We use the Replit-managed **Resend** connector. The API key is read from the connector credential proxy at call time and we POST directly to `https://api.resend.com/emails` (no SDK dependency needed).

**Why this caveat matters:** Resend will only deliver to the **account owner's own email** until a **custom sending domain is verified** in the Resend dashboard. The default `from` is `onboarding@resend.dev`. So a freshly-connected Resend will appear "broken" (recipients get nothing) for any address other than the owner's — that is expected, not a bug. Tell the user to verify a domain (and optionally set `DIGEST_FROM_EMAIL`) before expecting delivery to real users.
