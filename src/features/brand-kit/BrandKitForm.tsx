"use client";

import { useActionState, useEffect } from "react";
import { FONT_OPTIONS } from "./schema";
import type { BrandKit } from "./queries";

type Props = {
  action: (prevState: unknown, formData: FormData) => Promise<{ error?: string; success?: boolean }>;
  existing?: BrandKit;
  onDone?: () => void;
};

export function BrandKitForm({ action, existing, onDone }: Props) {
  const [state, formAction, pending] = useActionState(action, null);

  useEffect(() => {
    if (state && "success" in state && state.success) {
      onDone?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const colors = (existing?.colors as { primary?: string; secondary?: string; accent?: string } | null) ?? {};
  const fonts = (existing?.fonts as { heading?: string; body?: string } | null) ?? {};

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-neutral-700">
          Brand kit name
        </label>
        <input
          name="name"
          defaultValue={existing?.name ?? ""}
          required
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
          placeholder="e.g. Main Brand, Diwali Campaign"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { name: "primaryColor", label: "Primary", value: colors.primary ?? "#111827" },
          { name: "secondaryColor", label: "Secondary", value: colors.secondary ?? "#6B7280" },
          { name: "accentColor", label: "Accent", value: colors.accent ?? "#F59E0B" },
        ].map((c) => (
          <div key={c.name}>
            <label className="block text-sm font-medium text-neutral-700">
              {c.label}
            </label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="color"
                name={c.name}
                defaultValue={c.value}
                className="h-9 w-9 cursor-pointer rounded border border-neutral-300"
              />
              <input
                type="text"
                defaultValue={c.value}
                readOnly
                className="w-full rounded-lg border border-neutral-300 px-2 py-1.5 text-xs text-neutral-500"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-neutral-700">
            Heading font
          </label>
          <select
            name="headingFont"
            defaultValue={fonts.heading ?? FONT_OPTIONS[0]}
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">
            Body font
          </label>
          <select
            name="bodyFont"
            defaultValue={fonts.body ?? FONT_OPTIONS[0]}
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700">
          Tone of voice
        </label>
        <textarea
          name="toneOfVoice"
          defaultValue={existing?.tone_of_voice ?? ""}
          rows={3}
          maxLength={500}
          placeholder="e.g. Friendly, confident, and a little playful. Avoid corporate jargon."
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
        />
        <p className="mt-1 text-xs text-neutral-400">
          Used to steer AI-generated captions, blogs, and ad copy.
        </p>
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-neutral-900 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50"
      >
        {pending ? "Saving…" : existing ? "Save changes" : "Create brand kit"}
      </button>
    </form>
  );
}
