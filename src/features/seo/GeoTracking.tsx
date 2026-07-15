"use client";

import { useActionState, useState, useTransition } from "react";
import { CheckCircle2, XCircle, Trash2 } from "lucide-react";
import { addTrackedPromptAction, deleteTrackedPromptAction, runGeoCheckAction } from "./geo-actions";
import type { TrackedPromptWithHistory } from "./geo-queries";

function PromptCard({
  organizationId,
  prompt,
}: {
  organizationId: string;
  prompt: TrackedPromptWithHistory;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-neutral-900">&ldquo;{prompt.prompt}&rdquo;</p>
          <p className="mt-0.5 text-xs text-neutral-500">Watching for: {prompt.brand_name}</p>
        </div>
        <button
          onClick={() => {
            if (confirm("Stop tracking this prompt?")) deleteTrackedPromptAction(prompt.id);
          }}
          className="shrink-0 text-neutral-400 hover:text-red-500"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="mt-3 flex items-center gap-3">
        {prompt.mentionRate !== null ? (
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              prompt.mentionRate >= 50 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
            }`}
          >
            Mentioned in {prompt.mentionRate}% of last {prompt.history.length} checks
          </span>
        ) : (
          <span className="text-xs text-neutral-400">No checks yet</span>
        )}
        <button
          onClick={() => {
            setError(null);
            startTransition(async () => {
              try {
                await runGeoCheckAction(organizationId, prompt.id);
              } catch (err) {
                setError(err instanceof Error ? err.message : "Check failed");
              }
            });
          }}
          disabled={isPending}
          className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
        >
          {isPending ? "Checking…" : "Run check now"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {prompt.history.length > 0 && (
        <div className="mt-3">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-xs font-medium text-neutral-500 hover:text-neutral-700"
          >
            {expanded ? "Hide history" : "Show history"}
          </button>
          {expanded && (
            <div className="mt-2 space-y-2">
              {prompt.history.map((h) => (
                <div key={h.id} className="flex items-start gap-2 rounded-lg bg-neutral-50 p-2.5 text-xs">
                  {h.mentioned ? (
                    <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-500" />
                  ) : (
                    <XCircle size={14} className="mt-0.5 shrink-0 text-red-400" />
                  )}
                  <div className="min-w-0">
                    <p className="text-neutral-400">
                      {new Date(h.checked_at).toLocaleString()} · {h.provider}
                    </p>
                    {h.response_snippet && (
                      <p className="mt-0.5 line-clamp-2 text-neutral-600">{h.response_snippet}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function GeoTracking({
  organizationId,
  prompts,
}: {
  organizationId: string;
  prompts: TrackedPromptWithHistory[];
}) {
  const [state, formAction, pending] = useActionState(
    addTrackedPromptAction.bind(null, organizationId),
    null
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-indigo-100 bg-brand-50 p-4 text-sm text-neutral-700">
        Checks run against OpenAI&apos;s model only right now. Adding Perplexity, Gemini, or Google
        AI Overview tracking needs their respective API keys \u2014 tell me when you have one and I&apos;ll wire it in.
      </div>

      <form action={formAction} className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6">
        <div>
          <label className="block text-sm font-medium text-neutral-700">Prompt to track</label>
          <input
            name="prompt"
            required
            placeholder="e.g. best digital marketing agency in Ahmedabad"
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Brand/client name to watch for</label>
          <input
            name="brandName"
            required
            placeholder="e.g. Jupiter Technologies"
            className="mt-1 w-full max-w-xs rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
          />
        </div>
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {pending ? "Adding…" : "Track this prompt"}
        </button>
        <p className="text-xs text-neutral-400">Each check costs 2 wallet credits (platform-managed key) or your own OpenAI usage.</p>
      </form>

      {prompts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center">
          <p className="text-sm text-neutral-500">No prompts tracked yet. Add one above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {prompts.map((p) => (
            <PromptCard key={p.id} organizationId={organizationId} prompt={p} />
          ))}
        </div>
      )}
    </div>
  );
}
