import { getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = getAuth(req);
  const userId = (auth?.sessionClaims?.userId as string | undefined) ?? auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.userId = userId;
  next();
}

// Same as requireAuth but doesn't 401 — sets req.userId if signed in, otherwise leaves undefined.
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const auth = getAuth(req);
  const userId = (auth?.sessionClaims?.userId as string | undefined) ?? auth?.userId;
  if (userId) req.userId = userId;
  next();
}
