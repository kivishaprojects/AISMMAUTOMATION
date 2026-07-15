"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { generateVideoAction, checkVideoStatusAction, deleteVideoAssetAction } from "./video-actions";
import { generateCaptionAction, publishOrScheduleAction } from "./actions";
import { PageSelector, PublishOptions } from "./PublishControls";
import type { GeneratedVideo } from "./video-queries";
import type { SocialAccount } from "@/features/scheduler/social-queries";

type Phase = "generate" | "review" | "caption" | "publish" | "done";

const STEPS: { key: Phase; label: string }[] = [
  { key: "generate", label: "Create" },
  { key: "review", label: "Approve" },
  { key: "caption", label: "Caption" },
  { key: "publish", label: "Publish" },
];

export function VideoStudio({
  organizationId,
  videos,
  socialAccounts,
}: {
  organizationId: string;
  videos: GeneratedVideo[];
  socialAccounts: SocialAccount[];
}) {
  const [phase, setPhase] = useState<Phase>("generate");
  const [prompt, setPrompt] = useState("");
  const [asset, setAsset] = useState<GeneratedVideo | null>(null);
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");

  const [genState, genAction, genPending] = useActionState(
    generateVideoAction.bind(null, organizationId),
    null
  );
  const [pollingJobId, setPollingJobId] = useState<string | null>(null);
  const [pollError, setPollError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [captionState, captionAction, captionPending] = useActionState(
    generateCaptionAction.bind(null, organizationId),
    null
  );
  const [publishState, publishAction, publishPending] = useActionState(
    publishOrScheduleAction.bind(null, organizationId),
    null
  );

  useEffect(() => {
    if (genState && "success" in genState && genState.success && genState.jobId) {
      setPollingJobId(genState.jobId);
      setPollError(null);
    }
  }, [genState]);

  useEffect(() => {
    if (!pollingJobId) return;
    intervalRef.current = setInterval(async () => {
      const result = await checkVideoStatusAction(pollingJobId);
      if (result.status === "COMPLETED") {
        setAsset((result.asset as GeneratedVideo) ?? null);
        setPhase("review");
        setPollingJobId(null);
        if (intervalRef.current) clearInterval(intervalRef.current);
      } else if (result.status === "FAILED") {
        setPollError(result.error ?? "Video generation failed");
        setPollingJobId(null);
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    }, 6000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [pollingJobId]);

  useEffect(() => {
    if (captionState && "success" in captionState && captionState.success) {
      setCaption(captionState.caption ?? "");
      setHashtags((captionState.hashtags ?? []).join(" "));
      setPhase("caption");
    }
  }, [captionState]);

  useEffect(() => {
    if (publishState && "success" in publishState && publishState.success) {
      setPhase("done");
    }
  }, [publishState]);

  function startOver() {
    setPhase("generate");
    setAsset(null);
    setCaption("");
    setHashtags("");
    setPollError(null);
  }

  return (
    <div className="relative rounded-2xl border border-neutral-200 bg-white p-6">
      {pollingJobId && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-2xl bg-white/90 backdrop-blur-sm">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-brand-600" />
          <p className="text-sm font-medium text-neutral-700">Generating your video… this can take a few minutes.</p>
        </div>
      )}
      {captionPending && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-2xl bg-white/90 backdrop-blur-sm">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-brand-600" />
          <p className="text-sm font-medium text-neutral-700">Writing your caption…</p>
        </div>
      )}
      {publishPending && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-2xl bg-white/90 backdrop-blur-sm">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-brand-600" />
          <p className="text-sm font-medium text-neutral-700">Publishing… video posts can take a minute.</p>
        </div>
      )}

      <div className="mb-6 flex items-center gap-2">
        {STEPS.map((step, i) => {
          const currentIndex = STEPS.findIndex((s) => s.key === phase);
          const isActive = step.key === phase;
          const isDone = i < currentIndex || phase === "done";
          return (
            <div key={step.key} className="flex flex-1 items-center gap-2">
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  isActive ? "bg-brand-600 text-white" : isDone ? "bg-brand-600/80 text-white" : "bg-neutral-100 text-neutral-400"
                }`}
              >
                {i + 1}
              </div>
              <span className={`text-xs font-medium ${isActive ? "text-neutral-900" : "text-neutral-400"}`}>
                {step.label}
              </span>
              {i < STEPS.length - 1 && <div className="h-px flex-1 bg-neutral-200" />}
            </div>
          );
        })}
      </div>

      {phase === "generate" && (
        <form
          action={(fd) => {
            setPrompt(String(fd.get("prompt") ?? ""));
            genAction(fd);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-neutral-700">Describe the video</label>
            <textarea
              name="prompt"
              required
              rows={3}
              placeholder="e.g. A close-up of steaming filter coffee being poured into a glass tumbler, warm morning light, slow motion"
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700">Shape</label>
            <select
              name="aspectRatio"
              defaultValue="landscape"
              className="mt-1 w-full max-w-xs rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
            >
              <option value="landscape">Landscape — feed/YouTube</option>
              <option value="portrait">Portrait — Reels/Shorts</option>
            </select>
          </div>
          {genState?.error && <p className="text-sm text-red-600">{genState.error}</p>}
          <button
            type="submit"
            disabled={genPending}
            className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
          >
            Generate video
          </button>
          <p className="text-xs text-neutral-400">
            Costs 50 wallet credits (platform-managed key), or your own OpenAI usage with a custom key.
          </p>
        </form>
      )}

      {pollError && phase === "generate" && <p className="mt-3 text-sm text-red-600">{pollError}</p>}

      {phase === "review" && asset && (
        <div className="space-y-4">
          <video src={asset.url} controls className="mx-auto max-h-96 rounded-xl border border-neutral-200" />
          <div className="flex gap-3">
            <button
              onClick={startOver}
              className="flex-1 rounded-lg border border-neutral-300 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Recreate
            </button>
            <button
              onClick={() => {
                const fd = new FormData();
                fd.set("imagePrompt", prompt);
                fd.set("brandKitId", "");
                captionAction(fd);
              }}
              disabled={captionPending}
              className="flex-1 rounded-lg bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              Approve → Write caption
            </button>
          </div>
          {captionState?.error && <p className="text-center text-sm text-red-600">{captionState.error}</p>}
        </div>
      )}

      {phase === "caption" && asset && (
        <div className="space-y-4">
          <div className="flex gap-4">
            <video src={asset.url} className="h-24 w-24 shrink-0 rounded-lg border border-neutral-200 object-cover" muted />
            <div className="flex-1 space-y-3">
              <div>
                <label className="block text-sm font-medium text-neutral-700">Caption</label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700">Hashtags</label>
                <input
                  value={hashtags}
                  onChange={(e) => setHashtags(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setPhase("review")}
              className="flex-1 rounded-lg border border-neutral-300 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Back
            </button>
            <button
              onClick={() => setPhase("publish")}
              className="flex-1 rounded-lg bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
            >
              Continue → Publish or schedule
            </button>
          </div>
        </div>
      )}

      {phase === "publish" && asset && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setPhase("caption")}
            className="text-xs font-medium text-neutral-500 hover:text-neutral-700"
          >
            ← Back
          </button>

          {socialAccounts.length === 0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-medium">No social media accounts connected</p>
              <p className="mt-1">
                Connect at least one page under{" "}
                <a href="/dashboard/settings/social-accounts" className="underline">
                  Settings → Social Media Accounts
                </a>{" "}
                before publishing or scheduling.
              </p>
            </div>
          ) : (
            <form action={publishAction} className="space-y-4">
              <input type="hidden" name="assetId" value={asset.id} />
              <input type="hidden" name="caption" value={caption} />
              <input type="hidden" name="hashtags" value={hashtags} />

              <PageSelector accounts={socialAccounts} />
              <PublishOptions />

              {publishState?.error && <p className="text-sm text-red-600">{publishState.error}</p>}

              <button
                type="submit"
                disabled={publishPending}
                className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
              >
                Confirm
              </button>
            </form>
          )}
        </div>
      )}

      {phase === "done" && (
        <div className="space-y-4 text-center">
          <p className="text-sm font-medium text-neutral-900">
            {publishState && "post" in publishState && publishState.post?.status === "SCHEDULED"
              ? "Scheduled!"
              : "Submitted for publishing!"}
          </p>
          <p className="text-sm text-neutral-500">Find it under Content Calendar → Scheduler.</p>
          <button
            onClick={startOver}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Create another
          </button>
        </div>
      )}

      <div className="mt-8 border-t border-neutral-100 pt-6">
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
