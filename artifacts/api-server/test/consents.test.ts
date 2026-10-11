import { describe, expect, it, vi } from "vitest";
import { db, wigTryonsTable } from "@workspace/db";
import { setObjectAclPolicy } from "../src/lib/objectAcl";
import { api, createUser, useServer } from "./helpers";
import { fakeObjects, newObjectPath, putFakeObject } from "./fakeStorage";

vi.mock("../src/lib/objectStorage", () => import("./fakeStorage"));

useServer();

describe("face data consent", () => {
  it("records, reads back and withdraws consent", async () => {
    const user = await createUser();
    expect((await api("GET", "/me/consents", { user })).body.consents).toEqual({});
    expect((await api("PUT", "/me/consents/face_data", { user, body: { version: "1" } })).status).toBe(204);
    const granted = await api("GET", "/me/consents", { user });
    expect(granted.body.consents.face_data.version).toBe("1");
    expect((await api("DELETE", "/me/consents/face_data", { user })).status).toBe(204);
    expect((await api("GET", "/me/consents", { user })).body.consents).toEqual({});
    // Granting again (e.g. a new policy version) reactivates it.
    await api("PUT", "/me/consents/face_data", { user, body: { version: "2" } });
    expect((await api("GET", "/me/consents", { user })).body.consents.face_data.version).toBe("2");
  });

  it("rejects unknown kinds and requires auth", async () => {
    const user = await createUser();
    expect((await api("PUT", "/me/consents/marketing", { user, body: { version: "1" } })).status).toBe(400);
    expect((await api("GET", "/me/consents")).status).toBe(401);
  });
});

describe("wig try-on retention", () => {
  it("deleting a saved render deletes the photo file too", async () => {
    const user = await createUser();
    const imagePath = putFakeObject(newObjectPath());
    await setObjectAclPolicy(imagePath, { owner: user, visibility: "private" });
    const [row] = await db
      .insert(wigTryonsTable)
      .values({ userId: user, wigId: "w", wigName: "Wig", colorId: "c", colorName: "Black", imagePath })
      .returning();
    expect((await api("DELETE", `/wig-tryons/${row.id}`, { user })).status).toBe(204);
    expect(fakeObjects.has(imagePath)).toBe(false);
  });
});
