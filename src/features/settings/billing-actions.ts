"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStripe, getPriceId, type PlanTier } from "@/lib/stripe/client";

async function getOrCreateStripeCustomer(organizationId: string): Promise<string> {
  const supabase = await createClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("stripe_customer_id, name")
    .eq("id", organizationId)
    .single();

  if (org?.stripe_customer_id) return org.stripe_customer_id;

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    name: org?.name ?? undefined,
    metadata: { organization_id: organizationId },
  });

  await supabase
    .from("organizations")
    .update({ stripe_customer_id: customer.id })
    .eq("id", organizationId);

  return customer.id;
}

export async function startCheckoutAction(organizationId: string, tier: PlanTier) {
  const priceId = getPriceId(tier);
  if (!priceId) {
    throw new Error(
      `No Stripe price configured for ${tier}. Add it in Vercel env vars first.`
    );
  }

  const customerId = await getOrCreateStripeCustomer(organizationId);
  const stripe = getStripe();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/dashboard/settings/subscription?success=1`,
    cancel_url: `${baseUrl}/dashboard/settings/subscription?canceled=1`,
    metadata: { organization_id: organizationId, tier },
  });

  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  redirect(session.url);
}

export async function openBillingPortalAction(organizationId: string) {
  const customerId = await getOrCreateStripeCustomer(organizationId);
  const stripe = getStripe();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${baseUrl}/dashboard/settings/subscription`,
  });

  redirect(session.url);
}
