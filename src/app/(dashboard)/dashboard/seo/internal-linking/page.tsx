import { getCurrentUserOrgs } from "@/features/org/queries";
import { getContentDocs } from "@/features/seo/content-docs-queries";
import { ContentToolShell } from "@/features/seo/ContentToolShell";

export const maxDuration = 120;

export default async function InternalLinkingPage() {
  const orgs = await getCurrentUserOrgs();
  const org = orgs[0];
  if (!org) return <p className="text-sm text-neutral-500">You&apos;re not part of an organization yet.</p>;

  const docs = await getContentDocs(org.id, ["INTERNAL_LINKING"]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Internal Linking Engine</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Paste your key pages — the engine crawls them, maps which already link to each other, finds
          orphan and under-linked pages, and proposes contextual links with anchor text.
        </p>
      </div>
      <ContentToolShell
        organizationId={org.id}
        docType="INTERNAL_LINKING"
        fields={[
          {
            name: "urls",
            label: "Page URLs (one per line, 2-8 pages)",
            placeholder: "https://yoursite.com/\nhttps://yoursite.com/services\nhttps://yoursite.com/blog/post-1",
            textarea: true,
            required: true,
          },
        ]}
        submitLabel="Build linking plan"
        pendingLabel="Crawling pages…"
        initialDocs={docs}
      />
    </div>
  );
}
