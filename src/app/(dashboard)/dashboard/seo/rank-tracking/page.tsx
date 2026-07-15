import { getCurrentUserOrgs } from "@/features/org/queries";
import { getTrackedPromptsWithHistory } from "@/features/seo/geo-queries";
import { GeoTracking } from "@/features/seo/GeoTracking";

export default async function RankTrackingPage() {
  const orgs = await getCurrentUserOrgs();
  const org = orgs[0];

  if (!org) {
    return <p className="text-sm text-neutral-500">You&apos;re not part of an organization yet.</p>;
  }

  const prompts = await getTrackedPromptsWithHistory(org.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Rank & AI Visibility Tracking</h1>
        <p className="mt-1 text-sm text-neutral-500">
          AI-mention tracking (below) is fully live. Traditional Google SERP position tracking
          needs a paid data API (SerpApi/DataForSEO) that isn&apos;t connected yet — ask if you want it wired in.
        </p>
      </div>
      <GeoTracking organizationId={org.id} prompts={prompts} />
    </div>
  );
}
