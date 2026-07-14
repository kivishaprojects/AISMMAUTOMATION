"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateBrandKitLogoAction } from "./actions";

type Props = {
  organizationId: string;
  brandKitId: string;
  currentLogoUrl: string | null;
};

export function LogoUploader({ organizationId, brandKitId, currentLogoUrl }: Props) {
  const [preview, setPreview] = useState<string | null>(currentLogoUrl);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError("Logo must be under 2MB");
      return;
    }
    setError(null);

    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${organizationId}/logos/${brandKitId}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("brand-assets")
      .upload(path, file, { upsert: true, cacheControl: "3600" });

    if (uploadError) {
      setError(uploadError.message);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("brand-assets").getPublicUrl(path);

    setPreview(publicUrl);
    startTransition(() => {
      updateBrandKitLogoAction(brandKitId, publicUrl);
    });
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Brand logo" className="h-full w-full object-contain" />
        ) : (
          <span className="text-xs text-neutral-400">No logo</span>
        )}
      </div>
      <div>
        <label className="cursor-pointer rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
          {isPending ? "Uploading…" : "Upload logo"}
          <input
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        <p className="mt-1 text-xs text-neutral-400">PNG, JPG, SVG, or WebP · max 2MB</p>
      </div>
    </div>
  );
}
