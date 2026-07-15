import { getCurrentUserOrgs } from "@/features/org/queries";
import { getRepoConnections } from "@/features/seo/repo-queries";
import { getRecentBatches, getSiteChangesByBatch } from "@/features/seo/site-changes-queries";
import { CrawlabilityTool } from "@/features/seo/CrawlabilityTool";

export default async function CrawlabilityPage() {
  const orgs = await getCurrentUserOrgs();
  const org = orgs[0];

  if (!org) {
    return <p className="text-sm text-neutral-500">You&apos;re not part of an organization yet.</p>;
  }

  const [repoConnections, recentBatches] = await Promise.all([
    getRepoConnections(org.id),
    getRecentBatches(org.id, 5),
  ]);

  const crawlabilityBatches = recentBatches.filter((b) => b.pageUrl === null);
  const initialBatches = await Promise.all(
    crawlabilityBatches.map(async (b) => ({
      batchId: b.batchId,
      changes: await getSiteChangesByBatch(org.id, b.batchId),
    }))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Crawlability</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Generate robots.txt and an XML sitemap, review them, and deploy as a Pull Request.
        </p>
      </div>
      <CrawlabilityTool organizationId={org.id} hasRepo={repoConnections.length > 0} initialBatches={initialBatches} />
    </div>
  );
}
