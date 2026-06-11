import { getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";

// Curators are an explicit, fail-closed allowlist of Clerk user IDs supplied
// via the CURATOR_USER_IDS env var (comma-separated). Unset / empty => nobody
// is a curator. This is the "admin-only at first" gate for editing globally
// curated tutorial content (e.g. attaching a step demo clip). It is
// deliberately NOT the same as profiles.isCreator, which only marks
// affiliate-eligible users and would let every creator overwrite shared
// content.
function curatorIdSet(): ReadonlySet<string> {
  const raw = process.env.CURATOR_USER_IDS ?? "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0),
  );
}

export function isCurator(userId: string | undefined | null): boolean {
  if (!userId) return false;
  return curatorIdSet().has(userId);
}

// 401 if not signed in, 403 if signed in but not on the curator allowlist.
export function requireCurator(req: Request, res: Response, next: NextFunction) {
  const auth = getAuth(req);
  const userId = (auth?.sessionClaims?.userId as string | undefined) ?? auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (!isCurator(userId)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  req.userId = userId;
  next();
}
