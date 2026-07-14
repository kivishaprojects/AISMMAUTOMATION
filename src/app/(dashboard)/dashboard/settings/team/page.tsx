import { getCurrentUserOrgs } from "@/features/org/queries";
import { getTeamMembers } from "@/features/settings/team-queries";
import { TeamManager } from "@/features/settings/TeamManager";

export default async function TeamPage() {
  const orgs = await getCurrentUserOrgs();
  const org = orgs[0];

  if (!org) {
    return <p className="text-sm text-neutral-500">You&apos;re not part of an organization yet.</p>;
  }

  const members = await getTeamMembers(org.id);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">User Management</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Invite teammates and manage their access level.
        </p>
      </div>
      <TeamManager organizationId={org.id} members={members} />
    </div>
  );
}
