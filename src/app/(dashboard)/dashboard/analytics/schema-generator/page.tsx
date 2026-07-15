import { getCurrentUserOrgs } from "@/features/org/queries";
import { SchemaGenerator } from "@/features/seo/SchemaGenerator";

export default async function SchemaGeneratorPage() {
  const orgs = await getCurrentUserOrgs();
  const org = orgs[0];

  if (!org) {
    return <p className="text-sm text-neutral-500">You&apos;re not part of an organization yet.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Schema Generator</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Generate schema.org JSON-LD markup — helps search engines and AI models understand
          and cite your content correctly.
        </p>
      </div>
      <SchemaGenerator organizationId={org.id} />
    </div>
  );
}
