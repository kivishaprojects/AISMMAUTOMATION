import { getCurrentUserOrgs } from "@/features/org/queries";
import { createClient } from "@/lib/supabase/server";
import { buyCreditsAction } from "@/features/settings/wallet-actions";
import { CREDIT_PACKS } from "@/features/settings/wallet-constants";
import { getWalletTransactions } from "@/features/settings/wallet-queries";

export default async function WalletPage({
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
    .select("credits_balance")
    .eq("id", org.id)
    .single();

  const transactions = await getWalletTransactions(org.id);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Wallet</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Prepaid credits for platform-managed AI generation. Images cost 5 credits,
          videos cost 50 \u2014 only when you&apos;re using AI Marketing OS&apos;s shared key
          (Settings \u2192 My API Keys set to &quot;Platform-managed&quot;). Your own key never touches this balance.
        </p>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-6">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Current balance</p>
        <p className="mt-1 text-3xl font-semibold text-neutral-900">
          {orgRow?.credits_balance ?? 0} <span className="text-base font-normal text-neutral-400">credits</span>
        </p>
      </div>

      {params.success && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          Credits added.
        </div>
      )}
      {params.canceled && (
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
          Checkout canceled — no changes made.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {CREDIT_PACKS.map((pack) => (
          <div key={pack.credits} className="rounded-2xl border border-neutral-200 bg-white p-5 text-center">
            <p className="text-lg font-semibold text-neutral-900">{pack.label}</p>
            <p className="mt-1 text-sm text-neutral-500">${pack.priceUsd}</p>
            <form action={buyCreditsAction.bind(null, org.id, pack.credits)} className="mt-4">
              <button
                type="submit"
                className="w-full rounded-lg bg-brand-600 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                Buy
              </button>
            </form>
          </div>
        ))}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-neutral-900">Recent activity</h2>
        {transactions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center">
            <p className="text-sm text-neutral-500">No wallet activity yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
            {transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm text-neutral-900">{t.description ?? t.type}</p>
                  <p className="text-xs text-neutral-500">{new Date(t.created_at).toLocaleString()}</p>
                </div>
                <span className={`text-sm font-medium ${t.credits >= 0 ? "text-green-600" : "text-neutral-600"}`}>
                  {t.credits >= 0 ? "+" : ""}{t.credits}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
