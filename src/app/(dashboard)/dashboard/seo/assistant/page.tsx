import { getCurrentUserOrgs } from "@/features/org/queries";
import { SeoAssistant } from "@/features/seo/SeoAssistant";

export default async function SeoAssistantPage() {
  const orgs = await getCurrentUserOrgs();
  const org = orgs[0];
  if (!org) return <p className="text-sm text-neutral-500">You&apos;re not part of an organization yet.</p>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">AI SEO Assistant</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Conversational SEO help, grounded in your workspace data. Each message costs 1 wallet credit
          (platform-managed key) or your own OpenAI usage.
        </p>
      </div>
      <SeoAssistant organizationId={org.id} />
    </div>
  );
}
