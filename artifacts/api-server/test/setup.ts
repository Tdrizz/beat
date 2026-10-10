import { vi } from "vitest";
import type { Request, Response, NextFunction } from "express";

// Replace Clerk with a header-driven stub: `x-test-user: user_x` signs the
// request in as user_x. clerkClient calls are spies tests can inspect.
vi.mock("@clerk/express", () => {
  const userId = (req: Request) => {
    const v = req.headers["x-test-user"];
    return typeof v === "string" && v ? v : null;
  };
  return {
    clerkMiddleware: () => (_req: Request, _res: Response, next: NextFunction) => next(),
    getAuth: (req: Request) => ({ userId: userId(req), sessionClaims: null }),
    clerkClient: {
      users: {
        getUserList: vi.fn(async () => ({ data: [], totalCount: 0 })),
        deleteUser: vi.fn(async () => ({})),
        banUser: vi.fn(async () => ({})),
      },
    },
  };
});
