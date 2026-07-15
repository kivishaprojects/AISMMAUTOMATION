import { getCurrentUserOrgs } from "@/features/org/queries";
import { getGeneratedVideos } from "@/features/creative-studio/video-queries";
import { getActiveSocialAccounts } from "@/features/scheduler/social-queries";
import { VideoStudio } from "@/features/creative-studio/VideoStudio";

// Instagram Reel container processing is polled for up to ~100s inside
// the publish call; give this route enough headroom (requires Vercel Pro
// or higher — Hobby caps at 60s regardless of this setting).
export const maxDuration = 180;

export default async function CreateVideosPage() {
  const orgs = await getCurrentUserOrgs();
  const org = orgs[0];

  if (!org) {
    return <p className="text-sm text-neutral-500">You&apos;re not part of an organization yet.</p>;
  }

  const [videos, socialAccounts] = await Promise.all([
    getGeneratedVideos(org.id),
    getActiveSocialAccounts(org.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Create Videos</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Create → approve → caption → publish or schedule, same flow as images. Note: OpenAI has
          announced this API shuts down September 24, 2026 — we&apos;ll swap providers before then.
        </p>
      </div>
      <VideoStudio organizationId={org.id} videos={videos} socialAccounts={socialAccounts} />
    </div>
  );
}
