"use client";

import { useActionState, useEffect, useState } from "react";
import { generateCrawlabilityFilesAction } from "./crawlability-actions";
import { getChangesForBatchAction } from "./site-changes-actions";
import { ChangesQueue } from "./ChangesQueue";
import type { SiteChange } from "./site-changes-queries";

export function CrawlabilityTool({
  organizationId,
  hasRepo,
  initialBatches,
}: {
  organizationId: string;
  hasRepo: boolean;
  initialBatches: { batchId: string; changes: SiteChange[] }[];
}) {
  const [state, formAction, pending] = useActionState(generateCrawlabilityFilesAction.bind(null, organizationId), null);
  const [batches, setBatches] = useState(initialBatches);

  useEffect(() => {
    if (state && "success" in state && state.success && state.batchId) {
      getChangesForBatchAction(organizationId, state.batchId).then((changes) => {
        if (changes.length > 0) {
          setBatches((prev) => [{ batchId: state.batchId, changes: changes as SiteChange[] }, ...prev]);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6">
        <div>
          <label className="block text-sm font-medium text-neutral-700">Site root URL</label>
          <input
            name="siteUrl"
            type="url"
            required
            placeholder="https://example.com"
            className="mt-1 w-full max-w-md rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Pages to include in the sitemap (one per line)</label>
          <textarea
            name="pageUrls"
            required
            rows={6}
            placeholder={"https://example.com/\nhttps://example.com/about\nhttps://example.com/blog/some-post"}
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
          />
        </div>
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {pending ? "Generating…" : "Generate robots.txt & sitemap.xml"}
        </button>
      </form>

      {batches.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center">
          <p className="text-sm text-neutral-500">Nothing generated yet.</p>
        </div>
      ) : (
        batches.map((batch) => (
          <div key={batch.batchId}>
            <ChangesQueue organizationId={organizationId} changes={batch.changes} hasRepo={hasRepo} />
          </div>
        ))
      )}
    </div>
  );
}
