import { getCurrentUserOrgs } from "@/features/org/queries";
import { getPosts } from "@/features/scheduler/queries";
import { SchedulerList } from "@/features/scheduler/SchedulerList";

export default async function SchedulerPage() {
  const orgs = await getCurrentUserOrgs();
  const org = orgs[0];

  if (!org) {
    return <p className="text-sm text-neutral-500">You&apos;re not part of an organization yet.</p>;
  }

  const posts = await getPosts(org.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Scheduler</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Everything published or scheduled from Creative Studio. List view for now — calendar view is next.
        </p>
      </div>
      <SchedulerList posts={posts} />
    </div>
  );
}
