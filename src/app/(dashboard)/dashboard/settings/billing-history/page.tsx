import { getCurrentUserOrgs } from "@/features/org/queries";
import { getInvoicesForOrg } from "@/lib/stripe/invoices";

function formatAmount(cents: number, currency: string) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);
}

export default async function BillingHistoryPage() {
  const orgs = await getCurrentUserOrgs();
  const org = orgs[0];

  if (!org) {
    return <p className="text-sm text-neutral-500">You&apos;re not part of an organization yet.</p>;
  }

  const invoices = await getInvoicesForOrg(org.id);

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Billing History</h1>
        <p className="mt-1 text-sm text-neutral-500">Invoices from Stripe for this organization.</p>
      </div>

      {invoices.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center">
          <p className="text-sm text-neutral-500">
            No invoices yet. They&apos;ll appear here once you subscribe to a paid plan.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-neutral-100 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          {invoices.map((inv) => (
            <div key={inv.id} className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium text-neutral-900">
                  {formatAmount(inv.amountPaid, inv.currency)}
                </p>
                <p className="text-xs text-neutral-500">
                  {new Date(inv.created * 1000).toLocaleDateString()} · {inv.status}
                </p>
              </div>
              {inv.hostedInvoiceUrl && (
                <a
                  href={inv.hostedInvoiceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-medium text-blue-600 underline"
                >
                  View invoice
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
