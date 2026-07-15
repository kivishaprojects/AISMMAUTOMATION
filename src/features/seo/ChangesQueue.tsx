"use client";

import { useState, useTransition } from "react";
import {
  updateSiteChangeAction,
  updateSiteChangeFilePathAction,
  deleteSiteChangeAction,
  regenerateSiteChangeAction,
  deploySiteChangesAction,
} from "./site-changes-actions";
import type { SiteChange } from "./site-changes-queries";

function ChangeRow({
  organizationId,
  change,
  selected,
  onToggle,
}: {
  organizationId: string;
  change: SiteChange;
  selected: boolean;
  onToggle: (id: string, checked: boolean) => void;
}) {
  const [value, setValue] = useState(change.proposed_value);
  const [filePath, setFilePath] = useState(change.file_path ?? "");
  const [isPending, startTransition] = useTransition();
  const [deleted, setDeleted] = useState(false);

  if (deleted) return null;
  const isDeployed = change.status === "DEPLOYED";

  return (
    <div className={`rounded-xl border p-4 ${isDeployed ? "border-emerald-200 bg-emerald-50/40" : "border-neutral-200 bg-white"}`}>
      <div className="flex items-start gap-3">
        {!isDeployed && (
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => onToggle(change.id, e.target.checked)}
            className="mt-1"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-neutral-900">{change.label}</p>
            <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-500">
              {change.change_type}
            </span>
          </div>

          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={() => {
              if (value !== change.proposed_value) startTransition(() => updateSiteChangeAction(change.id, value));
            }}
            disabled={isDeployed}
            rows={value.split("\n").length > 3 ? 5 : 2}
            className="mt-2 w-full rounded-lg border border-neutral-300 px-3 py-2 font-mono text-xs focus:border-brand-600 focus:outline-none disabled:bg-neutral-50"
          />

          {!isDeployed && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input
                value={filePath}
                onChange={(e) => setFilePath(e.target.value)}
                onBlur={() => {
                  if (filePath !== (change.file_path ?? "")) startTransition(() => updateSiteChangeFilePathAction(change.id, filePath));
                }}
                placeholder="File path in repo (e.g. app/page.tsx)"
                className="w-64 rounded-lg border border-neutral-300 px-2 py-1 text-xs focus:border-brand-600 focus:outline-none"
              />
              <button
                onClick={() => startTransition(() => regenerateSiteChangeAction(organizationId, change.id))}
                disabled={isPending}
                className="rounded-lg border border-neutral-300 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
              >
                Regenerate
              </button>
              <button
                onClick={() => {
                  setDeleted(true);
                  deleteSiteChangeAction(change.id);
                }}
                className="text-xs font-medium text-red-500 hover:text-red-700"
              >
                Delete
              </button>
            </div>
          )}

          {isDeployed && change.pr_url && (
            <a href={change.pr_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-medium text-blue-600 underline">
              View pull request
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export function ChangesQueue({
  organizationId,
  changes,
  hasRepo,
}: {
  organizationId: string;
  changes: SiteChange[];
  hasRepo: boolean;
}) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(changes.filter((c) => c.status !== "DEPLOYED").map((c) => c.id))
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [prUrl, setPrUrl] = useState<string | null>(null);

  if (changes.length === 0) return null;

  function toggle(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  const pending = changes.filter((c) => c.status !== "DEPLOYED");
  const deployed = changes.filter((c) => c.status === "DEPLOYED");

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {pending.map((c) => (
          <ChangeRow key={c.id} organizationId={organizationId} change={c} selected={selected.has(c.id)} onToggle={toggle} />
        ))}
      </div>

      {pending.length > 0 && (
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          {!hasRepo ? (
            <p className="text-sm text-neutral-600">
              No GitHub repo connected \u2014 connect one under{" "}
              <a href="/dashboard/settings/website-repo" className="underline">Settings → Website Repository</a>{" "}
              to deploy these as a Pull Request.
            </p>
          ) : prUrl ? (
            <p className="text-sm text-emerald-700">
              Pull request opened:{" "}
              <a href={prUrl} target="_blank" rel="noreferrer" className="underline">{prUrl}</a>
            </p>
          ) : (
            <>
              {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
              <button
                onClick={() => {
                  setError(null);
                  startTransition(async () => {
                    try {
                      const url = await deploySiteChangesAction(organizationId, [...selected]);
                      setPrUrl(url);
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Could not deploy changes");
                    }
                  });
                }}
                disabled={isPending || selected.size === 0}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {isPending ? "Opening pull request…" : `Deploy ${selected.size} selected change${selected.size === 1 ? "" : "s"}`}
              </button>
            </>
          )}
        </div>
      )}

      {deployed.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Deployed</p>
          <div className="space-y-2">
            {deployed.map((c) => (
              <ChangeRow key={c.id} organizationId={organizationId} change={c} selected={false} onToggle={toggle} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
