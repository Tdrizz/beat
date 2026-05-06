import type { Request, Response, NextFunction } from "express";

// Simple in-memory token-bucket rate limiter keyed by Clerk userId (falls back
// to IP for unauthenticated requests). Good enough for one server instance —
// would need Redis for horizontal scale, but this is the right shape.
interface Bucket {
  tokens: number;
  resetAt: number;
}
const buckets = new Map<string, Bucket>();

// Periodic cleanup so the map doesn't grow unbounded. Runs every 5 minutes.
setInterval(() => {
  const now = Date.now();
  for (const [k, b] of buckets.entries()) {
    if (b.resetAt < now) buckets.delete(k);
  }
}, 5 * 60 * 1000).unref();

export interface RateLimitOpts {
  /** Bucket name — usually the route family, e.g. "like" */
  scope: string;
  /** Max requests allowed per windowMs */
  max: number;
  /** Window length in ms */
  windowMs: number;
}

export function rateLimit({ scope, max, windowMs }: RateLimitOpts) {
  return (req: Request, res: Response, next: NextFunction) => {
    const id = req.userId ?? req.ip ?? "anon";
    const key = `${scope}:${id}`;
    const now = Date.now();
    const existing = buckets.get(key);
    if (!existing || existing.resetAt < now) {
      buckets.set(key, { tokens: max - 1, resetAt: now + windowMs });
      next();
      return;
    }
    if (existing.tokens <= 0) {
      const retryAfter = Math.ceil((existing.resetAt - now) / 1000);
      res.setHeader("Retry-After", String(retryAfter));
      res.status(429).json({ error: "Too many requests, slow down a sec." });
      return;
    }
    existing.tokens -= 1;
    next();
  };
}
