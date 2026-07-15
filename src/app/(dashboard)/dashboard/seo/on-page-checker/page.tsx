import { getCurrentUserOrgs } from "@/features/org/queries";
import { getRepoConnections } from "@/features/seo/repo-queries";
import { getRecentBatches, getSiteChangesByBatch } from "@/features/seo/site-changes-queries";
import { OnPageChecker } from "@/features/seo/OnPageChecker";

export const maxDuration = 120;

export default async function OnPageCheckerPage() {
  const orgs = await getCurrentUserOrgs();
  const org = orgs[0];

  if (!org) {
    return <p className="text-sm text-neutral-500">You&apos;re not part of an organization yet.</p>;
  }

  const [repoConnections, recentBatches] = await Promise.all([
    getRepoConnections(org.id),
    getRecentBatches(org.id, 5),
  ]);

  const onPageBatches = recentBatches.filter((b) => b.pageUrl !== null);
  const initialBatches = await Promise.all(
    onPageBatches.map(async (b) => ({
      batchId: b.batchId,
      changes: await getSiteChangesByBatch(org.id, b.batchId),
    }))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">On-Page SEO Checker</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Checks title, meta, headings, canonical, Open Graph, Twitter Card, FAQ opportunities, and
          CTAs — approve fixes and deploy them as a Pull Request.
        </p>
      </div>
      <OnPageChecker organizationId={org.id} hasRepo={repoConnections.length > 0} initialBatches={initialBatches} />
    </div>
  );
}
