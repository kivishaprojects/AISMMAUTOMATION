import { getCurrentUserOrgs } from "@/features/org/queries";
import { getContentDocs } from "@/features/seo/content-docs-queries";
import { ContentToolShell } from "@/features/seo/ContentToolShell";

export const maxDuration = 120;

export default async function LlmOptimizationPage() {
  const orgs = await getCurrentUserOrgs();
  const org = orgs[0];
  if (!org) return <p className="text-sm text-neutral-500">You&apos;re not part of an organization yet.</p>;

  const docs = await getContentDocs(org.id, ["GEO_OPTIMIZE"]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">LLM / GEO Optimization</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Analyzes a page and rewrites its weak spots for AI answer engines: direct-answer formatting,
          entity clarity, Q&amp;A structure, and citation-friendly phrasing — grounded in your actual content.
          (Different from Rank &amp; AI Visibility, which measures whether you&apos;re being mentioned.)
        </p>
      </div>
      <ContentToolShell
        organizationId={org.id}
        docType="GEO_OPTIMIZE"
        fields={[
          { name: "url", label: "Page URL to optimize", placeholder: "https://yoursite.com/important-page", required: true },
        ]}
        submitLabel="Analyze & optimize for AI search"
        pendingLabel="Crawling & analyzing…"
        initialDocs={docs}
      />
    </div>
  );
}
