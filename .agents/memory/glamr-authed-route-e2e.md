---
name: Glamr AuthedRoute e2e testing limitation
description: Why runTest can't verify authed pages in the Glamr app, and how to verify them instead.
---

# AuthedRoute blocks e2e UI verification in the test harness

Every authed page in the Glamr web app is wrapped in `AuthedRoute`, which gates on
both a Clerk session AND an existing Beat profile (it fires a `["me"]` query and
`Redirect`s to `/sign-in` or `/onboarding` otherwise). Under `runTest({ testClerkAuth: true })`,
navigation into these pages (`/u/:handle`, `/feed`, `/friends`, `/settings/social`,
`/try-on/:lookId`, etc.) intermittently bounces back to the home shell: the harness's
programmatic Clerk session doesn't reliably survive route changes / re-hydration, so
`AuthedRoute` sees "no profile" and redirects (onboarding then bounces an existing-profile
user to `/`). Both hard `page.goto` and soft in-app `Link` clicks were tried — both fail.

**Why:** discovered while verifying saved combos (Task: save makeup+wig combos). The
combo data flow was provably working (POST `/api/profiles/me/combos` saved, GET returned
it, both 200), but the `MyCombos` UI on `/u/:handle` could never be reached to assert on.

**How to apply:** Don't burn cycles trying to make `runTest` render authed Glamr pages.
Verify the data layer with authed API calls + `curl` (401 anon), confirm route ordering,
and code-review the React components for UI correctness. Treat a `runTest` "failure/unable"
whose only symptom is "redirected to home / page never rendered" on an authed route as a
harness limitation, not a feature defect — confirm via the API + logs first.
