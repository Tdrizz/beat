import { Router, type IRouter } from "express";
import { db, profilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { rateLimit } from "../middlewares/rateLimit";
import { getStripeClient, getStripePublishableKey } from "../lib/stripeClient";
import { publicAppUrl } from "../lib/publicUrl";
import { getPremiumStatus } from "../lib/premium";

const router: IRouter = Router();

// $9.99/month — single tier as per task scope.
const PREMIUM_PRICE_CENTS = 999;
const PREMIUM_CURRENCY = "usd";
const PREMIUM_PRODUCT_NAME = "Glamr Premium";

/* Public Stripe publishable key for the Checkout client. We expose this
 * via API rather than baking into the Vite bundle so swapping Stripe
 * environments doesn't require a redeploy of the frontend. */
router.get("/premium/config", async (_req, res) => {
  try {
    const publishableKey = getStripePublishableKey();
    res.json({ publishableKey });
  } catch (err) {
    res.status(503).json({ error: "Stripe not configured" });
  }
});

router.get("/me/premium", requireAuth, async (req, res) => {
  res.json(await getPremiumStatus(req.userId!));
});

/* Checkout session creation. We resolve the user's Stripe customer id
 * lazily (cache on profile after first checkout) so renewals reuse the
 * same customer. We also create the price on-the-fly with `price_data`
 * so we don't depend on a manual seed-products run. */
router.post(
  "/premium/checkout",
  requireAuth,
  rateLimit({ scope: "premium-checkout", max: 10, windowMs: 60_000 }),
  async (req, res) => {
    try {
      const stripe = getStripeClient();
      const userRows = await db
        .select()
        .from(profilesTable)
        .where(eq(profilesTable.userId, req.userId!))
        .limit(1);
      if (userRows.length === 0) {
        res.status(404).json({ error: "Complete your profile before subscribing" });
        return;
      }
      const profile = userRows[0];

      let customerId = profile.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          metadata: { userId: req.userId!, handle: profile.handle },
          name: profile.displayName,
        });
        customerId = customer.id;
        await db
          .update(profilesTable)
          .set({ stripeCustomerId: customerId, updatedAt: new Date() })
          .where(eq(profilesTable.userId, req.userId!));
      }

      const origin = publicAppUrl();

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: PREMIUM_CURRENCY,
              unit_amount: PREMIUM_PRICE_CENTS,
              recurring: { interval: "month" },
              product_data: {
                name: PREMIUM_PRODUCT_NAME,
                description: "Host live classes, watch all premium classes, ad-free.",
              },
            },
          },
        ],
        success_url: `${origin}/premium?success=1&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/premium?cancelled=1`,
        metadata: { userId: req.userId! },
        subscription_data: { metadata: { userId: req.userId! } },
      });

      res.json({ url: session.url, id: session.id });
    } catch (err) {
      req.log?.error?.({ err }, "Stripe checkout creation failed");
      const message = err instanceof Error ? err.message : "Unknown";
      res.status(500).json({ error: `Could not start checkout: ${message}` });
    }
  },
);

/* Customer portal — for cancellation / payment-method updates. */
router.post("/premium/portal", requireAuth, async (req, res) => {
  try {
    const stripe = getStripeClient();
    const rows = await db
      .select({ stripeCustomerId: profilesTable.stripeCustomerId })
      .from(profilesTable)
      .where(eq(profilesTable.userId, req.userId!))
      .limit(1);
    const customerId = rows[0]?.stripeCustomerId;
    if (!customerId) {
      res.status(400).json({ error: "No Stripe customer on file. Subscribe first." });
      return;
    }
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${publicAppUrl()}/premium`,
    });
    res.json({ url: session.url });
  } catch (err) {
    req.log?.error?.({ err }, "Customer portal failed");
    res.status(500).json({ error: "Could not open customer portal" });
  }
});

export default router;
