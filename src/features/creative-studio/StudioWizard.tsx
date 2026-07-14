"use client";

import { useActionState, useEffect, useState } from "react";
import {
  generateImageAction,
  generateCaptionAction,
  publishOrScheduleAction,
} from "./actions";
import type { BrandKit } from "@/features/brand-kit/queries";
import type { GeneratedAsset } from "./queries";

type Phase = "generate" | "review" | "caption" | "publish" | "done";

const STEPS: { key: Phase; label: string }[] = [
  { key: "generate", label: "Create" },
  { key: "review", label: "Approve" },
  { key: "caption", label: "Caption" },
  { key: "publish", label: "Publish" },
];

export function StudioWizard({
  organizationId,
  brandKits,
}: {
  organizationId: string;
  brandKits: BrandKit[];
}) {
  const [phase, setPhase] = useState<Phase>("generate");
  const [asset, setAsset] = useState<GeneratedAsset | null>(null);
  const [selectedBrandKitId, setSelectedBrandKitId] = useState("");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");

  const [genState, genAction, genPending] = useActionState(
    generateImageAction.bind(null, organizationId),
    null
  );
  const [captionState, captionAction, captionPending] = useActionState(
    generateCaptionAction.bind(null, organizationId),
    null
  );
  const [publishState, publishAction, publishPending] = useActionState(
    publishOrScheduleAction.bind(null, organizationId),
    null
  );

  useEffect(() => {
    if (genState && "success" in genState && genState.success && genState.asset) {
      setAsset(genState.asset);
      setPhase("review");
    }
  }, [genState]);

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
  }

  const meta = (asset?.metadata as { prompt?: string } | null) ?? {};

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6">
      {/* Stepper header */}
      <div className="mb-6 flex items-center gap-2">
        {STEPS.map((step, i) => {
          const currentIndex = STEPS.findIndex((s) => s.key === phase);
          const isActive = step.key === phase;
          const isDone = i < currentIndex || phase === "done";
          return (
            <div key={step.key} className="flex flex-1 items-center gap-2">
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  isActive
                    ? "bg-neutral-900 text-white"
                    : isDone
                    ? "bg-neutral-900/80 text-white"
                    : "bg-neutral-100 text-neutral-400"
                }`}
              >
                {i + 1}
              </div>
              <span
                className={`text-xs font-medium ${
                  isActive ? "text-neutral-900" : "text-neutral-400"
                }`}
              >
                {step.label}
              </span>
              {i < STEPS.length - 1 && (
                <div className="h-px flex-1 bg-neutral-200" />
              )}
            </div>
          );
        })}
      </div>

      {/* Step 1: Generate */}
      {phase === "generate" && (
        <form action={genAction} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700">
              What do you want to create?
            </label>
            <textarea
              name="prompt"
              required
              rows={3}
              placeholder="e.g. A festive Diwali promotional banner for a sweets shop, warm gold and maroon tones, diyas and rangoli in the background"
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-neutral-700">
                Brand kit
              </label>
              <select
                name="brandKitId"
                value={selectedBrandKitId}
                onChange={(e) => setSelectedBrandKitId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
              >
                <option value="">None</option>
                {brandKits.map((kit) => (
                  <option key={kit.id} value={kit.id}>{kit.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700">
                Shape
              </label>
              <select
                name="aspectRatio"
                defaultValue="square"
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
              >
                <option value="square">Square (1:1) — feed post</option>
                <option value="portrait">Portrait — story/reel</option>
                <option value="landscape">Landscape — banner</option>
              </select>
            </div>
          </div>

          {genState?.error && <p className="text-sm text-red-600">{genState.error}</p>}

          <button
            type="submit"
            disabled={genPending}
            className="w-full rounded-lg bg-neutral-900 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50"
          >
            {genPending ? "Generating… (this can take 20-30s)" : "Generate image"}
          </button>
        </form>
      )}

      {/* Step 2: Review — approve or recreate */}
      {phase === "review" && asset && (
        <div className="space-y-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={asset.url}
            alt={meta.prompt ?? "Generated image"}
            className="mx-auto max-h-96 rounded-xl border border-neutral-200 object-contain"
          />
          <p className="text-center text-xs text-neutral-500">{meta.prompt}</p>

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
                fd.set("imagePrompt", meta.prompt ?? "");
                fd.set("brandKitId", selectedBrandKitId);
                captionAction(fd);
              }}
              disabled={captionPending}
              className="flex-1 rounded-lg bg-neutral-900 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
            >
              {captionPending ? "Writing caption…" : "Approve → Write caption"}
            </button>
          </div>
          {captionState?.error && (
            <p className="text-center text-sm text-red-600">{captionState.error}</p>
          )}
        </div>
      )}

      {/* Step 3: Caption & hashtags (editable) */}
      {phase === "caption" && asset && (
        <div className="space-y-4">
          <div className="flex gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={asset.url}
              alt=""
              className="h-24 w-24 shrink-0 rounded-lg border border-neutral-200 object-cover"
            />
            <div className="flex-1 space-y-3">
              <div>
                <label className="block text-sm font-medium text-neutral-700">Caption</label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700">Hashtags</label>
                <input
                  value={hashtags}
                  onChange={(e) => setHashtags(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
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
              className="flex-1 rounded-lg bg-neutral-900 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
            >
              Continue → Publish or schedule
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Publish or schedule */}
      {phase === "publish" && asset && (
        <form action={publishAction} className="space-y-4">
          <input type="hidden" name="assetId" value={asset.id} />
          <input type="hidden" name="caption" value={caption} />
          <input type="hidden" name="hashtags" value={hashtags} />

          <p className="text-xs text-neutral-400">
            Note: this creates the post record and (if scheduled) queues it. Actual
            posting to connected social accounts happens once you&apos;ve connected
            them under Settings → Social Media Accounts.
          </p>

          <PublishOptions />

          {publishState?.error && (
            <p className="text-sm text-red-600">{publishState.error}</p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setPhase("caption")}
              className="flex-1 rounded-lg border border-neutral-300 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={publishPending}
              className="flex-1 rounded-lg bg-neutral-900 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
            >
              {publishPending ? "Saving…" : "Confirm"}
            </button>
          </div>
        </form>
      )}

      {phase === "done" && (
        <div className="space-y-4 text-center">
          <p className="text-sm font-medium text-neutral-900">
            {publishState && "post" in publishState && publishState.post?.status === "SCHEDULED"
              ? "Scheduled!"
              : "Published!"}
          </p>
          <p className="text-sm text-neutral-500">
            Find it under Content Calendar → Scheduler.
          </p>
          <button
            onClick={startOver}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Create another
          </button>
        </div>
      )}
    </div>
  );
}

function PublishOptions() {
  const [mode, setMode] = useState<"now" | "schedule">("now");

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-lg border border-neutral-300 px-3 py-2 text-sm has-[:checked]:border-neutral-900">
          <input
            type="radio"
            name="mode"
            value="now"
            checked={mode === "now"}
            onChange={() => setMode("now")}
          />
          Publish now
        </label>
        <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-lg border border-neutral-300 px-3 py-2 text-sm has-[:checked]:border-neutral-900">
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
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
        />
      )}
    </div>
  );
}
