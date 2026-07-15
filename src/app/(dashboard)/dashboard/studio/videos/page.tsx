import { getCurrentUserOrgs } from "@/features/org/queries";
import { getGeneratedVideos } from "@/features/creative-studio/video-queries";
import { VideoStudio } from "@/features/creative-studio/VideoStudio";

export default async function CreateVideosPage() {
  const orgs = await getCurrentUserOrgs();
  const org = orgs[0];

  if (!org) {
    return <p className="text-sm text-neutral-500">You&apos;re not part of an organization yet.</p>;
  }

  const videos = await getGeneratedVideos(org.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Create Videos</h1>
        <p className="mt-1 text-sm text-neutral-500">
          AI video generation via OpenAI Sora. Note: OpenAI has announced this API
          shuts down September 24, 2026 \u2014 we&apos;ll swap providers before then.
        </p>
      </div>
      <VideoStudio organizationId={org.id} videos={videos} />
    </div>
  );
}
