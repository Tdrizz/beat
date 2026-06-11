---
name: Presigned upload verification
description: Why curator/upload routes must re-verify real object metadata instead of trusting client-claimed type/size.
---

# Presigned uploads enforce nothing — verify the real object server-side

When a route hands out a presigned upload URL (`POST /api/storage/uploads/request-url`)
and later accepts the resulting `objectPath` to attach somewhere (e.g. tutorial step
clips), the size/contentType the client sent at request-url time is **advisory only**.
The client can PUT anything to the presigned URL — different type, larger size, or
nothing at all.

**Rule:** On the write-back route, fetch the stored object's real GCS metadata
(`objectStorageService.getObjectEntityFile(path)` → `file.getMetadata()`) and validate
`contentType` prefix + `size` against your limits before persisting the reference.
Also enforce the `/objects/` prefix on any URL you'll later render (a public page
rendering an arbitrary/`javascript:` URL is an injection vector).

**Why:** Caught during the tutorial step-video uploader. The first instinct was to
constrain uploads via an OpenAPI `kind` field; that's unenforceable. Architect's
correction: trust only the actual object metadata at the point you write the reference.

**How to apply:** Any new "user uploads a file, then we save its path" flow in this
repo. Reference impl: `verifyUploadedObject()` in
`artifacts/api-server/src/routes/tutorials.ts`.

Related: `GET /api/storage/objects/*` has no ACL guard yet (placeholder in
`storage.ts`); curator clips are explicitly marked public so they render on the public
tutorial page. Don't store private uploads there until that guard is enabled.
