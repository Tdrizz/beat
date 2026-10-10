import { afterEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import {
  aiUsageDailyTable,
  affiliateClicksTable,
  brandsTable,
  db,
  postsTable,
  productsTable,
  profilesTable,
} from "@workspace/db";
import { setObjectAclPolicy } from "../src/lib/objectAcl";
import { reserveAiCall } from "../src/lib/aiBudget";
import { TUTORIAL_CATEGORIES, TUTORIAL_DIFFICULTIES, TUTORIAL_IDS } from "@workspace/db";
import { api, createUser, useServer } from "./helpers";
import { fakeObjects, newObjectPath, putFakeObject } from "./fakeStorage";

vi.mock("../src/lib/objectStorage", () => import("./fakeStorage"));

useServer();

async function uploaded(owner: string, visibility: "public" | "private", contentType = "image/png") {
  const path = putFakeObject(newObjectPath(), { contentType, size: 1000 });
  await setObjectAclPolicy(path, { owner, visibility });
  return path;
}

describe("profile privileged fields", () => {
  it("ignores stripeCustomerId / isCreator / premiumUntil on update", async () => {
    const user = await createUser();
    const res = await api("PUT", "/profiles/me", {
      user,
      body: { bio: "hi", stripeCustomerId: "cus_victim", isCreator: true, premiumUntil: null },
    });
    expect(res.status).toBe(200);
    const [row] = await db.select().from(profilesTable).where(eq(profilesTable.userId, user));
    expect(row.bio).toBe("hi");
    expect(row.stripeCustomerId).toBeNull();
    expect(row.isCreator).toBe(false);
  });

  it("ignores them on create too", async () => {
    const user = `user_new${Date.now()}`;
    const res = await api("POST", "/profiles", {
      user,
      body: { handle: `new${Date.now()}`, displayName: "New", stripeCustomerId: "cus_x", isCreator: true },
    });
    expect(res.status).toBe(201);
    const [row] = await db.select().from(profilesTable).where(eq(profilesTable.userId, user));
    expect(row.stripeCustomerId).toBeNull();
    expect(row.isCreator).toBe(false);
  });

  it("serves GET /profiles/me", async () => {
    const user = await createUser();
    const res = await api("GET", "/profiles/me", { user });
    expect(res.status).toBe(200);
    expect(res.body.userId).toBe(user);
    expect(res.body.stripeCustomerId).toBeUndefined();
  });
});

describe("post images", () => {
  it("accepts the author's own public upload, in either path form", async () => {
    const user = await createUser();
    const a = await uploaded(user, "public");
    const b = await uploaded(user, "public");
    expect((await api("POST", "/posts", { user, body: { kind: "result", imageUrl: a } })).status).toBe(201);
    expect((await api("POST", "/posts", { user, body: { kind: "result", imageUrl: `/api/storage${b}` } })).status).toBe(201);
  });

  it("rejects someone else's object, private uploads, non-images and external URLs", async () => {
    const user = await createUser();
    const other = await createUser();
    const cases: Array<[string, number]> = [
      [await uploaded(other, "public"), 403],
      [await uploaded(user, "private"), 400],
      [await uploaded(user, "public", "video/mp4"), 400],
      ["https://evil.example/pixel.png", 400],
      [newObjectPath(), 400],
    ];
    for (const [imageUrl, status] of cases) {
      const res = await api("POST", "/posts", { user, body: { kind: "result", imageUrl } });
      expect(res.status, imageUrl).toBe(status);
    }
  });

  it("deleting a post never deletes an object the author doesn't own", async () => {
    const attacker = await createUser();
    const victim = await createUser();
    const victimImage = await uploaded(victim, "public");
    // Simulate a legacy row that points at someone else's file.
    const [post] = await db
      .insert(postsTable)
      .values({ authorId: attacker, kind: "result", imageUrl: victimImage })
      .returning();
    expect((await api("DELETE", `/posts/${post.id}`, { user: attacker })).status).toBe(204);
    expect(fakeObjects.has(victimImage)).toBe(true);
  });

  it("deleting a post removes the author's own file", async () => {
    const user = await createUser();
    const image = await uploaded(user, "public");
    const created = await api("POST", "/posts", { user, body: { kind: "result", imageUrl: image } });
    expect((await api("DELETE", `/posts/${created.body.id}`, { user })).status).toBe(204);
    expect(fakeObjects.has(image)).toBe(false);
  });
});

describe("comments and ids", () => {
  it("404s when commenting on a missing post and 400s on malformed ids", async () => {
    const user = await createUser();
    const missing = await api("POST", "/posts/00000000-0000-0000-0000-000000000000/comments", { user, body: { body: "hi" } });
    expect(missing.status).toBe(404);
    const malformed = await api("GET", "/posts/not-a-uuid", { user });
    expect(malformed.status).toBe(400);
  });
});

describe("direct messages", () => {
  it("refuses to message yourself or a user without a profile", async () => {
    const user = await createUser();
    expect((await api("POST", `/conversations/${user}/messages`, { user, body: { body: "hi" } })).status).toBe(404);
    expect((await api("POST", "/conversations/user_doesnotexist/messages", { user, body: { body: "hi" } })).status).toBe(404);
  });

  it("still delivers to real users by id or handle", async () => {
    const a = await createUser();
    const b = await createUser();
    const [bp] = await db.select().from(profilesTable).where(eq(profilesTable.userId, b));
    expect((await api("POST", `/conversations/${b}/messages`, { user: a, body: { body: "hi" } })).status).toBe(201);
    expect((await api("POST", `/conversations/${bp.handle}/messages`, { user: a, body: { body: "again" } })).status).toBe(201);
  });
});

describe("curator clips", () => {
  it("can't take over another user's object", async () => {
    const victim = await createUser();
    const clip = await uploaded(victim, "private", "video/mp4");
    const res = await api("PUT", `/tutorials/${TUTORIAL_IDS[0]}/steps/0/video`, {
      user: "user_curator",
      body: { videoUrl: clip },
    });
    expect(res.status).toBe(403);
  });
});

describe("class URLs", () => {
  it("rejects javascript: video and cover URLs", async () => {
    const host = await createUser();
    await db.update(profilesTable).set({ premiumUntil: new Date(Date.now() + 86_400_000) }).where(eq(profilesTable.userId, host));
    const base = {
      title: "Glow class",
      durationMin: 30,
      difficulty: "beginner",
      moodTag: "everyday",
      scheduledFor: new Date(Date.now() + 86_400_000).toISOString(),
    };
    const bad = await api("POST", "/classes", { user: host, body: { ...base, videoUrl: "javascript:alert(1)" } });
    expect(bad.status).toBe(400);
    const ok = await api("POST", "/classes", { user: host, body: { ...base, videoUrl: "https://video.example/x" } });
    expect(ok.status).toBe(201);
  });
});

describe("AI budget", () => {
  afterEach(() => {
    delete process.env.AI_DAILY_TRYON_CAP;
    delete process.env.AI_DAILY_CHAT_CAP;
  });

  it("stops counting at the daily cap", async () => {
    await db.delete(aiUsageDailyTable).where(eq(aiUsageDailyTable.kind, "chat"));
    process.env.AI_DAILY_CHAT_CAP = "2";
    expect(await reserveAiCall("chat")).toBe(true);
    expect(await reserveAiCall("chat")).toBe(true);
    expect(await reserveAiCall("chat")).toBe(false);
  });

  it("returns 503 from the try-on route when the budget is spent", async () => {
    process.env.AI_DAILY_TRYON_CAP = "0";
    const user = await createUser();
    const res = await api("POST", "/ai-tryon", { user, body: {} });
    expect(res.status).toBe(503);
    expect(res.body.code).toBe("AI_BUDGET_EXHAUSTED");
  });
});

describe("affiliate click attribution", () => {
  it("drops malformed creator/post params instead of failing", async () => {
    const brandId = `b${Date.now()}`;
    await db.insert(brandsTable).values({ id: brandId, name: "Brand" });
    const [product] = await db
      .insert(productsTable)
      .values({ brandId, name: "Lipstick", category: "lips", affiliateUrl: "https://shop.example/p" })
      .returning();
    const click = await api("GET", `/affiliate/click/${product.id}?creator=<script>&post=nope`);
    expect(click.status).toBe(302);
    const [row] = await db.select().from(affiliateClicksTable).where(eq(affiliateClicksTable.productId, product.id));
    expect(row.creatorId).toBeNull();
    expect(row.postId).toBeNull();
  });
});

describe("comments", () => {
  it("accepts the body the frontend sends ({ body } only)", async () => {
    const user = await createUser();
    const image = await uploaded(user, "public");
    const post = await api("POST", "/posts", { user, body: { kind: "result", imageUrl: image } });
    const res = await api("POST", `/posts/${post.body.id}/comments`, { user, body: { body: "love this" } });
    expect(res.status).toBe(201);
    expect(res.body.postId).toBe(post.body.id);
  });
});

describe("profile redaction", () => {
  it("never exposes billing fields on tutorial authors or reviewers", async () => {
    const author = await createUser();
    await db
      .update(profilesTable)
      .set({ stripeCustomerId: "cus_secret", premiumUntil: new Date(Date.now() + 86_400_000) })
      .where(eq(profilesTable.userId, author));
    const draft = await api("POST", "/tutorials/submitted", {
      user: author,
      body: {
        title: "Soft glam",
        category: TUTORIAL_CATEGORIES[0],
        difficulty: TUTORIAL_DIFFICULTIES[0],
        minutes: 10,
        thumbnail: "https://img.example/x.jpg",
        summary: "A soft everyday glam look",
        tools: ["brush"],
        steps: [{ title: "Prep", body: "Moisturise" }, { title: "Base", body: "Foundation" }],
      },
    });
    expect(draft.status).toBe(201);
    await api("POST", `/tutorials/submitted/${draft.body.id}/submit`, { user: author });
    await api("POST", `/tutorials/submitted/${draft.body.id}/moderate`, { user: "user_admin", body: { status: "published" } });
    await api("POST", `/tutorials/${draft.body.id}/reviews`, { user: author, body: { rating: 5 } });

    const list = await api("GET", "/tutorials/submitted");
    const reviews = await api("GET", `/tutorials/${draft.body.id}/reviews`);
    const text = JSON.stringify([list.body, reviews.body]);
    expect(text).toContain(author);
    expect(text).not.toContain("cus_secret");
    expect(text).not.toContain("premiumUntil");
    expect(text).not.toContain("stripeCustomerId");
  });
});
