import { getCurrentUserOrgs } from "@/features/org/queries";
import { getIntegration } from "@/features/settings/api-keys-queries";
import { ApiKeyForm } from "@/features/settings/ApiKeyForm";

export default async function ApiKeysPage() {
  const orgs = await getCurrentUserOrgs();
  const org = orgs[0];

  if (!org) {
    return <p className="text-sm text-neutral-500">You&apos;re not part of an organization yet.</p>;
  }

  const openaiIntegration = await getIntegration(org.id, "openai");

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">My API Keys</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Choose whether AI generation uses the platform&apos;s shared keys or your own.
        </p>
      </div>
      <ApiKeyForm
        organizationId={org.id}
        provider="openai"
        label="OpenAI (image + caption generation)"
        existing={openaiIntegration}
      />
    </div>
  );
}
