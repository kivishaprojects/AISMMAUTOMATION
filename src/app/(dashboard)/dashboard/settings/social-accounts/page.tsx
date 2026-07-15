import { getCurrentUserOrgs } from "@/features/org/queries";
import { getActiveSocialAccounts } from "@/features/scheduler/social-queries";
import { connectMetaAction, connectLinkedInAction } from "@/features/settings/social-accounts-actions";
import { DisconnectButton } from "@/features/settings/DisconnectButton";
import { LinkedInCompanyPageForm } from "@/features/settings/LinkedInCompanyPageForm";

export default async function SocialAccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
  const orgs = await getCurrentUserOrgs();
  const org = orgs[0];
  const params = await searchParams;

  if (!org) {
    return <p className="text-sm text-neutral-500">You&apos;re not part of an organization yet.</p>;
  }

  const accounts = await getActiveSocialAccounts(org.id);
  const metaAccounts = accounts.filter((a) => a.platform === "FACEBOOK" || a.platform === "INSTAGRAM");
  const linkedInAccounts = accounts.filter((a) => a.platform === "LINKEDIN");

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Social Media Accounts</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Connect accounts to publish directly from the Scheduler.
        </p>
      </div>

      {params.connected && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          Connected successfully.
        </div>
      )}
      {params.error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {decodeURIComponent(params.error)}
        </div>
      )}

      <div className="rounded-2xl border border-neutral-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-900">Facebook &amp; Instagram</p>
            <p className="mt-0.5 text-xs text-neutral-500">
              Connects any Page you manage, plus its linked Instagram Business account.
            </p>
          </div>
          <form action={connectMetaAction.bind(null, org.id)}>
            <button
              type="submit"
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Connect
            </button>
          </form>
        </div>

        {metaAccounts.length > 0 && (
          <div className="mt-4 space-y-2 border-t border-neutral-100 pt-4">
            {metaAccounts.map((acc) => (
              <div key={acc.id} className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2">
                <span className="text-sm text-neutral-700">
                  {acc.platform} · {acc.external_id}
                </span>
                <DisconnectButton accountId={acc.id} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-900">LinkedIn</p>
            <p className="mt-0.5 text-xs text-neutral-500">
              Connects your personal profile immediately. Posting as your Company Page
              needs LinkedIn&apos;s Marketing API approval (2-4 weeks) \u2014 set the Page ID below once approved.
            </p>
          </div>
          <form action={connectLinkedInAction.bind(null, org.id)}>
            <button
              type="submit"
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Connect
            </button>
          </form>
        </div>

        {linkedInAccounts.length > 0 && (
          <div className="mt-4 space-y-3 border-t border-neutral-100 pt-4">
            {linkedInAccounts.map((acc) => (
              <div key={acc.id} className="rounded-lg border border-neutral-200 px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-700">
                    {acc.external_id.includes("organization") ? "Company Page" : "Personal profile"} ·{" "}
                    <span className="text-xs text-neutral-400">{acc.external_id}</span>
                  </span>
                  <DisconnectButton accountId={acc.id} />
                </div>
                <LinkedInCompanyPageForm accountId={acc.id} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-white p-4">
        <span className="text-sm font-medium text-neutral-900">X (Twitter)</span>
        <button
          disabled
          className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-400"
          title="Requires platform app credentials"
        >
          Connect
        </button>
      </div>
    </div>
  );
}
