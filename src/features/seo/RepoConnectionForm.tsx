"use client";

import { useActionState } from "react";
import { connectRepoAction, disconnectRepoAction } from "./repo-actions";
import type { RepoConnection } from "./repo-queries";

export function RepoConnectionForm({
  organizationId,
  connections,
}: {
  organizationId: string;
  connections: RepoConnection[];
}) {
  const [state, formAction, pending] = useActionState(connectRepoAction.bind(null, organizationId), null);

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-neutral-700">Repo owner</label>
            <input
              name="repoOwner"
              required
              placeholder="e.g. yourusername"
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700">Repo name</label>
            <input
              name="repoName"
              required
              placeholder="e.g. my-website"
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Personal access token</label>
          <input
            name="token"
            type="password"
            required
            placeholder="ghp_..."
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
          />
          <p className="mt-1 text-xs text-neutral-400">
            GitHub → Settings → Developer settings → Fine-grained tokens. Grant this repo only,
            with Contents (read/write) and Pull requests (read/write) permissions.
          </p>
        </div>
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        {state && "success" in state && state.success && <p className="text-sm text-green-600">Connected.</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {pending ? "Verifying…" : "Connect repo"}
        </button>
      </form>

      {connections.length > 0 && (
        <div className="space-y-2">
          {connections.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-3 py-2">
              <span className="text-sm text-neutral-700">{c.repo_owner}/{c.repo_name}</span>
              <button
                onClick={() => {
                  if (confirm("Disconnect this repo?")) disconnectRepoAction(c.id);
                }}
                className="text-xs font-medium text-red-500 hover:text-red-700"
              >
                Disconnect
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
