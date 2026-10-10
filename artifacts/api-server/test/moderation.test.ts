import { describe, expect, it, vi } from "vitest";
import { and, eq } from "drizzle-orm";
import { clerkClient } from "@clerk/express";
import { db, followsTable, notificationsTable, profilesTable, reportsTable } from "@workspace/db";
import { setObjectAclPolicy } from "../src/lib/objectAcl";
import { notify } from "../src/lib/notify";
import { api, createUser, useServer } from "./helpers";
import { newObjectPath, putFakeObject } from "./fakeStorage";

vi.mock("../src/lib/objectStorage", () => import("./fakeStorage"));

useServer();

async function post(user: string) {
  const image = putFakeObject(newObjectPath());
  await setObjectAclPolicy(image, { owner: user, visibility: "public" });
  const res = await api("POST", "/posts", { user, body: { kind: "result", imageUrl: image, caption: `by ${user}` } });
  expect(res.status).toBe(201);
  return res.body.id as string;
}

async function handleOf(userId: string) {
  const [row] = await db.select().from(profilesTable).where(eq(profilesTable.userId, userId));
  return row.handle;
}

describe("blocking", () => {
  it("hides content both ways and stops follows, DMs and notifications", async () => {
    const a = await createUser();
    const b = await createUser();
    await api("POST", `/follows/${b}`, { user: a });
    await api("POST", `/follows/${a}`, { user: b });
    const bPost = await post(b);
    const aPost = await post(a);
    await api("POST", `/conversations/${b}/messages`, { user: a, body: { body: "hey" } });

    expect((await api("POST", `/blocks/${b}`, { user: a })).status).toBe(204);

    // Follows removed both directions, and can't be re-created by either side.
    const follows = await db.select().from(followsTable).where(and(eq(followsTable.followerId, b), eq(followsTable.followeeId, a)));
    expect(follows).toHaveLength(0);
    expect((await api("POST", `/follows/${a}`, { user: b })).status).toBe(403);
    expect((await api("POST", `/follows/${b}`, { user: a })).status).toBe(403);

    // Feed and post detail hide the other side's posts, for both users.
    const feedA = await api("GET", "/feed?scope=foryou&limit=100", { user: a });
    expect(feedA.body.posts.map((p: { id: string }) => p.id)).not.toContain(bPost);
    const feedB = await api("GET", "/feed?scope=foryou&limit=100", { user: b });
    expect(feedB.body.posts.map((p: { id: string }) => p.id)).not.toContain(aPost);
    expect((await api("GET", `/posts/${bPost}`, { user: a })).status).toBe(404);
    expect((await api("GET", `/posts/${aPost}`, { user: b })).status).toBe(404);

    // No likes / comments across the block.
    expect((await api("POST", `/posts/${aPost}/like`, { user: b })).status).toBe(404);
    expect((await api("POST", `/posts/${aPost}/comments`, { user: b, body: { body: "hi" } })).status).toBe(404);

    // DMs closed both ways; the blocker is told it's their block.
    const thread = await api("GET", `/conversations/${b}/messages`, { user: a });
    expect(thread.status).toBe(403);
    expect(thread.body.blockedByMe).toBe(true);
    expect((await api("POST", `/conversations/${a}/messages`, { user: b, body: { body: "?" } })).status).toBe(403);
    const convs = await api("GET", "/conversations", { user: a });
    expect(convs.body).toHaveLength(0);

    // Profiles: blocked user can't see the blocker; blocker sees a flag.
    expect((await api("GET", `/profiles/${await handleOf(a)}`, { user: b })).status).toBe(404);
    const bProfile = await api("GET", `/profiles/${await handleOf(b)}`, { user: a });
    expect(bProfile.status).toBe(200);
    expect(bProfile.body.blockedByMe).toBe(true);
    expect((await api("GET", `/profiles/${await handleOf(b)}/posts`, { user: a })).body).toEqual([]);

    // Listed in the blocker's settings.
    const blocks = await api("GET", "/blocks", { user: a });
    expect(blocks.body.blocks.map((x: { userId: string }) => x.userId)).toEqual([b]);

    // Unblocking restores visibility.
    expect((await api("DELETE", `/blocks/${b}`, { user: a })).status).toBe(204);
    expect((await api("GET", `/posts/${bPost}`, { user: a })).status).toBe(200);
  });

  it("filters comments and notifications from blocked users", async () => {
    const a = await createUser();
    const b = await createUser();
    const c = await createUser();
    const aPost = await post(a);
    await api("POST", `/posts/${aPost}/comments`, { user: b, body: { body: "from b" } });
    await api("POST", `/posts/${aPost}/comments`, { user: c, body: { body: "from c" } });
    await api("POST", `/blocks/${b}`, { user: a });
    const comments = await api("GET", `/posts/${aPost}/comments`, { user: a });
    expect(comments.body.map((x: { body: string }) => x.body)).toEqual(["from c"]);
    const notes = await api("GET", "/notifications", { user: a });
    expect(notes.body.every((n: { actorId: string }) => n.actorId !== b)).toBe(true);
    // And no new notifications are written while blocked.
    const before = await db.select().from(notificationsTable).where(eq(notificationsTable.recipientId, a));
    await notify({ recipientId: a, actorId: b, kind: "follow" });
    const after = await db.select().from(notificationsTable).where(eq(notificationsTable.recipientId, a));
    expect(after.length).toBe(before.length);
  });

  it("rejects blocking yourself or unknown users", async () => {
    const a = await createUser();
    expect((await api("POST", `/blocks/${a}`, { user: a })).status).toBe(400);
    expect((await api("POST", "/blocks/user_nobody", { user: a })).status).toBe(404);
  });
});

