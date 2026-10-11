import { describe, expect, it, vi } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { USER_ID_COLUMNS, remapUserIds } from "@workspace/db/remap";
import { setObjectAclPolicy } from "../src/lib/objectAcl";
import { api, createUser, useServer } from "./helpers";
import { newObjectPath, putFakeObject } from "./fakeStorage";

vi.mock("../src/lib/objectStorage", () => import("./fakeStorage"));

useServer();

describe("USER_ID_COLUMNS", () => {
  it("lists every column that looks like it stores a user id", async () => {
    const res = await db.execute<{ table_name: string; column_name: string }>(sql`
      SELECT table_name, column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND data_type IN ('character varying', 'text')
        AND column_name ~ '(^|_)(user|author|sender|instructor|creator|viewer|recipient|actor|owner|follower|followee|blocker|blocked|reporter|resolved_by|updated_by|user_a|user_b)'
    `);
    const listed = new Set(USER_ID_COLUMNS.map(([t, c]) => `${t}.${c}`));
    const missing = res.rows.map((r) => `${r.table_name}.${r.column_name}`).filter((c) => !listed.has(c));
    expect(missing).toEqual([]);
  });
});

describe("remapUserIds", () => {
  it("moves every reference to the new ids and keeps the app working", async () => {
    // "z" prefix so the old ids sort after the new "a" ids and conversation
    // pairs must be re-ordered.
    const oldA = await createUser("user_zzold");
    const oldB = await createUser("user_zzold");
    const image = putFakeObject(newObjectPath());
    await setObjectAclPolicy(image, { owner: oldA, visibility: "public" });
    const post = await api("POST", "/posts", { user: oldA, body: { kind: "result", imageUrl: image } });
    await api("POST", `/posts/${post.body.id}/like`, { user: oldB });
    await api("POST", `/posts/${post.body.id}/comments`, { user: oldB, body: { body: "hi" } });
    await api("POST", `/follows/${oldA}`, { user: oldB });
    await api("POST", `/conversations/${oldA}/messages`, { user: oldB, body: { body: "hey" } });
    await api("POST", "/reports", { user: oldB, body: { targetType: "user", targetId: oldA, reason: "spam" } });
    await api("PUT", "/me/consents/face_data", { user: oldA, body: { version: "1" } });

    // newA sorts after newB, so the stored (user_a, user_b) pair must flip.
    const newA = `user_aanew${Date.now()}b`;
    const newB = `user_aanew${Date.now()}a`;
    const result = await remapUserIds(db, { [oldA]: newA, [oldB]: newB });
    expect(result.mapped).toBe(2);

    // No old id survives in any text column.
    const cols = await db.execute<{ table_name: string; column_name: string }>(sql`
      SELECT table_name, column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND data_type IN ('character varying', 'text')
    `);
    const leftovers: string[] = [];
    for (const { table_name, column_name } of cols.rows) {
      const found = await db.execute(sql`SELECT 1 FROM ${sql.identifier(table_name)} WHERE ${sql.identifier(column_name)} IN (${oldA}, ${oldB}) LIMIT 1`);
      if (found.rows.length) leftovers.push(`${table_name}.${column_name}`);
    }
    expect(leftovers).toEqual([]);

    // The app still works under the new ids: profile, ownership, the DM thread.
    expect((await api("GET", "/me", { user: newA })).body.userId).toBe(newA);
    const thread = await api("GET", `/conversations/${newA}/messages`, { user: newB });
    expect(thread.body.messages.map((m: { body: string }) => m.body)).toEqual(["hey"]);
    expect((await api("DELETE", `/posts/${post.body.id}`, { user: newA })).status).toBe(204);
  });

  it("ignores empty and identity mappings", async () => {
    expect((await remapUserIds(db, {})).mapped).toBe(0);
    expect((await remapUserIds(db, { user_x: "user_x" })).mapped).toBe(0);
  });
});
