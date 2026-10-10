import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import {
  ObjectAclPolicy,
  ObjectPermission,
  canAccessObject,
  deleteObjectAclPolicy,
  findObjectPathsWithPolicy,
  getObjectAclPolicy,
  setObjectAclPolicy,
} from "./objectAcl";

// Object storage on Supabase Storage.
//
// Uploaded entities live in the private bucket (STORAGE_BUCKET_PRIVATE)
// under `uploads/<uuid>` (direct client uploads) and `shared/<uuid>`
// (server-made public copies). Their canonical path, which is what the DB
// stores and the frontend requests via /api/storage, is `/objects/<key>`.
// The bucket stays private even for "public" objects: every read goes
// through the ACL gate in routes/storage.ts.
//
// STORAGE_BUCKET_PUBLIC holds unconditionally public assets served by
// GET /storage/public-objects/*.

function requireEnv(
  name: "SUPABASE_URL" | "SUPABASE_SERVICE_ROLE_KEY" | "STORAGE_BUCKET_PRIVATE" | "STORAGE_BUCKET_PUBLIC",
): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} must be set to use object storage`);
  }
  return value;
}

let client: SupabaseClient | null = null;

function storageClient(): SupabaseClient {
  if (!client) {
    client = createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

// Supabase reports a missing object as 400 or 404 depending on the endpoint.
function isNotFound(error: unknown): boolean {
  const status =
    (error as { status?: number; statusCode?: string | number } | null)?.status ??
    Number((error as { statusCode?: string | number } | null)?.statusCode);
  return status === 400 || status === 404;
}

export interface ObjectMetadata {
  contentType: string;
  size: number;
  createdAt: Date | null;
}

/** A handle to one stored object. */
export class StoredObject {
  constructor(
    readonly bucket: string,
    readonly key: string,
    /** Canonical "/objects/<key>" path for entities; null for public assets. */
    readonly entityPath: string | null,
  ) {}

  async getMetadata(): Promise<ObjectMetadata> {
    const { data, error } = await storageClient().storage.from(this.bucket).info(this.key);
    if (error) {
      if (isNotFound(error)) throw new ObjectNotFoundError();
      throw error;
    }
    return {
      contentType: data.contentType || "application/octet-stream",
      size: Number(data.size ?? 0),
      createdAt: data.createdAt ? new Date(data.createdAt) : null,
    };
  }

  async delete(): Promise<void> {
    const { error } = await storageClient().storage.from(this.bucket).remove([this.key]);
    if (error && !isNotFound(error)) throw error;
    if (this.entityPath) {
      await deleteObjectAclPolicy(this.entityPath);
    }
  }
}

// Reject keys that could escape their prefix or address a folder.
function isSafeKey(key: string): boolean {
  if (!key || key.startsWith("/") || key.endsWith("/")) return false;
  return key.split("/").every((seg) => seg !== "" && seg !== "." && seg !== "..");
}

export class ObjectStorageService {
  constructor() {}

  private privateBucket(): string {
    return requireEnv("STORAGE_BUCKET_PRIVATE");
  }

  async searchPublicObject(filePath: string): Promise<StoredObject | null> {
    if (!isSafeKey(filePath)) return null;
    const bucket = requireEnv("STORAGE_BUCKET_PUBLIC");
    const { data, error } = await storageClient().storage.from(bucket).exists(filePath);
    if (error && !isNotFound(error)) throw error;
    return data ? new StoredObject(bucket, filePath, null) : null;
  }

  /**
   * Stream an object back as a fetch Response. Uses the authenticated REST
   * endpoint directly because supabase-js `download()` buffers the whole
   * file in memory.
   */
  async downloadObject(file: StoredObject, cacheTtlSec: number = 3600): Promise<Response> {
    const isPublic = file.entityPath
      ? (await getObjectAclPolicy(file.entityPath))?.visibility === "public"
      : true;

    const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    const encodedKey = file.key.split("/").map(encodeURIComponent).join("/");
    const upstream = await fetch(
      `${requireEnv("SUPABASE_URL").replace(/\/+$/, "")}/storage/v1/object/authenticated/${encodeURIComponent(file.bucket)}/${encodedKey}`,
      {
        headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey },
        signal: AbortSignal.timeout(30_000),
      },
    );
    if (upstream.status === 400 || upstream.status === 404) {
      await upstream.body?.cancel();
      throw new ObjectNotFoundError();
    }
    if (!upstream.ok) {
      await upstream.body?.cancel();
      throw new Error(`Object download failed (${upstream.status})`);
    }

    const headers: Record<string, string> = {
      "Content-Type": upstream.headers.get("content-type") || "application/octet-stream",
      "Cache-Control": `${isPublic ? "public" : "private"}, max-age=${cacheTtlSec}`,
    };
    const length = upstream.headers.get("content-length");
    if (length) {
      headers["Content-Length"] = length;
    }

    return new Response(upstream.body, { headers });
  }

  /**
   * Create a presigned upload target for a new entity. The client PUTs the
   * raw file (with a Content-Type header) to `uploadURL`, then calls
   * /storage/uploads/finalize with `objectPath`.
   */
  async getObjectEntityUploadURL(): Promise<{ uploadURL: string; objectPath: string }> {
    const key = `uploads/${randomUUID()}`;
    const { data, error } = await storageClient()
      .storage.from(this.privateBucket())
      .createSignedUploadUrl(key);
    if (error) throw error;
    return { uploadURL: data.signedUrl, objectPath: `/objects/${key}` };
  }

  async getObjectEntityFile(objectPath: string): Promise<StoredObject> {
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }
    const key = objectPath.slice("/objects/".length);
    if (!isSafeKey(key)) {
      throw new ObjectNotFoundError();
    }
    const bucket = this.privateBucket();
    const { data, error } = await storageClient().storage.from(bucket).exists(key);
    if (error && !isNotFound(error)) throw error;
    if (!data) {
      throw new ObjectNotFoundError();
    }
    return new StoredObject(bucket, key, objectPath);
  }

  /**
   * Overwrite the ACL policy of an existing entity. Paths that aren't
   * rooted ("/...") are returned unchanged (external URLs).
   */
  async trySetObjectEntityAclPolicy(
    rawPath: string,
    aclPolicy: ObjectAclPolicy
  ): Promise<string> {
    if (!rawPath.startsWith("/")) {
      return rawPath;
    }

    await this.getObjectEntityFile(rawPath);
    await setObjectAclPolicy(rawPath, aclPolicy);
    return rawPath;
  }

  async canAccessObjectEntity({
    userId,
    objectFile,
    requestedPermission,
  }: {
    userId?: string;
    objectFile: StoredObject;
    requestedPermission?: ObjectPermission;
  }): Promise<boolean> {
    if (!objectFile.entityPath) return false;
    return canAccessObject({
      userId,
      objectPath: objectFile.entityPath,
      requestedPermission: requestedPermission ?? ObjectPermission.READ,
    });
  }

  /**
   * Publish a private entity by copying it to a separately named object and
   * applying a public ACL policy. The source remains private and unchanged.
   */
  async copyObjectEntityToPublic(sourcePath: string, owner: string): Promise<string> {
    const source = await this.getObjectEntityFile(sourcePath);
    const destinationKey = `shared/${randomUUID()}`;
    const { error } = await storageClient()
      .storage.from(source.bucket)
      .copy(source.key, destinationKey);
    if (error) throw error;
    const destinationPath = `/objects/${destinationKey}`;
    await setObjectAclPolicy(destinationPath, { owner, visibility: "public" });
    return destinationPath;
  }

  /**
   * Remove upload objects which were never finalized with an ACL policy.
   * Presigned uploads land only under uploads/, so finalized shared/public
   * objects are not candidates for this cleanup.
   */
  async cleanupAbandonedUploads(olderThanMs = 24 * 60 * 60 * 1000): Promise<number> {
    const bucket = storageClient().storage.from(this.privateBucket());
    const cutoff = Date.now() - olderThanMs;
    const pageSize = 1000;
    const candidates: string[] = [];
    for (let offset = 0; ; offset += pageSize) {
      const { data, error } = await bucket.list("uploads", {
        limit: pageSize,
        offset,
        sortBy: { column: "created_at", order: "asc" },
      });
      if (error) throw error;
      for (const item of data) {
        if (!item.id) continue; // folder placeholder
        const createdAt = Date.parse(item.created_at ?? "");
        if (!Number.isFinite(createdAt) || createdAt > cutoff) continue;
        candidates.push(`uploads/${item.name}`);
      }
      if (data.length < pageSize) break;
    }

    let deleted = 0;
    for (let i = 0; i < candidates.length; i += 100) {
      const chunk = candidates.slice(i, i + 100);
      const finalized = await findObjectPathsWithPolicy(chunk.map((key) => `/objects/${key}`));
      const abandoned = chunk.filter((key) => !finalized.has(`/objects/${key}`));
      if (abandoned.length === 0) continue;
      const { error } = await bucket.remove(abandoned);
      if (error) throw error;
      deleted += abandoned.length;
    }
    return deleted;
  }
}
