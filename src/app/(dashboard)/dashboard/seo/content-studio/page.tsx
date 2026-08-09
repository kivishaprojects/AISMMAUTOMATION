import { getCurrentUserOrgs } from "@/features/org/queries";
import { getContentDocs } from "@/features/seo/content-docs-queries";
import { ContentToolShell } from "@/features/seo/ContentToolShell";

export const maxDuration = 120;

export default async function ContentStudioPage() {
  const orgs = await getCurrentUserOrgs();
  const org = orgs[0];
  if (!org) return <p className="text-sm text-neutral-500">You&apos;re not part of an organization yet.</p>;

  const docs = await getContentDocs(org.id, ["CONTENT_BRIEF", "ARTICLE", "FAQ_SET", "META_SET"]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">AI Content Studio</h1>
        <p className="mt-1 text-sm text-neutral-500">
          SEO content briefs, full article drafts, FAQ sets with schema, and title/meta options — in any
          language, optionally grounded in an existing page.
        </p>
      </div>
      <ContentToolShell
        organizationId={org.id}
        docType="CONTENT_BRIEF"
        docTypeOptions={[
          { value: "CONTENT_BRIEF", label: "Content brief (outline, keywords, questions, schema)" },
          { value: "ARTICLE", label: "Full article draft" },
          { value: "FAQ_SET", label: "FAQ set + FAQPage schema" },
          { value: "META_SET", label: "Title tag + meta description options" },
        ]}
        fields={[
          { name: "topic", label: "Topic / target keyword", placeholder: "e.g. eggless birthday cakes in Ahmedabad", required: true },
          { name: "audience", label: "Target audience (optional)", placeholder: "e.g. busy parents ordering online" },
          { name: "language", label: "Language", placeholder: "English (default) — or Hindi, Gujarati, Spanish…" },
          { name: "url", label: "Existing page URL (optional)", placeholder: "https://… — the AI will read it for context", hint: "For refreshes/rewrites, point at the page so suggestions build on what's there." },
        ]}
        submitLabel="Generate"
        pendingLabel="Writing…"
        initialDocs={docs}
      />
    </div>
  );
}
