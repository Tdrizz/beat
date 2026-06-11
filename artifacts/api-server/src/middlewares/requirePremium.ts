import type { Request, Response, NextFunction } from "express";
import { isUserPremium } from "../lib/premium";

// Requires the caller to be signed in AND have an active Premium
// subscription (`profiles.premium_until > now()`). Mount AFTER `requireAuth`.
// Used by the host-class endpoint and any future premium-only mutations.
export async function requirePremium(req: Request, res: Response, next: NextFunction) {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const ok = await isUserPremium(userId);
    if (!ok) {
      res.status(402).json({ error: "Premium required", code: "PREMIUM_REQUIRED" });
      return;
    }
    next();
  } catch (err) {
    req.log?.error?.({ err }, "requirePremium check failed");
    res.status(500).json({ error: "Could not verify premium status" });
  }
}
