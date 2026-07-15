"use client";

import { useActionState, useState } from "react";
import { analyzeKeywordsAction, type KeywordCluster } from "./keyword-actions";
import type { KeywordReportRow } from "./keyword-queries";

const INTENT_COLORS: Record<string, string> = {
  informational: "bg-blue-50 text-blue-700",
  commercial: "bg-amber-50 text-amber-700",
  transactional: "bg-emerald-50 text-emerald-700",
  navigational: "bg-violet-50 text-violet-700",
};

function ReportView({ report }: { report: KeywordReportRow }) {
  const clusters = (report.clusters as KeywordCluster[] | null) ?? [];

  return (
    <div className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6">
      <div>
        <p className="text-sm font-semibold text-neutral-900">
          {report.topic || "Keyword clusters"}
        </p>
        <p className="text-xs text-neutral-500">{new Date(report.created_at).toLocaleString()}</p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {clusters.map((c, i) => (
          <div key={i} className="rounded-xl border border-neutral-200 p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-neutral-900">{c.topic}</p>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${INTENT_COLORS[c.intent] ?? "bg-neutral-100 text-neutral-600"}`}>
                {c.intent}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {c.keywords.map((k) => (
                <span key={k} className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
                  {k}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {report.gaps && (
        <div>
          <p className="mb-2 text-sm font-semibold text-neutral-900">Topic gaps to consider covering</p>
          <div className="whitespace-pre-line rounded-xl bg-brand-50 p-4 text-sm text-neutral-700">{report.gaps}</div>
        </div>
      )}
    </div>
  );
}

export function KeywordIntelligence({
  organizationId,
  pastReports,
}: {
  organizationId: string;
  pastReports: KeywordReportRow[];
}) {
  const [state, formAction, pending] = useActionState(analyzeKeywordsAction.bind(null, organizationId), null);
  const [viewing, setViewing] = useState<KeywordReportRow | null>(null);

  const activeReport =
    (state && "success" in state && state.success ? (state.report as KeywordReportRow) : null) ??
    viewing ??
    pastReports[0] ??
    null;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-indigo-100 bg-brand-50 p-4 text-sm text-neutral-700">
        Clustering, intent classification, and gap detection are AI-driven from the keywords you
        provide \u2014 real search volume/difficulty/CPC numbers need a paid data API (DataForSEO/Semrush),
        which isn&apos;t connected yet. Ask if you want that wired in.
      </div>

      <form action={formAction} className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6">
        <div>
          <label className="block text-sm font-medium text-neutral-700">Topic/niche (optional, helps accuracy)</label>
          <input
            name="topic"
            placeholder="e.g. home bakery in Ahmedabad"
            className="mt-1 w-full max-w-md rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Keywords (one per line)</label>
          <textarea
            name="keywords"
            required
            rows={8}
            placeholder={"eggless cake ahmedabad\nbest home bakery near me\ncustom birthday cake order\nhow to order cake online\nchocolate truffle cake price"}
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
          />
        </div>
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {pending ? "Analyzing…" : "Cluster & analyze"}
        </button>
        <p className="text-xs text-neutral-400">Costs 5 wallet credits (platform-managed key) or your own OpenAI usage.</p>
      </form>

      {activeReport && <ReportView report={activeReport} />}

      {pastReports.length > 1 && (
        <div>
          <p className="mb-2 text-sm font-semibold text-neutral-900">Past reports</p>
          <div className="space-y-1.5">
            {pastReports
              .filter((r) => r.id !== activeReport?.id)
              .map((r) => (
                <button
                  key={r.id}
                  onClick={() => setViewing(r)}
                  className="flex w-full items-center justify-between rounded-lg border border-neutral-200 bg-white px-3 py-2 text-left text-sm hover:bg-neutral-50"
                >
                  <span className="text-neutral-700">{r.topic || "Untitled"}</span>
                  <span className="text-xs text-neutral-400">{new Date(r.created_at).toLocaleDateString()}</span>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
