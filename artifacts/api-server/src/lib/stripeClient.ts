import Stripe from "stripe";

// Test vs. live mode is decided by which keys are configured: staging uses
// sk_test_/pk_test_ keys, production uses live keys.
function requireEnv(name: "STRIPE_SECRET_KEY" | "STRIPE_PUBLISHABLE_KEY"): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} must be set to use Stripe`);
  }
  return value;
}

let client: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (!client) {
    client = new Stripe(requireEnv("STRIPE_SECRET_KEY"), { apiVersion: "2025-11-17.clover" });
  }
  return client;
}

export function getStripePublishableKey(): string {
  return requireEnv("STRIPE_PUBLISHABLE_KEY");
}
