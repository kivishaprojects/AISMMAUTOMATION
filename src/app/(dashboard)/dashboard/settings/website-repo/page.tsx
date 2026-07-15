import { getCurrentUserOrgs } from "@/features/org/queries";
import { getRepoConnections } from "@/features/seo/repo-queries";
import { RepoConnectionForm } from "@/features/seo/RepoConnectionForm";

export default async function WebsiteRepoPage() {
  const orgs = await getCurrentUserOrgs();
  const org = orgs[0];

  if (!org) {
    return <p className="text-sm text-neutral-500">You&apos;re not part of an organization yet.</p>;
  }

  const connections = await getRepoConnections(org.id);

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Website Repository</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Connect your site&apos;s GitHub repo so approved SEO fixes (title, meta description) can be
          opened as a Pull Request for you to review and merge — instead of just a written suggestion.
        </p>
      </div>
      <RepoConnectionForm organizationId={org.id} connections={connections} />
    </div>
  );
}
