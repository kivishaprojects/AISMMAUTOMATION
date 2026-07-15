"use client";

import { useState } from "react";
import type { SocialAccount } from "@/features/scheduler/social-queries";

export function PageSelector({ accounts }: { accounts: SocialAccount[] }) {
  const [selected, setSelected] = useState<string[]>([accounts[0]?.id].filter(Boolean));

  return (
    <div>
      <input type="hidden" name="socialAccountIds" value={selected.join(",")} />
      <label className="block text-sm font-medium text-neutral-700">Post to</label>
      <div className="mt-1 space-y-1">
        {accounts.map((acc) => (
          <label
            key={acc.id}
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-300 px-3 py-2 text-sm has-[:checked]:border-brand-600"
          >
            <input
              type="checkbox"
              checked={selected.includes(acc.id)}
              onChange={(e) =>
                setSelected((prev) =>
                  e.target.checked ? [...prev, acc.id] : prev.filter((id) => id !== acc.id)
                )
              }
            />
            {acc.platform} — {acc.external_id}
          </label>
        ))}
      </div>
    </div>
  );
}

export function PublishOptions() {
  const [mode, setMode] = useState<"now" | "schedule">("now");

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-lg border border-neutral-300 px-3 py-2 text-sm has-[:checked]:border-brand-600">
          <input
            type="radio"
            name="mode"
            value="now"
            checked={mode === "now"}
            onChange={() => setMode("now")}
          />
          Publish now
        </label>
        <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-lg border border-neutral-300 px-3 py-2 text-sm has-[:checked]:border-brand-600">
          <input
            type="radio"
            name="mode"
            value="schedule"
            checked={mode === "schedule"}
            onChange={() => setMode("schedule")}
          />
          Schedule for later
        </label>
      </div>
      {mode === "schedule" && (
        <input
          type="datetime-local"
          name="scheduledFor"
          required
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
        />
      )}
      {mode === "now" && (
        <p className="text-xs text-neutral-400">
          Video posts to Instagram can take up to a couple minutes to process on their end \u2014
          this may take a moment before you see the result.
        </p>
      )}
    </div>
  );
}
