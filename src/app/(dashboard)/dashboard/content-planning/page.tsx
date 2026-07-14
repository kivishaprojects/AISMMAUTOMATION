import { getCurrentUserOrgs } from "@/features/org/queries";
import { getContentNotes } from "@/features/content-planning/queries";
import { ContentPlanningBoard } from "@/features/content-planning/ContentPlanningBoard";

export default async function ContentPlanningPage() {
  const orgs = await getCurrentUserOrgs();
  const org = orgs[0];

  if (!org) {
    return <p className="text-sm text-neutral-500">You&apos;re not part of an organization yet.</p>;
  }

  const notes = await getContentNotes(org.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Content Planning</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Mark dates you need content ready for.
        </p>
      </div>
      <ContentPlanningBoard organizationId={org.id} notes={notes} />
    </div>
  );
}
