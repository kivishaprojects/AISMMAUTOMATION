import { getCurrentUserOrgs } from "@/features/org/queries";
import { getKeywordReports } from "@/features/seo/keyword-queries";
import { KeywordIntelligence } from "@/features/seo/KeywordIntelligence";

export default async function KeywordIntelligencePage() {
  const orgs = await getCurrentUserOrgs();
  const org = orgs[0];

  if (!org) {
    return <p className="text-sm text-neutral-500">You&apos;re not part of an organization yet.</p>;
  }

  const reports = await getKeywordReports(org.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">AI Keyword Intelligence</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Paste keywords to get topic clusters, search intent, and content gap suggestions.
        </p>
      </div>
      <KeywordIntelligence organizationId={org.id} pastReports={reports} />
    </div>
  );
}
