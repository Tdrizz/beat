import { beforeEach, describe, expect, it, vi } from "vitest";
import { eq, or, sql } from "drizzle-orm";
import { clerkClient } from "@clerk/express";
import {
  db,
  chatThreadsTable,
  classesTable,
  conversationsTable,
  followsTable,
  likesTable,
  messagesTable,
  objectAclsTable,
  postsTable,
  profilesTable,
  reportsTable,
  savedCombosTable,
  userBlocksTable,
  wigTryonsTable,
} from "@workspace/db";
import { setObjectAclPolicy } from "../src/lib/objectAcl";
import { api, createUser, useServer } from "./helpers";
import { fakeObjects, newObjectPath, putFakeObject } from "./fakeStorage";

vi.mock("../src/lib/objectStorage", () => import("./fakeStorage"));

const stripe = { customers: { del: vi.fn(async (_id: string) => ({ deleted: true })) } };
vi.mock("../src/lib/stripeClient", () => ({
  getStripeClient: () => stripe,
  getStripePublishableKey: () => "pk_test",
}));

useServer();

beforeEach(() => {
  stripe.customers.del.mockReset();
  stripe.customers.del.mockResolvedValue({ deleted: true });
});

async function upload(owner: string) {
  const path = putFakeObject(newObjectPath());
  await setObjectAclPolicy(path, { owner, visibility: "public" });
  return path;
}

async function populate(user: string, other: string) {
  const myImage = await upload(user);
  const myPost = await api("POST", "/posts", { user, body: { kind: "result", imageUrl: myImage } });
  const otherImage = await upload(other);
  const otherPost = await api("POST", "/posts", { user: other, body: { kind: "result", imageUrl: otherImage } });
  await api("POST", `/posts/${otherPost.body.id}/like`, { user });
  await api("POST", `/posts/${otherPost.body.id}/comments`, { user, body: { body: "nice" } });
  await api("POST", `/posts/${myPost.body.id}/comments`, { user: other, body: { body: "cute" } });
  await api("POST", `/follows/${other}`, { user });
  await api("POST", `/follows/${user}`, { user: other });
  const dmImage = putFakeObject(newObjectPath());
  await setObjectAclPolicy(dmImage, { owner: other, visibility: "private" });
  await api("POST", `/conversations/${user}/messages`, { user: other, body: { body: "hi", imageUrl: dmImage } });
  await api("POST", `/conversations/${other}/messages`, { user, body: { body: "hey" } });
  await api("PUT", "/me/consents/face_data", { user, body: { version: "1" } });
  await db.insert(savedCombosTable).values({ userId: user, lookId: "l", wigStyleId: "none" });
  await db.insert(wigTryonsTable).values({ userId: user, wigId: "w", wigName: "Wig", colorId: "c", colorName: "Black", imagePath: await upload(user) });
  await db.insert(chatThreadsTable).values({ userId: user } as never);
  await db.insert(classesTable).values({ instructorId: user, title: "Class", scheduledFor: new Date() });
  await db.insert(userBlocksTable).values({ blockerId: user, blockedId: (await createUser()) });
  return { myImage, otherImage, dmImage, otherPostId: otherPost.body.id as string };
}

