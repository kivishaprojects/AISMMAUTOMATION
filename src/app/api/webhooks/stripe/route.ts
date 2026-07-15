import { NextResponse } from "next/server";
import { getStripe, PLAN_TIERS, type PlanTier } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const body = await request.text();
  const stripe = getStripe();

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: `Webhook signature verification failed: ${message}` }, { status: 400 });
  }

  const admin = createAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as { metadata?: Record<string, string>; subscription?: string; customer?: string };
      const organizationId = session.metadata?.organization_id;
      const tier = session.metadata?.tier as PlanTier | undefined;
      if (organizationId && tier && PLAN_TIERS.some((p) => p.tier === tier)) {
        await admin
          .from("organizations")
          .update({
            plan: tier,
            stripe_subscription_id: session.subscription ?? null,
            subscription_status: "active",
          })
          .eq("id", organizationId);
      }
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as { customer: string; status: string; id: string };
      const { data: org } = await admin
        .from("organizations")
        .select("id")
        .eq("stripe_customer_id", subscription.customer)
        .single();

      if (org) {
        const isActive = subscription.status === "active" || subscription.status === "trialing";
        await admin
          .from("organizations")
          .update({
            subscription_status: subscription.status,
            plan: isActive ? undefined : "FREE", // downgrade on cancel/past_due; leave as-is if still active
          })
          .eq("id", org.id);
      }
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
