import { getCurrentUserOrgs } from "@/features/org/queries";
import { getActiveSocialAccounts } from "@/features/scheduler/social-queries";
import { getPageReports } from "@/features/page-analyzer/queries";
import { PageAnalyzer } from "@/features/page-analyzer/PageAnalyzer";

export default async function PageAnalyzerPage() {
  const orgs = await getCurrentUserOrgs();
  const org = orgs[0];

  if (!org) {
    return <p className="text-sm text-neutral-500">You&apos;re not part of an organization yet.</p>;
  }

  const [accounts, reports] = await Promise.all([
    getActiveSocialAccounts(org.id),
    getPageReports(org.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Page Analyzer</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Audit a connected Facebook Page&apos;s completeness and engagement, with AI-written recommendations.
        </p>
      </div>
      <PageAnalyzer organizationId={org.id} accounts={accounts} pastReports={reports} />
    </div>
  );
}
