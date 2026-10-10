import type { Request, Response, NextFunction } from "express";
import { sql } from "drizzle-orm";
import { db } from "@workspace/db";

// Global daily spending guard for paid AI endpoints. Per-user rate limits
// stop one account from running up the bill; this caps the total across
// all users so a bot farm or a viral day can't. Caps are per UTC day.
//
// AI_DAILY_TRYON_CAP / AI_DAILY_CHAT_CAP override the defaults; 0 blocks
// the endpoint entirely.
export type AiKind = "tryon" | "chat";

const DEFAULT_CAPS: Record<AiKind, number> = { tryon: 2000, chat: 5000 };

export function dailyCap(kind: AiKind): number {
  const raw = process.env[kind === "tryon" ? "AI_DAILY_TRYON_CAP" : "AI_DAILY_CHAT_CAP"];
  const parsed = raw === undefined || raw.trim() === "" ? NaN : Number(raw);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : DEFAULT_CAPS[kind];
}

/**
 * Atomically count one call against today's budget. Returns false (and
 * records nothing) once the cap is reached.
 */
export async function reserveAiCall(kind: AiKind): Promise<boolean> {
  const cap = dailyCap(kind);
  if (cap === 0) return false;
  const result = await db.execute(sql`
    INSERT INTO ai_usage_daily (day, kind, count)
    VALUES ((now() AT TIME ZONE 'utc')::date, ${kind}, 1)
    ON CONFLICT (day, kind) DO UPDATE
      SET count = ai_usage_daily.count + 1
      WHERE ai_usage_daily.count < ${cap}
    RETURNING count
  `);
  return result.rows.length > 0;
}

/** Express middleware: 503 once today's global budget for `kind` is spent. */
export function aiBudget(kind: AiKind) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (await reserveAiCall(kind)) {
        next();
        return;
      }
      req.log?.warn?.({ kind, cap: dailyCap(kind) }, "Daily AI budget exhausted");
      res.status(503).json({
        error: "This feature is very popular today. Please try again tomorrow.",
        code: "AI_BUDGET_EXHAUSTED",
      });
    } catch (err) {
      next(err);
    }
  };
}
