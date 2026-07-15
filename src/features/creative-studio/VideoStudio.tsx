"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { generateVideoAction, checkVideoStatusAction, deleteVideoAssetAction } from "./video-actions";
import type { GeneratedVideo } from "./video-queries";

export function VideoStudio({
  organizationId,
  videos,
}: {
  organizationId: string;
  videos: GeneratedVideo[];
}) {
  const [genState, genAction, genPending] = useActionState(
    generateVideoAction.bind(null, organizationId),
    null
  );
  const [pollingJobId, setPollingJobId] = useState<string | null>(null);
  const [pollStatus, setPollStatus] = useState<string | null>(null);
  const [pollError, setPollError] = useState<string | null>(null);
  const [readyAsset, setReadyAsset] = useState<GeneratedVideo | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (genState && "success" in genState && genState.success && genState.jobId) {
      setPollingJobId(genState.jobId);
      setPollStatus("PROCESSING");
      setPollError(null);
      setReadyAsset(null);
    }
  }, [genState]);

  useEffect(() => {
    if (!pollingJobId) return;

    intervalRef.current = setInterval(async () => {
      const result = await checkVideoStatusAction(pollingJobId);
      if (result.status === "COMPLETED") {
        setPollStatus("COMPLETED");
        setReadyAsset((result.asset as GeneratedVideo) ?? null);
        setPollingJobId(null);
        if (intervalRef.current) clearInterval(intervalRef.current);
      } else if (result.status === "FAILED") {
        setPollStatus("FAILED");
        setPollError(result.error ?? "Video generation failed");
        setPollingJobId(null);
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    }, 6000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [pollingJobId]);

  return (
    <div className="space-y-6">
      <form action={genAction} className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6">
        <div>
          <label className="block text-sm font-medium text-neutral-700">
            Describe the video
          </label>
          <textarea
            name="prompt"
            required
            rows={3}
            placeholder="e.g. A close-up of steaming filter coffee being poured into a glass tumbler, warm morning light, slow motion"
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Shape</label>
          <select
            name="aspectRatio"
            defaultValue="landscape"
            className="mt-1 w-full max-w-xs rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
          >
            <option value="landscape">Landscape — feed/YouTube</option>
            <option value="portrait">Portrait — Reels/Shorts</option>
          </select>
        </div>

        {genState?.error && <p className="text-sm text-red-600">{genState.error}</p>}

        <button
          type="submit"
          disabled={genPending || !!pollingJobId}
          className="w-full rounded-lg bg-neutral-900 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50"
        >
          {genPending ? "Starting…" : pollingJobId ? "Generating…" : "Generate video"}
        </button>
        <p className="text-xs text-neutral-400">
          Costs 50 wallet credits (platform-managed key) or your own OpenAI usage if you&apos;ve set a custom key.
        </p>
      </form>

      {pollingJobId && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900" />
          <p className="mt-3 text-sm font-medium text-neutral-700">
            Generating your video… this typically takes a few minutes.
          </p>
          <p className="mt-1 text-xs text-neutral-400">You can leave this page — check back under Past generations.</p>
        </div>
      )}

      {pollStatus === "FAILED" && pollError && (
        <p className="text-sm text-red-600">{pollError}</p>
      )}

      {readyAsset && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <p className="mb-3 text-sm font-medium text-neutral-900">Done!</p>
          <video src={readyAsset.url} controls className="mx-auto max-h-96 rounded-xl" />
        </div>
      )}

      <div>
        <h2 className="mb-3 text-sm font-semibold text-neutral-900">Past generations</h2>
        {videos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center">
            <p className="text-sm text-neutral-500">No videos yet. Generate your first one above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((v) => (
              <div key={v.id} className="group relative overflow-hidden rounded-xl border border-neutral-200 bg-white">
                <video src={v.url} controls className="aspect-video w-full object-cover" />
                <button
                  onClick={() => {
                    if (confirm("Delete this video?")) deleteVideoAssetAction(v.id, v.storage_path);
                  }}
                  className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-1 text-xs font-medium text-red-600 opacity-0 shadow-sm transition group-hover:opacity-100"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
