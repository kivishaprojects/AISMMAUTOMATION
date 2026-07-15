"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/client";
import { CREDIT_PACKS } from "./wallet-constants";

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

  await supabase.from("organizations").update({ stripe_customer_id: customer.id }).eq("id", organizationId);
  return customer.id;
}

export async function buyCreditsAction(organizationId: string, credits: number) {
  const pack = CREDIT_PACKS.find((p) => p.credits === credits);
  if (!pack) throw new Error("Invalid credit pack");

  const customerId = await getOrCreateStripeCustomer(organizationId);
  const stripe = getStripe();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  // Inline price_data \u2014 no need to pre-create a Stripe Product/Price for
  // every pack size, unlike the subscription flow.
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: pack.priceUsd * 100,
          product_data: { name: `${pack.label} \u2014 AI Marketing OS wallet top-up` },
        },
        quantity: 1,
      },
    ],
    success_url: `${baseUrl}/dashboard/settings/wallet?success=1`,
    cancel_url: `${baseUrl}/dashboard/settings/wallet?canceled=1`,
    metadata: { organization_id: organizationId, type: "wallet_topup", credits: String(pack.credits) },
  });

  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  redirect(session.url);
}
