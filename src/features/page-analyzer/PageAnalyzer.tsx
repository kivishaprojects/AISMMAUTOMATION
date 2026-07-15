"use client";

import { useActionState, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { generatePageReportAction } from "./actions";
import type { PageReportRow } from "./queries";
import type { SocialAccount } from "@/features/scheduler/social-queries";

function ScoreRing({ score }: { score: number }) {
  const color = score >= 70 ? "#10b981" : score >= 40 ? "#f59e0b" : "#ef4444";
  const circumference = 2 * Math.PI * 34;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex h-24 w-24 items-center justify-center">
      <svg width="96" height="96" className="-rotate-90">
        <circle cx="48" cy="48" r="34" fill="none" stroke="#f0f0f0" strokeWidth="8" />
        <circle
          cx="48"
          cy="48"
          r="34"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-xl font-semibold text-neutral-900">{score}</span>
    </div>
  );
}

function ReportView({ report }: { report: PageReportRow }) {
  const checklist = (report.checklist as { label: string; passed: boolean }[] | null) ?? [];
  const stats = (report.stats as {
    avgLikes: number;
    avgComments: number;
    avgShares: number;
    postsAnalyzed: number;
    postingFrequencyDays: number | null;
  } | null) ?? null;

  return (
    <div className="space-y-6 rounded-2xl border border-neutral-200 bg-white p-6">
      <div className="flex items-center gap-6">
        <ScoreRing score={report.score ?? 0} />
        <div>
          <p className="text-sm font-semibold text-neutral-900">{report.page_name}</p>
          <p className="text-xs text-neutral-500">
            Analyzed {new Date(report.created_at).toLocaleString()}
          </p>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Avg likes/post", value: stats.avgLikes },
            { label: "Avg comments/post", value: stats.avgComments },
            { label: "Avg shares/post", value: stats.avgShares },
            {
              label: "Posting frequency",
              value: stats.postingFrequencyDays ? `Every ${stats.postingFrequencyDays.toFixed(1)}d` : "—",
            },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-neutral-50 p-3 text-center">
              <p className="text-lg font-semibold text-neutral-900">{s.value}</p>
              <p className="text-[11px] text-neutral-500">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <div>
        <p className="mb-2 text-sm font-semibold text-neutral-900">Page completeness</p>
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {checklist.map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-sm">
              {item.passed ? (
                <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
              ) : (
                <XCircle size={16} className="shrink-0 text-red-400" />
              )}
              <span className={item.passed ? "text-neutral-700" : "text-neutral-500"}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {report.recommendations && (
        <div>
          <p className="mb-2 text-sm font-semibold text-neutral-900">Recommendations</p>
          <div className="whitespace-pre-line rounded-xl bg-brand-50 p-4 text-sm text-neutral-700">
            {report.recommendations}
          </div>
        </div>
      )}
    </div>
  );
}

export function PageAnalyzer({
  organizationId,
  accounts,
  pastReports,
}: {
  organizationId: string;
  accounts: SocialAccount[];
  pastReports: PageReportRow[];
}) {
  const [state, formAction, pending] = useActionState(
    generatePageReportAction.bind(null, organizationId),
    null
  );
  const [viewingReport, setViewingReport] = useState<PageReportRow | null>(null);

  const facebookAccounts = accounts.filter((a) => a.platform === "FACEBOOK");
  const activeReport =
    (state && "success" in state && state.success ? (state.report as PageReportRow) : null) ??
    viewingReport ??
    pastReports[0] ??
    null;

  return (
    <div className="space-y-6">
      {facebookAccounts.length === 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Connect a Facebook Page under{" "}
          <a href="/dashboard/settings/social-accounts" className="underline">
            Settings → Social Media Accounts
          </a>{" "}
          to run an analysis. Page audits only work for pages you&apos;ve connected \u2014 Meta
          doesn&apos;t allow pulling this level of detail for pages you don&apos;t manage.
        </div>
      ) : (
        <form action={formAction} className="flex flex-wrap items-end gap-3 rounded-2xl border border-neutral-200 bg-white p-6">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-neutral-700">Page</label>
            <select
              name="socialAccountId"
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
            >
              {facebookAccounts.map((a) => (
                <option key={a.id} value={a.id}>{a.external_id}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {pending ? "Analyzing…" : "Generate report"}
          </button>
          {state?.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
          <p className="w-full text-xs text-neutral-400">Costs 10 wallet credits (platform-managed key) or your own OpenAI usage.</p>
        </form>
      )}

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
                  onClick={() => setViewingReport(r)}
                  className="flex w-full items-center justify-between rounded-lg border border-neutral-200 bg-white px-3 py-2 text-left text-sm hover:bg-neutral-50"
                >
                  <span className="text-neutral-700">{r.page_name}</span>
                  <span className="text-xs text-neutral-400">
                    Score {r.score} · {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
