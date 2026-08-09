"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Play, CheckCircle2, Wrench } from "lucide-react";
import { runAiScanAction, executeSuggestionAction } from "./ai-scan-actions";
import { ChangesQueue } from "./ChangesQueue";
import type { SiteChange } from "./site-changes-queries";
import type { AiScan } from "./ai-scan-queries";
import type { ScanScores, ScanSuggestion } from "@/lib/ai/ai-scan";

const CATEGORY_LABELS: Record<ScanSuggestion["category"], string> = {
  TECHNICAL: "Technical SEO",
  ON_PAGE: "On-Page",
  CONTENT: "Content",
  SCHEMA: "Structured Data",
  GEO: "GEO / AI Search",
  PERFORMANCE: "Performance",
};

const IMPACT_STYLES: Record<ScanSuggestion["impact"], string> = {
  HIGH: "bg-red-100 text-red-700",
  MEDIUM: "bg-amber-100 text-amber-700",
  LOW: "bg-neutral-100 text-neutral-600",
};

function ScoreBar({ label, value }: { label: string; value: number }) {
  const tone = value >= 75 ? "bg-emerald-500" : value >= 50 ? "bg-amber-500" : "bg-red-500";
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-neutral-600">{label}</span>
        <span className="font-semibold text-neutral-900">{value}</span>
      </div>
      <div className="mt-1 h-1.5 rounded-full bg-neutral-100">
        <div className={`h-1.5 rounded-full ${tone}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function SuggestionCard({
  organizationId,
  scanId,
  suggestion,
  hasRepo,
  batchChanges,
}: {
  organizationId: string;
  scanId: string;
  suggestion: ScanSuggestion;
  hasRepo: boolean;
  batchChanges: SiteChange[] | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [changes, setChanges] = useState<SiteChange[] | null>(batchChanges);
  const [open, setOpen] = useState(false);
  const executed = !!suggestion.executed_batch_id || !!changes;
  const executable = suggestion.execute_type !== "MANUAL";

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <button onClick={() => setOpen(!open)} className="flex w-full items-start justify-between gap-3 text-left">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${IMPACT_STYLES[suggestion.impact]}`}>
              {suggestion.impact}
            </span>
            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-medium text-brand-700">
              {CATEGORY_LABELS[suggestion.category] ?? suggestion.category}
            </span>
            {executed && (
              <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                <CheckCircle2 size={10} /> Queued
              </span>
            )}
          </div>
          <p className="mt-1.5 text-sm font-semibold text-neutral-900">{suggestion.title}</p>
          <p className="mt-0.5 line-clamp-2 text-xs text-neutral-500">{suggestion.problem}</p>
        </div>
        <span className="shrink-0 text-xs text-neutral-400">{open ? "Hide" : "Details"}</span>
      </button>

      {open && (
        <div className="mt-3 space-y-2 border-t border-neutral-100 pt-3 text-xs text-neutral-600">
          <p><span className="font-semibold text-neutral-900">Why it matters:</span> {suggestion.why_it_matters}</p>
          <p><span className="font-semibold text-neutral-900">Recommendation:</span> {suggestion.recommendation}</p>
          <p><span className="font-semibold text-neutral-900">Expected outcome:</span> {suggestion.expected_outcome}</p>
          {suggestion.affected_urls.length > 0 && (
            <p className="break-all">
              <span className="font-semibold text-neutral-900">Affected:</span> {suggestion.affected_urls.join(", ")}
            </p>
          )}
          <p>
            <span className="font-semibold text-neutral-900">Difficulty:</span> {suggestion.difficulty}
            {" · "}
            <span className="font-semibold text-neutral-900">Execution:</span>{" "}
            {executable ? "AI can generate this fix" : "Manual implementation"}
          </p>
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        {executable && !executed && (
          <button
            onClick={() => {
              setError(null);
              startTransition(async () => {
                const result = await executeSuggestionAction(organizationId, scanId, suggestion.id);
                if (result.error) setError(result.error);
                else if (result.changes) setChanges(result.changes);
              });
            }}
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            <Play size={12} />
            {isPending ? "Generating fix…" : "Execute"}
          </button>
        )}
        {!executable && (
          <span className="flex items-center gap-1.5 rounded-lg bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-500">
            <Wrench size={12} /> Manual
          </span>
        )}
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {changes && changes.length > 0 && (
        <div className="mt-3 border-t border-neutral-100 pt-3">
          <p className="mb-2 text-xs font-semibold text-neutral-900">
            Proposed changes — review, edit, and deploy as a Pull Request:
          </p>
          <ChangesQueue organizationId={organizationId} changes={changes} hasRepo={hasRepo} />
        </div>
      )}
    </div>
  );
}

function ScanResult({
  organizationId,
  scan,
  hasRepo,
  executedBatches,
}: {
  organizationId: string;
  scan: AiScan;
  hasRepo: boolean;
  executedBatches: Record<string, SiteChange[]>;
}) {
  const scores = scan.scores as unknown as ScanScores;
  const suggestions = (scan.suggestions as unknown as ScanSuggestion[]) ?? [];
  const overallTone =
    scores.overall >= 75 ? "text-emerald-600" : scores.overall >= 50 ? "text-amber-600" : "text-red-600";

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-neutral-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="break-all text-sm font-semibold text-neutral-900">{scan.site_url}</p>
            <p className="text-xs text-neutral-500">
              {scan.pages_crawled} pages scanned · {new Date(scan.created_at).toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className={`text-3xl font-bold ${overallTone}`}>{scores.overall}</p>
            <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">SEO Health</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <ScoreBar label="Technical" value={scores.technical} />
          <ScoreBar label="On-Page" value={scores.onPage} />
          <ScoreBar label="Content" value={scores.content} />
          <ScoreBar label="Structured Data" value={scores.structuredData} />
          <ScoreBar label="GEO Readiness" value={scores.geoReadiness} />
        </div>

        {scan.summary && <p className="mt-4 text-sm text-neutral-600">{scan.summary}</p>}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-neutral-900">
          Review & Suggestions ({suggestions.length})
        </h2>
        <p className="mt-0.5 text-xs text-neutral-500">
          Ordered by impact. Execute generates the concrete fix into the changes queue for your approval —
          nothing touches your site without you deploying it.
        </p>
        <div className="mt-3 space-y-3">
          {suggestions.map((s) => (
            <SuggestionCard
              key={s.id}
              organizationId={organizationId}
              scanId={scan.id}
              suggestion={s}
              hasRepo={hasRepo}
              batchChanges={s.executed_batch_id ? executedBatches[s.executed_batch_id] ?? null : null}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function AiScanTool({
  organizationId,
  hasRepo,
  initialScans,
  executedBatches,
}: {
  organizationId: string;
  hasRepo: boolean;
  initialScans: AiScan[];
  executedBatches: Record<string, SiteChange[]>;
}) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    async (prev: unknown, formData: FormData) => {
      const result = await runAiScanAction(organizationId, prev, formData);
      if (result && "success" in result && result.success) router.refresh();
      return result;
    },
    null
  );
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null);

  const activeScan =
    initialScans.find((s) => s.id === selectedScanId) ?? initialScans[0] ?? null;

  return (
    <div className="space-y-6">
      <form action={formAction} className="rounded-2xl border border-neutral-200 bg-white p-5">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            name="url"
            placeholder="https://yourwebsite.com"
            required
            className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            <Sparkles size={14} />
            {isPending ? "Scanning… (up to 2 min)" : "Run AI Scan"}
          </button>
        </div>
        <textarea
          name="businessContext"
          placeholder="Optional context: business name, industry, target market, competitors, target keywords…"
          rows={2}
          className="mt-3 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
        />
        {state && "error" in state && state.error && (
          <p className="mt-2 text-sm text-red-600">{state.error}</p>
        )}
      </form>

      {initialScans.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {initialScans.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedScanId(s.id)}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                activeScan?.id === s.id
                  ? "border-brand-600 bg-brand-50 text-brand-700"
                  : "border-neutral-200 text-neutral-500 hover:bg-neutral-50"
              }`}
            >
              {new URL(s.site_url).hostname} · {new Date(s.created_at).toLocaleDateString()}
            </button>
          ))}
        </div>
      )}

      {activeScan ? (
        <ScanResult
          organizationId={organizationId}
          scan={activeScan}
          hasRepo={hasRepo}
          executedBatches={executedBatches}
        />
      ) : (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center">
          <p className="text-sm text-neutral-500">
            No scans yet. Enter your website above — AI Scan crawls your site (sitemap, robots.txt, and up
            to 8 representative pages), scores its SEO and GEO health, and produces suggestions you can
            execute with one click.
          </p>
        </div>
      )}
    </div>
  );
}
