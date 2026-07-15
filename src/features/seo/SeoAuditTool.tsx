"use client";

import { useActionState, useState, useTransition } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { runSeoAuditAction } from "./seo-audit-actions";
import { applyFixesViaGithubAction } from "./apply-fixes-actions";
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

function FixesPanel({
  organizationId,
  audit,
  hasRepo,
}: {
  organizationId: string;
  audit: SeoAuditRow;
  hasRepo: boolean;
}) {
  const [applyTitle, setApplyTitle] = useState(!!audit.suggested_title);
  const [applyMeta, setApplyMeta] = useState(!!audit.suggested_meta_description);
  const [filePath, setFilePath] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [prUrl, setPrUrl] = useState<string | null>(
    (audit.fixes_status as { prUrl?: string } | null)?.prUrl ?? null
  );

  const altSuggestions = (audit.alt_text_suggestions as { src: string; suggestedAlt: string }[] | null) ?? [];
  const hasAnyFix = audit.suggested_title || audit.suggested_meta_description || altSuggestions.length > 0;

  if (!hasAnyFix) return null;

  function buildImplementationPackage() {
    const lines: string[] = [];
    if (audit.suggested_title) lines.push(`TITLE TAG:\nChange to: ${audit.suggested_title}\n`);
    if (audit.suggested_meta_description) lines.push(`META DESCRIPTION:\nChange to: ${audit.suggested_meta_description}\n`);
    if (altSuggestions.length > 0) {
      lines.push("ALT TEXT:");
      for (const s of altSuggestions) lines.push(`  ${s.src}\n  \u2192 alt="${s.suggestedAlt}"`);
    }
    return lines.join("\n");
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6">
      <p className="mb-3 text-sm font-semibold text-neutral-900">Suggested fixes</p>

      <div className="space-y-3">
        {audit.suggested_title && (
          <label className="flex items-start gap-2 rounded-lg border border-neutral-200 p-3 text-sm">
            <input type="checkbox" checked={applyTitle} onChange={(e) => setApplyTitle(e.target.checked)} className="mt-0.5" />
            <span>
              <span className="font-medium text-neutral-900">Title \u2192</span>{" "}
              <span className="text-neutral-600">{audit.suggested_title}</span>
            </span>
          </label>
        )}
        {audit.suggested_meta_description && (
          <label className="flex items-start gap-2 rounded-lg border border-neutral-200 p-3 text-sm">
            <input type="checkbox" checked={applyMeta} onChange={(e) => setApplyMeta(e.target.checked)} className="mt-0.5" />
            <span>
              <span className="font-medium text-neutral-900">Meta description \u2192</span>{" "}
              <span className="text-neutral-600">{audit.suggested_meta_description}</span>
            </span>
          </label>
        )}
        {altSuggestions.length > 0 && (
          <div className="rounded-lg border border-neutral-200 p-3 text-sm">
            <p className="mb-1.5 font-medium text-neutral-900">Suggested alt text ({altSuggestions.length} images)</p>
            <div className="space-y-1">
              {altSuggestions.map((s) => (
                <p key={s.src} className="truncate text-xs text-neutral-500">
                  <span className="text-neutral-400">{s.src.split("/").pop()}:</span> {s.suggestedAlt}
                </p>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-neutral-400">
              Not auto-applied \u2014 matching the right file for each image is too ambiguous to do safely on a custom site.
            </p>
          </div>
        )}
      </div>

      {prUrl ? (
        <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
          Pull request opened:{" "}
          <a href={prUrl} target="_blank" rel="noreferrer" className="underline">
            {prUrl}
          </a>
        </div>
      ) : hasRepo ? (
        <div className="mt-4 space-y-2">
          <label className="block text-sm font-medium text-neutral-700">
            File path in repo containing this page&apos;s title/meta tags
          </label>
          <input
            value={filePath}
            onChange={(e) => setFilePath(e.target.value)}
            placeholder="e.g. src/pages/index.html or app/page.tsx"
            className="w-full max-w-md rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            onClick={() => {
              setError(null);
              startTransition(async () => {
                try {
                  const url = await applyFixesViaGithubAction({
                    organizationId,
                    auditId: audit.id,
                    filePath,
                    applyTitle,
                    applyMeta,
                  });
                  setPrUrl(url);
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Could not open pull request");
                }
              });
            }}
            disabled={isPending || !filePath || (!applyTitle && !applyMeta)}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {isPending ? "Opening pull request…" : "Apply via GitHub Pull Request"}
          </button>
        </div>
      ) : (
        <div className="mt-4">
          <button
            onClick={() => navigator.clipboard.writeText(buildImplementationPackage())}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Copy implementation package for your developer
          </button>
          <p className="mt-1.5 text-xs text-neutral-400">
            No repo connected \u2014 connect one under Settings → Website Repository to auto-open a PR instead.
          </p>
        </div>
      )}
    </div>
  );
}

function AuditView({
  organizationId,
  audit,
  hasRepo,
}: {
  organizationId: string;
  audit: SeoAuditRow;
  hasRepo: boolean;
}) {
  const checks = (audit.checks as { label: string; passed: boolean; detail?: string }[] | null) ?? [];
  const pagespeed = audit.pagespeed as { performanceScore: number | null; lcp: string | null; cls: string | null; inp: string | null } | null;

  return (
    <div className="space-y-4">
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

      <FixesPanel organizationId={organizationId} audit={audit} hasRepo={hasRepo} />
    </div>
  );
}

export function SeoAuditTool({
  organizationId,
  pastAudits,
  hasRepo,
}: {
  organizationId: string;
  pastAudits: SeoAuditRow[];
  hasRepo: boolean;
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

      {activeAudit && <AuditView organizationId={organizationId} audit={activeAudit} hasRepo={hasRepo} />}

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
