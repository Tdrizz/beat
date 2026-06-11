import type { Request, Response } from "express";
import express from "express";
import Stripe from "stripe";
import { db, profilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getUncachableStripeClient } from "./stripeClient";
import { logger } from "./logger";

// Stripe webhooks must receive the *raw* request body so signature
// verification works. Express's global JSON parser would otherwise
// consume and parse the bytes first. Mount this router *before*
// `express.json()` in app.ts.
import { Router, type IRouter } from "express";
export const stripeWebhookRouter: IRouter = Router();

// Cached webhook secret. We can't reach it via the connector settings
// today (the development sandbox doesn't expose it), so we fall back to
// the STRIPE_WEBHOOK_SECRET env var if present.
function getWebhookSecret(): string | undefined {
  return process.env.STRIPE_WEBHOOK_SECRET;
}

async function setPremiumUntil(userId: string, until: Date | null): Promise<void> {
  const updated = await db
    .update(profilesTable)
    .set({ premiumUntil: until, updatedAt: new Date() })
    .where(eq(profilesTable.userId, userId))
    .returning({ id: profilesTable.userId });
  if (updated.length === 0) {
    logger.warn({ userId, until }, "Stripe webhook: profile not found for premium update");
  } else {
    logger.info({ userId, until }, "Stripe webhook: premium_until updated");
  }
}

async function userIdForCustomer(stripe: Stripe, customerId: string): Promise<string | null> {
  // Prefer our local mapping so we don't pay an API hit per webhook.
  const rows = await db
    .select({ userId: profilesTable.userId })
    .from(profilesTable)
    .where(eq(profilesTable.stripeCustomerId, customerId))
    .limit(1);
  if (rows.length > 0) return rows[0].userId;
  // Fallback: read metadata.userId off the Stripe customer.
  try {
    const cust = await stripe.customers.retrieve(customerId);
    if (!cust.deleted) {
      const id = (cust.metadata?.["userId"] as string | undefined) ?? null;
      return id;
    }
  } catch {
    // ignore
  }
  return null;
}

stripeWebhookRouter.post(
  "/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req: Request, res: Response) => {
    const sig = req.headers["stripe-signature"];
    const secret = getWebhookSecret();
    let event: Stripe.Event;
    // Fail closed: a webhook with no signing secret or no signature header
    // would otherwise let any unauthenticated caller flip `premium_until`
    // on arbitrary profiles. Only an explicit `STRIPE_WEBHOOK_DEV_INSECURE=1`
    // flag *outside* production is allowed to bypass verification.
    const devInsecure = process.env.STRIPE_WEBHOOK_DEV_INSECURE === "1"
      && process.env.NODE_ENV !== "production"
      && process.env.REPLIT_DEPLOYMENT !== "1";
    if (!secret || typeof sig !== "string") {
      if (!devInsecure) {
        logger.error("Stripe webhook rejected — STRIPE_WEBHOOK_SECRET or signature header missing");
        res.status(400).json({ error: "Webhook not configured" });
        return;
      }
      logger.warn("Stripe webhook signature bypass (STRIPE_WEBHOOK_DEV_INSECURE=1, dev only)");
    }

    try {
      const stripe = await getUncachableStripeClient();
      if (secret && typeof sig === "string") {
        event = stripe.webhooks.constructEvent(req.body as Buffer, sig, secret);
      } else {
        event = JSON.parse((req.body as Buffer).toString("utf8")) as Stripe.Event;
      }
    } catch (err) {
      logger.error({ err }, "Stripe webhook signature verification failed");
      res.status(400).json({ error: "Invalid signature" });
      return;
    }

    try {
      const stripe = await getUncachableStripeClient();
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          const userId = (session.metadata?.["userId"] as string | undefined)
            ?? (typeof session.customer === "string" ? await userIdForCustomer(stripe, session.customer) : null);
          if (!userId) break;
          if (typeof session.subscription === "string") {
            const sub = await stripe.subscriptions.retrieve(session.subscription);
            const periodEnd = (sub as unknown as { current_period_end?: number }).current_period_end;
            const until = typeof periodEnd === "number" ? new Date(periodEnd * 1000) : null;
            await setPremiumUntil(userId, until);
          }
          break;
        }
        case "customer.subscription.created":
        case "customer.subscription.updated": {
          const sub = event.data.object as Stripe.Subscription;
          const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
          const userId = (sub.metadata?.["userId"] as string | undefined)
            ?? await userIdForCustomer(stripe, customerId);
          if (!userId) break;
          const periodEnd = (sub as unknown as { current_period_end?: number }).current_period_end;
          const active = sub.status === "active" || sub.status === "trialing";
          const until = active && typeof periodEnd === "number" ? new Date(periodEnd * 1000) : null;
          await setPremiumUntil(userId, until);
          break;
        }
        case "customer.subscription.deleted": {
          const sub = event.data.object as Stripe.Subscription;
          const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
          const userId = (sub.metadata?.["userId"] as string | undefined)
            ?? await userIdForCustomer(stripe, customerId);
          if (userId) await setPremiumUntil(userId, null);
          break;
        }
        default:
          // ignore unrelated events
          break;
      }
      res.json({ received: true });
    } catch (err) {
      logger.error({ err, type: event.type }, "Stripe webhook processing failed");
      res.status(500).json({ error: "Webhook handler failed" });
    }
  },
);
