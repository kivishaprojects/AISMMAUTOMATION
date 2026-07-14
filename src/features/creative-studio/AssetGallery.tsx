"use client";

import { deleteAssetAction } from "./actions";
import type { GeneratedAsset } from "./queries";

export function AssetGallery({ assets }: { assets: GeneratedAsset[] }) {
  if (assets.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center">
        <p className="text-sm text-neutral-500">
          No images yet. Generate your first one above.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {assets.map((asset) => {
        const meta = (asset.metadata as { prompt?: string } | null) ?? {};
        return (
          <div key={asset.id} className="group relative overflow-hidden rounded-xl border border-neutral-200 bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={asset.url}
              alt={meta.prompt ?? "Generated image"}
              className="aspect-square w-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 transition group-hover:opacity-100">
              <p className="line-clamp-2 text-xs text-white">{meta.prompt}</p>
            </div>
            <button
              onClick={() => {
                if (confirm("Delete this image?")) {
                  deleteAssetAction(asset.id, asset.storage_path);
                }
              }}
              className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-1 text-xs font-medium text-red-600 opacity-0 shadow-sm transition group-hover:opacity-100"
            >
              Delete
            </button>
          </div>
        );
      })}
    </div>
  );
}
