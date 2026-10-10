import { describe, expect, it } from "vitest";
import { api, createUser, useServer } from "./helpers";

useServer();

describe("harness", () => {
  it("serves the health check", async () => {
    const res = await api("GET", "/healthz");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("signs requests in via x-test-user", async () => {
    const userId = await createUser();
    expect((await api("GET", "/me")).status).toBe(401);
    const me = await api("GET", "/me", { user: userId });
    expect(me.status).toBe(200);
    expect(me.body.userId).toBe(userId);
  });

  it("guards cron endpoints with CRON_SECRET", async () => {
    expect((await api("POST", "/digest/run")).status).toBe(401);
    expect((await api("POST", "/storage/uploads/cleanup", { headers: { "x-cron-secret": "nope" } })).status).toBe(401);
  });
});
