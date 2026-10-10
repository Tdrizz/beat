import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { afterAll, beforeAll } from "vitest";
import { db, pool, profilesTable } from "@workspace/db";
import app from "../src/app";

let server: Server;
let baseUrl = "";

/** Start the app on an ephemeral port for the current test file. */
export function useServer(): void {
  beforeAll(async () => {
    server = app.listen(0);
    await new Promise<void>((resolve) => server.once("listening", () => resolve()));
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });
  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await pool.end();
  });
}

export interface ApiResponse<T = any> {
  status: number;
  body: T;
}

/** Call the API as `user` (a Clerk user id) or anonymously. */
export async function api<T = any>(
  method: string,
  path: string,
  opts: { user?: string; body?: unknown; headers?: Record<string, string> } = {},
): Promise<ApiResponse<T>> {
  const res = await fetch(`${baseUrl}/api${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(opts.user ? { "x-test-user": opts.user } : {}),
      ...(opts.headers ?? {}),
    },
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    redirect: "manual",
  });
  const text = await res.text();
  let body: unknown = text;
  try {
    body = text ? JSON.parse(text) : undefined;
  } catch {
    // non-JSON body
  }
  return { status: res.status, body: body as T };
}

let seq = 0;
/** Insert a profile and return its user id. */
export async function createUser(prefix = "user"): Promise<string> {
  seq += 1;
  const userId = `${prefix}_${Date.now().toString(36)}${seq}`;
  await db.insert(profilesTable).values({
    userId,
    handle: `h${Date.now().toString(36)}${seq}`.slice(0, 32),
    displayName: `Test ${seq}`,
  });
  return userId;
}
