import { Router, type IRouter, type Request, type Response } from "express";
import { Readable } from "stream";
import {
  RequestUploadUrlBody,
  RequestUploadUrlResponse,
} from "@workspace/api-zod";
import { ObjectStorageService, ObjectNotFoundError } from "../lib/objectStorage";
import { ObjectPermission, getObjectAclPolicy } from "../lib/objectAcl";
import { requireAuth, optionalAuth } from "../middlewares/requireAuth";
import { timingSafeEqual } from "node:crypto";

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();

function cronSecretOk(provided: string | undefined): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Called by an external daily scheduler with the x-cron-secret header. Never
// run this as an in-process timer: the API may sleep between requests.
router.post("/storage/uploads/cleanup", async (req: Request, res: Response) => {
  if (!cronSecretOk(req.get("x-cron-secret"))) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const deleted = await objectStorageService.cleanupAbandonedUploads();
    res.json({ deleted });
  } catch (error) {
    req.log.error({ err: error }, "Error cleaning abandoned uploads");
    res.status(500).json({ error: "Failed to clean abandoned uploads" });
  }
});

/**
 * POST /storage/uploads/request-url
 *
 * Request a presigned URL for file upload.
 * The client sends JSON metadata (name, size, contentType) — NOT the file.
 * Then uploads the file directly to the returned presigned URL.
 */
router.post("/storage/uploads/request-url", requireAuth, async (req: Request, res: Response) => {
  const parsed = RequestUploadUrlBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Missing or invalid required fields" });
    return;
  }

  try {
    const { name, size, contentType } = parsed.data;

    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);

    res.json(
      RequestUploadUrlResponse.parse({
        uploadURL,
        objectPath,
        metadata: { name, size, contentType },
      }),
    );
  } catch (error) {
    req.log.error({ err: error }, "Error generating upload URL");
    res.status(500).json({ error: "Failed to generate upload URL" });
  }
});

/**
 * POST /storage/uploads/finalize
 *
 * Apply an ACL policy to a freshly-uploaded object. Must be called by the
 * uploader after the direct PUT to the presigned URL completes, otherwise
 * the object will have no policy and be unreadable through
 * `GET /storage/objects/*`.
 *
 * - `objectPath` must be a canonical entity path (`/objects/<id>`) as
 *   returned by `/storage/uploads/request-url`.
 * - `visibility: "public"` makes the object readable by anyone (used for
 *   public feed images).
 * - `visibility: "private"` (default) restricts reads to the uploader.
 *
 * To prevent another signed-in user from hijacking an object whose path
 * they happen to learn, finalize is single-shot: once a policy exists,
 * subsequent calls are rejected.
 */
router.post("/storage/uploads/finalize", requireAuth, async (req: Request, res: Response) => {
  const body = req.body as { objectPath?: unknown; visibility?: unknown };
  const objectPath = typeof body.objectPath === "string" ? body.objectPath : "";
  const visibility = body.visibility === "public" ? "public" : "private";
  if (!objectPath.startsWith("/objects/")) {
    res.status(400).json({ error: "Invalid objectPath" });
    return;
  }
  try {
    const objectFile = await objectStorageService.getObjectEntityFile(objectPath);
    const existing = await getObjectAclPolicy(objectFile);
    if (existing) {
      // Already finalized — only the owner is allowed to no-op confirm.
      if (existing.owner !== req.userId) {
        res.status(403).json({ error: "Object already finalized" });
        return;
      }
      res.json({ objectPath, visibility: existing.visibility });
      return;
    }
    await objectStorageService.trySetObjectEntityAclPolicy(objectPath, {
      owner: req.userId!,
      visibility,
    });
    res.json({ objectPath, visibility });
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      res.status(404).json({ error: "Object not found" });
      return;
    }
    req.log.error({ err: error }, "Error finalizing object");
    res.status(500).json({ error: "Failed to finalize object" });
  }
});

/**
 * GET /storage/public-objects/*
 *
 * Serve public assets from PUBLIC_OBJECT_SEARCH_PATHS.
 * These are unconditionally public — no authentication or ACL checks.
 * IMPORTANT: Always provide this endpoint when object storage is set up.
 */
router.get("/storage/public-objects/*filePath", async (req: Request, res: Response) => {
  try {
    const raw = req.params.filePath;
    const filePath = Array.isArray(raw) ? raw.join("/") : raw;
    const file = await objectStorageService.searchPublicObject(filePath);
    if (!file) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    const response = await objectStorageService.downloadObject(file);

    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));

    if (response.body) {
      const nodeStream = Readable.fromWeb(response.body as ReadableStream<Uint8Array>);
      nodeStream.pipe(res);
    } else {
      res.end();
    }
  } catch (error) {
    req.log.error({ err: error }, "Error serving public object");
    res.status(500).json({ error: "Failed to serve public object" });
  }
});

/**
 * GET /storage/objects/*
 *
 * Serve object entities from PRIVATE_OBJECT_DIR, gated by the ACL policy
 * stored on the object (set via `/storage/uploads/finalize`).
 *
 * - Objects with `visibility: "public"` are readable by anyone.
 * - All other objects require the caller's Clerk userId to match the ACL
 *   owner (or one of the ACL rule groups).
 * - Objects with no ACL policy at all are treated as private and return
 *   401/403 — uploaders MUST call `/storage/uploads/finalize` after
 *   their PUT, otherwise their file is unreadable.
 */
router.get("/storage/objects/*path", optionalAuth, async (req: Request, res: Response) => {
  try {
    const raw = req.params.path;
    const wildcardPath = Array.isArray(raw) ? raw.join("/") : raw;
    const objectPath = `/objects/${wildcardPath}`;
    const objectFile = await objectStorageService.getObjectEntityFile(objectPath);

    const canAccess = await objectStorageService.canAccessObjectEntity({
      userId: req.userId,
      objectFile,
      requestedPermission: ObjectPermission.READ,
    });
    if (!canAccess) {
      res.status(req.userId ? 403 : 401).json({
        error: req.userId ? "Forbidden" : "Unauthorized",
      });
      return;
    }

    const response = await objectStorageService.downloadObject(objectFile);

    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));

    if (response.body) {
      const nodeStream = Readable.fromWeb(response.body as ReadableStream<Uint8Array>);
      nodeStream.pipe(res);
    } else {
      res.end();
    }
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      req.log.warn({ err: error }, "Object not found");
      res.status(404).json({ error: "Object not found" });
      return;
    }
    req.log.error({ err: error }, "Error serving object");
    res.status(500).json({ error: "Failed to serve object" });
  }
});

export default router;