describe("reporting", () => {
  it("reports each kind of target once, with a snapshot", async () => {
    const reporter = await createUser();
    const author = await createUser();
    const postId = await post(author);
    const comment = await api("POST", `/posts/${postId}/comments`, { user: author, body: { body: "mean comment" } });
    const msg = await api("POST", `/conversations/${reporter}/messages`, { user: author, body: { body: "rude dm" } });

    for (const [targetType, targetId] of [
      ["post", postId],
      ["comment", comment.body.id],
      ["message", msg.body.id],
      ["user", author],
    ]) {
      const res = await api("POST", "/reports", { user: reporter, body: { targetType, targetId, reason: "harassment" } });
      expect(res.status, targetType).toBe(201);
    }
    // Duplicate is a no-op.
    await api("POST", "/reports", { user: reporter, body: { targetType: "post", targetId: postId, reason: "spam" } });
    const rows = await db.select().from(reportsTable).where(eq(reportsTable.reporterId, reporter));
    expect(rows).toHaveLength(4);
    expect(rows.find((r) => r.targetType === "message")?.snapshot).toMatchObject({ body: "rude dm" });
    expect(rows.every((r) => r.targetUserId === author)).toBe(true);
  });

  it("rejects self-reports, missing targets, and DMs you weren't part of", async () => {
    const a = await createUser();
    const b = await createUser();
    const outsider = await createUser();
    const own = await post(a);
    expect((await api("POST", "/reports", { user: a, body: { targetType: "post", targetId: own, reason: "spam" } })).status).toBe(400);
    expect((await api("POST", "/reports", { user: a, body: { targetType: "post", targetId: "00000000-0000-0000-0000-000000000000", reason: "spam" } })).status).toBe(404);
    const msg = await api("POST", `/conversations/${b}/messages`, { user: a, body: { body: "private" } });
    expect((await api("POST", "/reports", { user: outsider, body: { targetType: "message", targetId: msg.body.id, reason: "spam" } })).status).toBe(404);
    expect((await api("POST", "/reports", { user: a, body: { targetType: "post", targetId: own, reason: "not-a-reason" } })).status).toBe(400);
  });
});

describe("admin queue", () => {
  it("is admin-only", async () => {
    const user = await createUser();
    expect((await api("GET", "/admin/reports", { user })).status).toBe(403);
    expect((await api("GET", "/admin/me", { user })).body.isAdmin).toBe(false);
    expect((await api("GET", "/admin/me", { user: "user_admin" })).body.isAdmin).toBe(true);
  });

  it("removes reported content and closes every report about it", async () => {
    const author = await createUser();
    const r1 = await createUser();
    const r2 = await createUser();
    const postId = await post(author);
    await api("POST", "/reports", { user: r1, body: { targetType: "post", targetId: postId, reason: "nudity" } });
    await api("POST", "/reports", { user: r2, body: { targetType: "post", targetId: postId, reason: "nudity" } });

    const queue = await api("GET", "/admin/reports", { user: "user_admin" });
    const mine = queue.body.reports.filter((r: { targetId: string }) => r.targetId === postId);
    expect(mine).toHaveLength(2);
    expect(mine[0].openReportsAgainstUser).toBe(2);
    expect(mine[0].targetUser.stripeCustomerId).toBeUndefined();

    const res = await api("POST", `/admin/reports/${mine[0].id}/resolve`, { user: "user_admin", body: { action: "remove_content", note: "nudity" } });
    expect(res.status).toBe(200);
    expect((await api("GET", `/posts/${postId}`, { user: r1 })).status).toBe(404);
    const rows = await db.select().from(reportsTable).where(eq(reportsTable.targetId, postId));
    expect(rows.every((r) => r.status === "actioned" && r.resolvedBy === "user_admin")).toBe(true);
  });

  it("bans users through Clerk and can dismiss", async () => {
    const offender = await createUser();
    const reporter = await createUser();
    await api("POST", "/reports", { user: reporter, body: { targetType: "user", targetId: offender, reason: "impersonation" } });
    const [report] = await db.select().from(reportsTable).where(eq(reportsTable.targetUserId, offender));
    const banUser = vi.mocked(clerkClient.users).banUser;
    const res = await api("POST", `/admin/reports/${report.id}/resolve`, { user: "user_admin", body: { action: "ban_user" } });
    expect(res.status).toBe(200);
    expect(banUser).toHaveBeenCalledWith(offender);

    const other = await createUser();
    await api("POST", "/reports", { user: reporter, body: { targetType: "user", targetId: other, reason: "spam" } });
    const [r2] = await db.select().from(reportsTable).where(eq(reportsTable.targetUserId, other));
    await api("POST", `/admin/reports/${r2.id}/resolve`, { user: "user_admin", body: { action: "dismiss" } });
    const [after] = await db.select().from(reportsTable).where(eq(reportsTable.id, r2.id));
    expect(after.status).toBe("dismissed");
  });
});
