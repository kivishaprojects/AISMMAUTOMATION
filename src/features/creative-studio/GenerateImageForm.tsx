"use client";

import { useActionState } from "react";
import { generateImageAction } from "./actions";
import type { BrandKit } from "@/features/brand-kit/queries";

export function GenerateImageForm({
  organizationId,
  brandKits,
}: {
  organizationId: string;
  brandKits: BrandKit[];
}) {
  const [state, formAction, pending] = useActionState(
    generateImageAction.bind(null, organizationId),
    null
  );

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6">
      <div>
        <label className="block text-sm font-medium text-neutral-700">
          What do you want to create?
        </label>
        <textarea
          name="prompt"
          required
          rows={3}
          placeholder="e.g. A festive Diwali promotional banner for a sweets shop, warm gold and maroon tones, diyas and rangoli in the background"
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-neutral-700">
            Brand kit
          </label>
          <select
            name="brandKitId"
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
          >
            <option value="">None</option>
            {brandKits.map((kit) => (
              <option key={kit.id} value={kit.id}>{kit.name}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-neutral-400">
            Steers colors and tone toward this brand.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700">
            Shape
          </label>
          <select
            name="aspectRatio"
            defaultValue="square"
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
          >
            <option value="square">Square (1:1) — feed post</option>
            <option value="portrait">Portrait — story/reel</option>
            <option value="landscape">Landscape — banner</option>
          </select>
        </div>
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
      >
        {pending ? "Generating… (this can take 20-30s)" : "Generate image"}
      </button>
    </form>
  );
}
