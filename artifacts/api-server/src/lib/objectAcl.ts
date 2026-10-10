import { db, objectAclsTable } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";

// ACL policies live in the `object_acls` table, keyed by canonical entity
// path ("/objects/<id>"). Supabase Storage can't update metadata on an
// object after a client-side upload, and a table lets account deletion and
// cleanup find objects by owner/status with one query.

// Can be flexibly defined according to the use case.
//
// Examples:
// - USER_LIST: the users from a list stored in the database;
// - EMAIL_DOMAIN: the users whose email is in a specific domain;
// - GROUP_MEMBER: the users who are members of a specific group;
// - SUBSCRIBER: the users who are subscribers of a specific service / content
//   creator.
export enum ObjectAccessGroupType {}

export interface ObjectAccessGroup {
  type: ObjectAccessGroupType;
  // The logic id that identifies qualified group members. Format depends on the
  // ObjectAccessGroupType — e.g. a user-list DB id, an email domain, a group id.
  id: string;
}

export enum ObjectPermission {
  READ = "read",
  WRITE = "write",
}

export interface ObjectAclRule {
  group: ObjectAccessGroup;
  permission: ObjectPermission;
}

export interface ObjectAclPolicy {
  owner: string;
  visibility: "public" | "private";
  aclRules?: Array<ObjectAclRule>;
}

function isPermissionAllowed(
  requested: ObjectPermission,
  granted: ObjectPermission,
): boolean {
  if (requested === ObjectPermission.READ) {
    return [ObjectPermission.READ, ObjectPermission.WRITE].includes(granted);
  }
  return granted === ObjectPermission.WRITE;
}

abstract class BaseObjectAccessGroup implements ObjectAccessGroup {
  constructor(
    public readonly type: ObjectAccessGroupType,
    public readonly id: string,
  ) {}

  public abstract hasMember(userId: string): Promise<boolean>;
}

function createObjectAccessGroup(
  group: ObjectAccessGroup,
): BaseObjectAccessGroup {
  switch (group.type) {
    // Implement per access group type, e.g.:
    // case "USER_LIST":
    //   return new UserListAccessGroup(group.id);
    default:
      throw new Error(`Unknown access group type: ${group.type}`);
  }
}

function toRow(objectPath: string, aclPolicy: ObjectAclPolicy) {
  return {
    objectPath,
    ownerId: aclPolicy.owner,
    visibility: aclPolicy.visibility,
    aclRules: aclPolicy.aclRules ?? null,
  };
}

/** Set (or overwrite) the policy for an object. */
export async function setObjectAclPolicy(
  objectPath: string,
  aclPolicy: ObjectAclPolicy,
): Promise<void> {
  const row = toRow(objectPath, aclPolicy);
  await db
    .insert(objectAclsTable)
    .values(row)
    .onConflictDoUpdate({
      target: objectAclsTable.objectPath,
      set: { ownerId: row.ownerId, visibility: row.visibility, aclRules: row.aclRules },
    });
}

/**
 * Set the policy only if the object has none yet. Returns the policy now in
 * effect and whether this call created it. Atomic, so two concurrent
 * finalize calls can't both claim the same object.
 */
export async function claimObjectAclPolicy(
  objectPath: string,
  aclPolicy: ObjectAclPolicy,
): Promise<{ created: boolean; policy: ObjectAclPolicy }> {
  const inserted = await db
    .insert(objectAclsTable)
    .values(toRow(objectPath, aclPolicy))
    .onConflictDoNothing({ target: objectAclsTable.objectPath })
    .returning({ objectPath: objectAclsTable.objectPath });
  if (inserted.length > 0) {
    return { created: true, policy: aclPolicy };
  }
  const existing = await getObjectAclPolicy(objectPath);
  if (!existing) {
    // Deleted between the insert and the read; treat as a fresh claim.
    return claimObjectAclPolicy(objectPath, aclPolicy);
  }
  return { created: false, policy: existing };
}

export async function getObjectAclPolicy(
  objectPath: string,
): Promise<ObjectAclPolicy | null> {
  const [row] = await db
    .select()
    .from(objectAclsTable)
    .where(eq(objectAclsTable.objectPath, objectPath))
    .limit(1);
  if (!row) {
    return null;
  }
  return {
    owner: row.ownerId,
    visibility: row.visibility,
    ...(row.aclRules ? { aclRules: row.aclRules as Array<ObjectAclRule> } : {}),
  };
}

/** Returns the subset of `objectPaths` that have a policy. */
export async function findObjectPathsWithPolicy(
  objectPaths: string[],
): Promise<Set<string>> {
  if (objectPaths.length === 0) return new Set();
  const rows = await db
    .select({ objectPath: objectAclsTable.objectPath })
    .from(objectAclsTable)
    .where(inArray(objectAclsTable.objectPath, objectPaths));
  return new Set(rows.map((r) => r.objectPath));
}

export async function deleteObjectAclPolicy(objectPath: string): Promise<void> {
  await db.delete(objectAclsTable).where(eq(objectAclsTable.objectPath, objectPath));
}

export async function canAccessObject({
  userId,
  objectPath,
  requestedPermission,
}: {
  userId?: string;
  objectPath: string;
  requestedPermission: ObjectPermission;
}): Promise<boolean> {
  const aclPolicy = await getObjectAclPolicy(objectPath);
  if (!aclPolicy) {
    return false;
  }

  if (
    aclPolicy.visibility === "public" &&
    requestedPermission === ObjectPermission.READ
  ) {
    return true;
  }

  if (!userId) {
    return false;
  }

  if (aclPolicy.owner === userId) {
    return true;
  }

  for (const rule of aclPolicy.aclRules || []) {
    const accessGroup = createObjectAccessGroup(rule.group);
    if (
      (await accessGroup.hasMember(userId)) &&
      isPermissionAllowed(requestedPermission, rule.permission)
    ) {
      return true;
    }
  }

  return false;
}
