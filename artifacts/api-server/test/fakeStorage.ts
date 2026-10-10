// In-memory stand-in for src/lib/objectStorage.ts so route tests don't need
// Supabase. ACL policies still go through the real object_acls table.
// Usage in a test file:
//   vi.mock("../src/lib/objectStorage", () => import("./fakeStorage"));
import { randomUUID } from "node:crypto";
import {
  ObjectPermission,
  canAccessObject,
  deleteObjectAclPolicy,
  setObjectAclPolicy,
  type ObjectAclPolicy,
} from "../src/lib/objectAcl";

export interface FakeMeta {
  contentType: string;
  size: number;
}

export const fakeObjects = new Map<string, FakeMeta>();

/** Seed an object at an entity path like "/objects/uploads/<id>". */
export function putFakeObject(path: string, meta: FakeMeta = { contentType: "image/png", size: 100 }): string {
  fakeObjects.set(path, meta);
  return path;
}

export function newObjectPath(): string {
  return `/objects/uploads/${randomUUID()}`;
}

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

export class StoredObject {
  constructor(readonly bucket: string, readonly key: string, readonly entityPath: string | null) {}

  async getMetadata() {
    const meta = fakeObjects.get(this.entityPath ?? this.key);
    if (!meta) throw new ObjectNotFoundError();
    return { ...meta, createdAt: new Date() };
  }

  async delete() {
    fakeObjects.delete(this.entityPath ?? this.key);
    if (this.entityPath) await deleteObjectAclPolicy(this.entityPath);
  }
}

export class ObjectStorageService {
  async searchPublicObject(filePath: string) {
    return fakeObjects.has(filePath) ? new StoredObject("public", filePath, null) : null;
  }

  async downloadObject(_file: StoredObject) {
    return new Response("fake", { headers: { "Content-Type": "image/png" } });
  }

  async getObjectEntityUploadURL() {
    const objectPath = newObjectPath();
    return { uploadURL: `https://storage.test/upload${objectPath}`, objectPath };
  }

  async getObjectEntityFile(objectPath: string) {
    if (!objectPath.startsWith("/objects/") || !fakeObjects.has(objectPath)) {
      throw new ObjectNotFoundError();
    }
    return new StoredObject("private", objectPath.slice("/objects/".length), objectPath);
  }

  async trySetObjectEntityAclPolicy(rawPath: string, policy: ObjectAclPolicy) {
    if (!rawPath.startsWith("/")) return rawPath;
    await this.getObjectEntityFile(rawPath);
    await setObjectAclPolicy(rawPath, policy);
    return rawPath;
  }

  async canAccessObjectEntity({ userId, objectFile, requestedPermission }: {
    userId?: string;
    objectFile: StoredObject;
    requestedPermission?: ObjectPermission;
  }) {
    if (!objectFile.entityPath) return false;
    return canAccessObject({
      userId,
      objectPath: objectFile.entityPath,
      requestedPermission: requestedPermission ?? ObjectPermission.READ,
    });
  }

  async copyObjectEntityToPublic(sourcePath: string, owner: string) {
    const meta = fakeObjects.get(sourcePath);
    if (!meta) throw new ObjectNotFoundError();
    const dest = `/objects/shared/${randomUUID()}`;
    fakeObjects.set(dest, { ...meta });
    await setObjectAclPolicy(dest, { owner, visibility: "public" });
    return dest;
  }

  async cleanupAbandonedUploads() {
    return 0;
  }
}
