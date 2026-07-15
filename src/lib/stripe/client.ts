import "server-only";
import Stripe from "stripe";

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set. Add it in your environment variables.");
  }
  return new Stripe(key);
}

export type PlanTier = "STARTER" | "GROWTH" | "ENTERPRISE" | "AGENCY";

export const PLAN_TIERS: { tier: PlanTier; label: string; description: string; priceEnvVar: string }[] = [
  { tier: "STARTER", label: "Starter", description: "For solo operators getting started with AI content.", priceEnvVar: "STRIPE_PRICE_STARTER" },
  { tier: "GROWTH", label: "Growth", description: "For small teams publishing regularly across platforms.", priceEnvVar: "STRIPE_PRICE_GROWTH" },
  { tier: "ENTERPRISE", label: "Enterprise", description: "For larger teams needing more seats and volume.", priceEnvVar: "STRIPE_PRICE_ENTERPRISE" },
  { tier: "AGENCY", label: "Agency", description: "For agencies managing multiple client workspaces.", priceEnvVar: "STRIPE_PRICE_AGENCY" },
];

export function getPriceId(tier: PlanTier): string | null {
  const entry = PLAN_TIERS.find((p) => p.tier === tier);
  if (!entry) return null;
  return process.env[entry.priceEnvVar] ?? null;
}
