import { getCurrentUserOrgs } from "@/features/org/queries";
import { getRepoConnections } from "@/features/seo/repo-queries";
import { getRecentAiScans } from "@/features/seo/ai-scan-queries";
import { getSiteChangesByBatch, type SiteChange } from "@/features/seo/site-changes-queries";
import { AiScanTool } from "@/features/seo/AiScan";
import type { ScanSuggestion } from "@/lib/ai/ai-scan";

// Site discovery + up to 8 page crawls + one large AI analysis call.
export const maxDuration = 300;

export default async function AiScanPage({
  searchParams,
}: {
  searchParams: Promise<{ scan?: string }>;
}) {
  const orgs = await getCurrentUserOrgs();
  const org = orgs[0];

  if (!org) {
    return <p className="text-sm text-neutral-500">You&apos;re not part of an organization yet.</p>;
  }

  const { scan: selectedScanId } = await searchParams;
  const [repoConnections, scans] = await Promise.all([
    getRepoConnections(org.id),
    getRecentAiScans(org.id, 20),
  ]);

  const executedBatchIds = scans.flatMap((scan) =>
    ((scan.suggestions as unknown as ScanSuggestion[]) ?? [])
      .map((s) => s.executed_batch_id)
      .filter((id): id is string => !!id)
  );
  const executedBatches: Record<string, SiteChange[]> = {};
  await Promise.all(
    executedBatchIds.map(async (batchId) => {
      executedBatches[batchId] = await getSiteChangesByBatch(org.id, batchId);
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">AI Scan</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Full-site AI screening: crawls your website, scores its SEO and AI-search (GEO) health, and
          generates prioritized suggestions — each with an Execute button that turns it into an
          approvable, deployable fix.
        </p>
      </div>
      <AiScanTool
        organizationId={org.id}
        hasRepo={repoConnections.length > 0}
        initialScans={scans}
        executedBatches={executedBatches}
        selectedScanId={selectedScanId ?? null}
      />
    </div>
  );
}