describe("DELETE /me", () => {
  it("requires an explicit confirmation", async () => {
    const user = await createUser();
    expect((await api("DELETE", "/me", { user })).status).toBe(400);
    expect((await api("DELETE", "/me", { user, body: { confirm: "yes" } })).status).toBe(400);
  });

  it("deletes the user's data, files, Stripe customer and Clerk user, and nobody else's", async () => {
    const user = await createUser();
    const other = await createUser();
    await db.update(profilesTable).set({ stripeCustomerId: "cus_123" }).where(eq(profilesTable.userId, user));
    const seeded = await populate(user, other);

    const res = await api("DELETE", "/me", { user, body: { confirm: "DELETE" } });
    expect(res.status).toBe(204);

    expect(stripe.customers.del).toHaveBeenCalledWith("cus_123");
    expect(vi.mocked(clerkClient.users).deleteUser).toHaveBeenCalledWith(user);

    // Every table is clean of the user.
    expect(await db.select().from(profilesTable).where(eq(profilesTable.userId, user))).toHaveLength(0);
    expect(await db.select().from(postsTable).where(eq(postsTable.authorId, user))).toHaveLength(0);
    expect(await db.select().from(likesTable).where(eq(likesTable.userId, user))).toHaveLength(0);
    expect(await db.select().from(followsTable).where(or(eq(followsTable.followerId, user), eq(followsTable.followeeId, user)))).toHaveLength(0);
    expect(await db.select().from(conversationsTable).where(or(eq(conversationsTable.userA, user), eq(conversationsTable.userB, user)))).toHaveLength(0);
    expect(await db.select().from(messagesTable).where(eq(messagesTable.senderId, user))).toHaveLength(0);
    expect(await db.select().from(savedCombosTable).where(eq(savedCombosTable.userId, user))).toHaveLength(0);
    expect(await db.select().from(wigTryonsTable).where(eq(wigTryonsTable.userId, user))).toHaveLength(0);
    expect(await db.select().from(chatThreadsTable).where(eq(chatThreadsTable.userId, user))).toHaveLength(0);
    expect(await db.select().from(classesTable).where(eq(classesTable.instructorId, user))).toHaveLength(0);
    expect(await db.select().from(userBlocksTable).where(eq(userBlocksTable.blockerId, user))).toHaveLength(0);
    expect(await db.select().from(objectAclsTable).where(eq(objectAclsTable.ownerId, user))).toHaveLength(0);

    // Their files and the DM thread's attachments are gone; others' files stay.
    expect(fakeObjects.has(seeded.myImage)).toBe(false);
    expect(fakeObjects.has(seeded.dmImage)).toBe(false);
    expect(fakeObjects.has(seeded.otherImage)).toBe(true);

    // The other user's post survives with corrected counters.
    const [otherPost] = await db.select().from(postsTable).where(eq(postsTable.id, seeded.otherPostId));
    expect(otherPost.likeCount).toBe(0);
    expect(otherPost.commentCount).toBe(0);
    expect((await api("GET", "/me", { user: other })).status).toBe(200);

    // Guard for future tables: no text column anywhere still holds the id,
    // except reports.target_user_id (kept, with content wiped, as a record).
    const columns = await db.execute<{ table_name: string; column_name: string }>(sql`
      SELECT table_name, column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND data_type IN ('character varying', 'text')
    `);
    const leftovers: string[] = [];
    for (const { table_name, column_name } of columns.rows) {
      if (table_name === "reports" && column_name === "target_user_id") continue;
      const found = await db.execute(sql`SELECT 1 FROM ${sql.identifier(table_name)} WHERE ${sql.identifier(column_name)} = ${user} LIMIT 1`);
      if (found.rows.length) leftovers.push(`${table_name}.${column_name}`);
    }
    expect(leftovers).toEqual([]);
  });

  it("aborts without deleting anything if Stripe can't cancel billing", async () => {
    const user = await createUser();
    await db.update(profilesTable).set({ stripeCustomerId: "cus_fail" }).where(eq(profilesTable.userId, user));
    stripe.customers.del.mockRejectedValue(Object.assign(new Error("Stripe down"), { statusCode: 500 }));
    const res = await api("DELETE", "/me", { user, body: { confirm: "DELETE" } });
    expect(res.status).toBe(500);
    expect(await db.select().from(profilesTable).where(eq(profilesTable.userId, user))).toHaveLength(1);
  });

  it("treats an already-deleted Stripe customer as done, and is safe to retry", async () => {
    const user = await createUser();
    await db.update(profilesTable).set({ stripeCustomerId: "cus_gone" }).where(eq(profilesTable.userId, user));
    stripe.customers.del.mockRejectedValue(Object.assign(new Error("No such customer"), { code: "resource_missing" }));
    expect((await api("DELETE", "/me", { user, body: { confirm: "DELETE" } })).status).toBe(204);
    // Second call (e.g. after a Clerk failure) still succeeds.
    expect((await api("DELETE", "/me", { user, body: { confirm: "DELETE" } })).status).toBe(204);
  });

  it("closes reports about the user and wipes their snapshot", async () => {
    const user = await createUser();
    const reporter = await createUser();
    await api("POST", "/reports", { user: reporter, body: { targetType: "user", targetId: user, reason: "spam" } });
    await api("DELETE", "/me", { user, body: { confirm: "DELETE" } });
    const [report] = await db.select().from(reportsTable).where(eq(reportsTable.targetUserId, user));
    expect(report.status).toBe("actioned");
    expect(report.snapshot).toEqual({});
  });
});
