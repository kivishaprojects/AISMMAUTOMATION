import { getCurrentUserOrgs } from "@/features/org/queries";
import { getSeoAudits } from "@/features/seo/seo-audit-queries";
import { SeoAuditTool } from "@/features/seo/SeoAuditTool";

// Crawling + broken-link checks + PageSpeed can take a while combined.
export const maxDuration = 60;

export default async function SeoAuditPage() {
  const orgs = await getCurrentUserOrgs();
  const org = orgs[0];

  if (!org) {
    return <p className="text-sm text-neutral-500">You&apos;re not part of an organization yet.</p>;
  }

  const audits = await getSeoAudits(org.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">SEO Audit</h1>
        <p className="mt-1 text-sm text-neutral-500">
          On-page checks, Core Web Vitals, and AI-written fixes for any URL.
        </p>
      </div>
      <SeoAuditTool organizationId={org.id} pastAudits={audits} />
    </div>
  );
}
