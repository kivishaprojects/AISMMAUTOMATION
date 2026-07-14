"use client";

import { useActionState, useState } from "react";
import { saveApiKeyModeAction } from "./api-keys-actions";
import type { OrgIntegration } from "./api-keys-queries";

export function ApiKeyForm({
  organizationId,
  provider,
  label,
  existing,
}: {
  organizationId: string;
  provider: string;
  label: string;
  existing: OrgIntegration | null;
}) {
  const [state, formAction, pending] = useActionState(
    saveApiKeyModeAction.bind(null, organizationId, provider),
    null
  );
  const [mode, setMode] = useState(existing?.mode ?? "MANAGED");

  return (
    <form action={formAction} className="rounded-2xl border border-neutral-200 bg-white p-6">
      <h2 className="text-sm font-semibold text-neutral-900">{label}</h2>
      <p className="mt-1 text-xs text-neutral-500">
        Use AI Marketing OS&apos;s shared key (usage counts toward your plan),
        or bring your own key (billed directly by the provider).
      </p>

      <div className="mt-4 flex gap-3">
        <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-lg border border-neutral-300 px-3 py-2 text-sm has-[:checked]:border-neutral-900">
          <input
            type="radio"
            name="mode"
            value="MANAGED"
            checked={mode === "MANAGED"}
            onChange={() => setMode("MANAGED")}
          />
          Platform-managed
        </label>
        <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-lg border border-neutral-300 px-3 py-2 text-sm has-[:checked]:border-neutral-900">
          <input
            type="radio"
            name="mode"
            value="CUSTOM"
            checked={mode === "CUSTOM"}
            onChange={() => setMode("CUSTOM")}
          />
          My own key
        </label>
      </div>

      {mode === "CUSTOM" && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-neutral-700">API key</label>
          <input
            type="password"
            name="apiKey"
            placeholder={existing?.mode === "CUSTOM" ? "•••••••••••••••• (saved)" : "sk-..."}
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
          />
        </div>
      )}

      {state?.error && <p className="mt-3 text-sm text-red-600">{state.error}</p>}
      {state && "success" in state && state.success && (
        <p className="mt-3 text-sm text-green-600">Saved.</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-4 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
