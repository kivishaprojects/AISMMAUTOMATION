"use client";

import { useState } from "react";
import { BrandKitForm } from "./BrandKitForm";
import { LogoUploader } from "./LogoUploader";
import { createBrandKitAction, updateBrandKitAction, deleteBrandKitAction } from "./actions";
import type { BrandKit } from "./queries";

export function BrandKitManager({
  organizationId,
  brandKits,
}: {
  organizationId: string;
  brandKits: BrandKit[];
}) {
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">Brand Kit</h1>
        {!creating && (
          <button
            onClick={() => setCreating(true)}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            + New brand kit
          </button>
        )}
      </div>

      {creating && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold text-neutral-900">
            New brand kit
          </h2>
          <BrandKitForm
            action={createBrandKitAction.bind(null, organizationId)}
            onDone={() => setCreating(false)}
          />
        </div>
      )}

      {brandKits.length === 0 && !creating && (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center">
          <p className="text-sm text-neutral-500">
            No brand kits yet. Create one to give the AI Creative Studio your
            colors, fonts, and tone of voice.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {brandKits.map((kit) => {
          const colors = (kit.colors as { primary?: string; secondary?: string; accent?: string } | null) ?? {};
          const fonts = (kit.fonts as { heading?: string; body?: string } | null) ?? {};
          const isEditing = editingId === kit.id;

          return (
            <div key={kit.id} className="rounded-2xl border border-neutral-200 bg-white p-6">
              {isEditing ? (
                <>
                  <h2 className="mb-4 text-sm font-semibold text-neutral-900">
                    Edit {kit.name}
                  </h2>
                  <div className="mb-4">
                    <LogoUploader
                      organizationId={organizationId}
                      brandKitId={kit.id}
                      currentLogoUrl={kit.logo_url}
                    />
                  </div>
                  <BrandKitForm
                    action={updateBrandKitAction.bind(null, kit.id)}
                    existing={kit}
                    onDone={() => setEditingId(null)}
                  />
                  <button
                    onClick={() => setEditingId(null)}
                    className="mt-2 w-full text-center text-sm text-neutral-500 hover:text-neutral-700"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {kit.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={kit.logo_url}
                          alt={kit.name}
                          className="h-10 w-10 rounded-lg border border-neutral-200 object-contain"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-lg border border-dashed border-neutral-300" />
                      )}
                      <h2 className="font-semibold text-neutral-900">{kit.name}</h2>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingId(kit.id)}
                        className="text-xs font-medium text-neutral-600 hover:text-neutral-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${kit.name}"?`)) {
                            deleteBrandKitAction(kit.id);
                          }
                        }}
                        className="text-xs font-medium text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    {[colors.primary, colors.secondary, colors.accent].map(
                      (c, i) =>
                        c && (
                          <div
                            key={i}
                            className="h-6 w-6 rounded-full border border-neutral-200"
                            style={{ backgroundColor: c }}
                            title={c}
                          />
                        )
                    )}
                  </div>

                  <p className="mt-3 text-xs text-neutral-500">
                    {fonts.heading ?? "—"} / {fonts.body ?? "—"}
                  </p>

                  {kit.tone_of_voice && (
                    <p className="mt-2 line-clamp-2 text-sm text-neutral-600">
                      {kit.tone_of_voice}
                    </p>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
