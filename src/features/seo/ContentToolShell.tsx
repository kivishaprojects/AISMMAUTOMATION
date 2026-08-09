"use client";

import { useActionState, useState } from "react";
import { Copy, Trash2, Check } from "lucide-react";
import { generateContentDocAction, deleteContentDocAction } from "./content-tools-actions";
import type { Tables } from "@/lib/supabase/database.types";

export type ContentDoc = Tables<"content_docs">;

export type FieldSpec = {
  name: string;
  label: string;
  placeholder?: string;
  textarea?: boolean;
  required?: boolean;
  hint?: string;
};

/**
 * Shared UI shell for the document-producing SEO tools (Content Studio,
 * GEO Optimizer, Internal Linking, Competitor Intelligence): one form spec,
 * a markdown-ish result pane, copy button, and persistent history.
 */
export function ContentToolShell({
  organizationId,
  docType,
  docTypeOptions,
  fields,
  submitLabel,
  pendingLabel,
  initialDocs,
  costNote = "Costs 5 wallet credits (platform-managed key) or your own OpenAI usage.",
}: {
  organizationId: string;
  docType: string;
  docTypeOptions?: { value: string; label: string }[];
  fields: FieldSpec[];
  submitLabel: string;
  pendingLabel: string;
  initialDocs: ContentDoc[];
  costNote?: string;
}) {
  const [docs, setDocs] = useState<ContentDoc[]>(initialDocs);
  const [activeId, setActiveId] = useState<string | null>(initialDocs[0]?.id ?? null);
  const [copied, setCopied] = useState(false);
  const [state, formAction, pending] = useActionState(
    async (prev: unknown, formData: FormData) => {
      const result = await generateContentDocAction(organizationId, prev, formData);
      if (result && "doc" in result && result.doc) {
        setDocs((d) => [result.doc as ContentDoc, ...d]);
        setActiveId((result.doc as ContentDoc).id);
      }
      return result;
    },
    null
  );

  const active = docs.find((d) => d.id === activeId) ?? null;

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6">
        {docTypeOptions ? (
          <div>
            <label className="block text-sm font-medium text-neutral-700">What do you want to create?</label>
            <select
              name="docType"
              defaultValue={docType}
              className="mt-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
            >
              {docTypeOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        ) : (
          <input type="hidden" name="docType" value={docType} />
        )}
        {fields.map((f) => (
          <div key={f.name}>
            <label className="block text-sm font-medium text-neutral-700">{f.label}</label>
            {f.hint && <p className="text-xs text-neutral-400">{f.hint}</p>}
            {f.textarea ? (
              <textarea
                name={f.name}
                required={f.required}
                rows={4}
                placeholder={f.placeholder}
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
              />
            ) : (
              <input
                name={f.name}
                required={f.required}
                placeholder={f.placeholder}
                className="mt-1 w-full max-w-xl rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
              />
            )}
          </div>
        ))}
        {state && "error" in state && state.error && <p className="text-sm text-red-600">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {pending ? pendingLabel : submitLabel}
        </button>
        <p className="text-xs text-neutral-400">{costNote}</p>
      </form>

      {docs.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr]">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">History</p>
            {docs.map((d) => (
              <div key={d.id} className="group flex items-center gap-1">
                <button
                  onClick={() => setActiveId(d.id)}
                  className={`min-w-0 flex-1 rounded-lg px-3 py-2 text-left text-xs font-medium transition ${
                    d.id === activeId ? "bg-brand-50 text-brand-700" : "text-neutral-600 hover:bg-neutral-100"
                  }`}
                >
                  <span className="block truncate">{d.title}</span>
                  <span className="text-[10px] font-normal text-neutral-400">
                    {new Date(d.created_at).toLocaleString()}
                  </span>
                </button>
                <button
                  onClick={() => {
                    setDocs((prev) => prev.filter((x) => x.id !== d.id));
                    if (activeId === d.id) setActiveId(null);
                    deleteContentDocAction(d.id);
                  }}
                  className="hidden shrink-0 text-neutral-300 hover:text-red-500 group-hover:block"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>

          {active && (
            <div className="rounded-2xl border border-neutral-200 bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-neutral-900">{active.title}</p>
                  {active.input_context && (
                    <p className="mt-0.5 break-all text-xs text-neutral-400">{active.input_context}</p>
                  )}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(active.content);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg border border-neutral-300 px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <pre className="mt-4 max-h-[36rem] overflow-auto whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-neutral-700">
                {active.content}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
