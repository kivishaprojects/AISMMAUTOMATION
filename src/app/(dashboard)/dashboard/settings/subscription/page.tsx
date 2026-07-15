import { getCurrentUserOrgs } from "@/features/org/queries";
import { createClient } from "@/lib/supabase/server";
import { PLAN_TIERS } from "@/lib/stripe/client";
import { startCheckoutAction, openBillingPortalAction } from "@/features/settings/billing-actions";

export default async function SubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; canceled?: string }>;
}) {
  const orgs = await getCurrentUserOrgs();
  const org = orgs[0];
  const params = await searchParams;

  if (!org) {
    return <p className="text-sm text-neutral-500">You&apos;re not part of an organization yet.</p>;
  }

  const supabase = await createClient();
  const { data: orgRow } = await supabase
    .from("organizations")
    .select("plan, subscription_status, stripe_customer_id")
    .eq("id", org.id)
    .single();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Subscription</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Current plan: <span className="font-medium text-neutral-900">{orgRow?.plan ?? "FREE"}</span>
          {orgRow?.subscription_status && ` · ${orgRow.subscription_status}`}
        </p>
      </div>

      {params.success && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          Subscription updated.
        </div>
      )}
      {params.canceled && (
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
          Checkout canceled — no changes made.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {PLAN_TIERS.map((tier) => (
          <div key={tier.tier} className="rounded-2xl border border-neutral-200 bg-white p-5">
            <p className="text-sm font-semibold text-neutral-900">{tier.label}</p>
            <p className="mt-1 text-xs text-neutral-500">{tier.description}</p>
            <form action={startCheckoutAction.bind(null, org.id, tier.tier)} className="mt-4">
              <button
                type="submit"
                disabled={orgRow?.plan === tier.tier}
                className="w-full rounded-lg bg-brand-600 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-default disabled:bg-neutral-200 disabled:text-neutral-400"
              >
                {orgRow?.plan === tier.tier ? "Current plan" : "Choose plan"}
              </button>
            </form>
          </div>
        ))}
      </div>

      {orgRow?.stripe_customer_id && (
        <form action={openBillingPortalAction.bind(null, org.id)}>
          <button
            type="submit"
            className="text-sm font-medium text-neutral-600 underline hover:text-neutral-900"
          >
            Manage billing, payment method, or cancel
          </button>
        </form>
      )}

      <p className="text-xs text-neutral-400">
        Requires Stripe products/prices and env vars to be configured — see setup steps if plans don&apos;t load.
      </p>
    </div>
  );
}
