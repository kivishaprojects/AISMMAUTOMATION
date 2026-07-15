"use client";

import { useActionState, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { runSeoAuditAction } from "./seo-audit-actions";
import type { SeoAuditRow } from "./seo-audit-queries";

function ScoreRing({ score }: { score: number }) {
  const color = score >= 70 ? "#10b981" : score >= 40 ? "#f59e0b" : "#ef4444";
  const circumference = 2 * Math.PI * 34;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
      <svg width="96" height="96" className="-rotate-90">
        <circle cx="48" cy="48" r="34" fill="none" stroke="#f0f0f0" strokeWidth="8" />
        <circle cx="48" cy="48" r="34" fill="none" stroke={color} strokeWidth="8" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <span className="absolute text-xl font-semibold text-neutral-900">{score}</span>
    </div>
  );
}

function AuditView({ audit }: { audit: SeoAuditRow }) {
  const checks = (audit.checks as { label: string; passed: boolean; detail?: string }[] | null) ?? [];
  const pagespeed = audit.pagespeed as { performanceScore: number | null; lcp: string | null; cls: string | null; inp: string | null } | null;

  return (
    <div className="space-y-6 rounded-2xl border border-neutral-200 bg-white p-6">
      <div className="flex items-center gap-6">
        <ScoreRing score={audit.score ?? 0} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-neutral-900">{audit.url}</p>
          <p className="text-xs text-neutral-500">Audited {new Date(audit.created_at).toLocaleString()}</p>
        </div>
      </div>

      {pagespeed && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "PageSpeed score", value: pagespeed.performanceScore ?? "—" },
            { label: "LCP", value: pagespeed.lcp ?? "—" },
            { label: "CLS", value: pagespeed.cls ?? "—" },
            { label: "INP", value: pagespeed.inp ?? "—" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-neutral-50 p-3 text-center">
              <p className="text-lg font-semibold text-neutral-900">{s.value}</p>
              <p className="text-[11px] text-neutral-500">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <div>
        <p className="mb-2 text-sm font-semibold text-neutral-900">On-page checks</p>
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {checks.map((item) => (
            <div key={item.label} className="flex items-start gap-2 text-sm">
              {item.passed ? (
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-500" />
              ) : (
                <XCircle size={16} className="mt-0.5 shrink-0 text-red-400" />
              )}
              <span>
                <span className={item.passed ? "text-neutral-700" : "text-neutral-500"}>{item.label}</span>
                {item.detail && <span className="ml-1 text-xs text-neutral-400">({item.detail})</span>}
              </span>
            </div>
          ))}
        </div>
      </div>

      {audit.recommendations && (
        <div>
          <p className="mb-2 text-sm font-semibold text-neutral-900">Recommendations</p>
          <div className="whitespace-pre-line rounded-xl bg-brand-50 p-4 text-sm text-neutral-700">
            {audit.recommendations}
          </div>
        </div>
      )}
    </div>
  );
}

export function SeoAuditTool({
  organizationId,
  pastAudits,
}: {
  organizationId: string;
  pastAudits: SeoAuditRow[];
}) {
  const [state, formAction, pending] = useActionState(runSeoAuditAction.bind(null, organizationId), null);
  const [viewing, setViewing] = useState<SeoAuditRow | null>(null);

  const activeAudit =
    (state && "success" in state && state.success ? (state.audit as SeoAuditRow) : null) ??
    viewing ??
    pastAudits[0] ??
    null;

  return (
    <div className="space-y-6">
      <form action={formAction} className="flex flex-wrap items-end gap-3 rounded-2xl border border-neutral-200 bg-white p-6">
        <div className="flex-1 min-w-[240px]">
          <label className="block text-sm font-medium text-neutral-700">Page URL</label>
          <input
            name="url"
            type="url"
            required
            placeholder="https://example.com/blog/some-post"
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {pending ? "Auditing…" : "Run audit"}
        </button>
        {state?.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
        <p className="w-full text-xs text-neutral-400">Costs 10 wallet credits (platform-managed key) or your own OpenAI usage.</p>
      </form>

      {activeAudit && <AuditView audit={activeAudit} />}

      {pastAudits.length > 1 && (
        <div>
          <p className="mb-2 text-sm font-semibold text-neutral-900">Past audits</p>
          <div className="space-y-1.5">
            {pastAudits
              .filter((a) => a.id !== activeAudit?.id)
              .map((a) => (
                <button
                  key={a.id}
                  onClick={() => setViewing(a)}
                  className="flex w-full items-center justify-between rounded-lg border border-neutral-200 bg-white px-3 py-2 text-left text-sm hover:bg-neutral-50"
                >
                  <span className="truncate text-neutral-700">{a.url}</span>
                  <span className="shrink-0 text-xs text-neutral-400">
                    Score {a.score} · {new Date(a.created_at).toLocaleDateString()}
                  </span>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
