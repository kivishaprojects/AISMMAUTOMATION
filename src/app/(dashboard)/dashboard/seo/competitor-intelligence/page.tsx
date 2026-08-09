import { getCurrentUserOrgs } from "@/features/org/queries";
import { getContentDocs } from "@/features/seo/content-docs-queries";
import { ContentToolShell } from "@/features/seo/ContentToolShell";

export const maxDuration = 120;

export default async function CompetitorIntelligencePage() {
  const orgs = await getCurrentUserOrgs();
  const org = orgs[0];
  if (!org) return <p className="text-sm text-neutral-500">You&apos;re not part of an organization yet.</p>;

  const docs = await getContentDocs(org.id, ["COMPETITOR_ANALYSIS"]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Competitor Intelligence</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Head-to-head page comparison: crawls your page and a competitor&apos;s, then maps content gaps,
          structural advantages, and a prioritized plan to close them. (Backlink and keyword-overlap data
          needs a paid provider like Ahrefs/Semrush/DataForSEO — this compares actual page content.)
        </p>
      </div>
      <ContentToolShell
        organizationId={org.id}
        docType="COMPETITOR_ANALYSIS"
        fields={[
          { name: "yourUrl", label: "Your page URL", placeholder: "https://yoursite.com/services", required: true },
          { name: "competitorUrl", label: "Competitor's page URL", placeholder: "https://competitor.com/services", required: true },
        ]}
        submitLabel="Compare pages"
        pendingLabel="Crawling both pages…"
        initialDocs={docs}
      />
    </div>
  );
}
