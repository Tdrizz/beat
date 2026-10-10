import { pgTable, text, timestamp, varchar, jsonb, index } from "drizzle-orm/pg-core";

// Access policy for uploaded objects, keyed by the canonical entity path
// (e.g. "/objects/uploads/<uuid>"). Written once by
// POST /storage/uploads/finalize (or server-side when publishing a copy) and
// read by the ACL gate on GET /storage/objects/*. An object with no row is
// unreadable and is removed by the abandoned-upload cleanup.
export const objectAclsTable = pgTable(
  "object_acls",
  {
    objectPath: text("object_path").primaryKey(),
    ownerId: text("owner_id").notNull(),
    visibility: varchar("visibility", { length: 8 }).$type<"public" | "private">().notNull(),
    aclRules: jsonb("acl_rules"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    byOwner: index("object_acls_owner_idx").on(t.ownerId),
  }),
);

export type ObjectAclRow = typeof objectAclsTable.$inferSelect;
