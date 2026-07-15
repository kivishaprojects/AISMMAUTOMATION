"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createVideoJob, getVideoJobStatus, downloadVideoContent, type VideoSize } from "@/lib/ai/openai-video";
import { resolveOpenAiKey, debitWalletCredits, refundWalletCredits, CREDIT_COSTS } from "@/lib/ai/usage";

const generateVideoSchema = z.object({
  prompt: z.string().min(5, "Describe what you want in a bit more detail").max(1000),
  aspectRatio: z.enum(["landscape", "portrait"]).default("landscape"),
});

const ASPECT_TO_SIZE: Record<"landscape" | "portrait", VideoSize> = {
  landscape: "1280x720",
  portrait: "720x1280",
};

export async function generateVideoAction(
  organizationId: string,
  _prevState: unknown,
  formData: FormData
) {
  const parsed = generateVideoSchema.safeParse({
    prompt: formData.get("prompt"),
    aspectRatio: formData.get("aspectRatio") || "landscape",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { prompt, aspectRatio } = parsed.data;
  const apiKeyOverride = await resolveOpenAiKey(supabase, organizationId);

  if (!apiKeyOverride) {
    const { error: debitError } = await debitWalletCredits(
      supabase,
      organizationId,
      CREDIT_COSTS.VIDEO,
      "Video generation"
    );
    if (debitError) return { error: debitError };
  }

  const { data: job, error: jobError } = await supabase
    .from("ai_generation_jobs")
    .insert({
      organization_id: organizationId,
      created_by: user.id,
      type: "VIDEO",
      provider: "openai",
      prompt,
      status: "PROCESSING",
    })
    .select()
    .single();

  if (jobError || !job) {
    return { error: jobError?.message ?? "Could not start video job" };
  }

  try {
    const { externalJobId } = await createVideoJob({
      prompt,
      size: ASPECT_TO_SIZE[aspectRatio],
      apiKeyOverride,
    });

    await supabase
      .from("ai_generation_jobs")
      .update({ external_job_id: externalJobId })
      .eq("id", job.id);

    return { success: true, jobId: job.id as string };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Video generation failed to start";
    await supabase.from("ai_generation_jobs").update({ status: "FAILED" }).eq("id", job.id);
    if (!apiKeyOverride) {
      await refundWalletCredits(organizationId, CREDIT_COSTS.VIDEO, "Refund: failed video generation");
    }
    return { error: message };
  }
}

export async function checkVideoStatusAction(jobId: string) {
  const supabase = await createClient();

  const { data: job } = await supabase
    .from("ai_generation_jobs")
    .select("id, organization_id, status, external_job_id, result_asset_id")
    .eq("id", jobId)
    .single();

  if (!job) return { status: "FAILED", error: "Job not found" };
  if (job.status === "COMPLETED" || job.status === "FAILED") {
    let asset = null;
    if (job.result_asset_id) {
      const { data } = await supabase.from("assets").select("*").eq("id", job.result_asset_id).single();
      asset = data;
    }
    return { status: job.status, asset };
  }
  if (!job.external_job_id) return { status: "PROCESSING" };

  const apiKeyOverride = await resolveOpenAiKey(supabase, job.organization_id);

  try {
    const remoteStatus = await getVideoJobStatus({ externalJobId: job.external_job_id, apiKeyOverride });

    if (remoteStatus.status === "completed") {
      const buffer = await downloadVideoContent({ externalJobId: job.external_job_id, apiKeyOverride });
      const storagePath = `${job.organization_id}/generated/${job.id}.mp4`;

      const { error: uploadError } = await supabase.storage
        .from("creative-assets")
        .upload(storagePath, Buffer.from(buffer), { contentType: "video/mp4", upsert: true });
      if (uploadError) throw new Error(uploadError.message);

      const {
        data: { publicUrl },
      } = supabase.storage.from("creative-assets").getPublicUrl(storagePath);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: asset, error: assetError } = await supabase
        .from("assets")
        .insert({
          organization_id: job.organization_id,
          type: "VIDEO",
          storage_path: storagePath,
          url: publicUrl,
          metadata: { provider: "openai", model: "sora-2" },
          created_by: user.id,
        })
        .select()
        .single();
      if (assetError || !asset) throw new Error(assetError?.message ?? "Could not save video asset");

      await supabase
        .from("ai_generation_jobs")
        .update({ status: "COMPLETED", result_asset_id: asset.id })
        .eq("id", job.id);

      revalidatePath("/dashboard/studio/videos");
      return { status: "COMPLETED", asset };
    }

    if (remoteStatus.status === "failed") {
      await supabase.from("ai_generation_jobs").update({ status: "FAILED" }).eq("id", job.id);
      if (!apiKeyOverride) {
        await refundWalletCredits(job.organization_id, CREDIT_COSTS.VIDEO, "Refund: failed video generation");
      }
      return { status: "FAILED", error: remoteStatus.error ?? "Video generation failed" };
    }

    return { status: "PROCESSING" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Status check failed";
    return { status: "PROCESSING", error: message };
  }
}

export async function deleteVideoAssetAction(assetId: string, storagePath: string) {
  const supabase = await createClient();
  await supabase.storage.from("creative-assets").remove([storagePath]);
  const { error } = await supabase.from("assets").delete().eq("id", assetId);
  if (error) {
    throw new Error(
      error.code === "42501" ? "You don't have permission to delete this asset." : error.message
    );
  }
  revalidatePath("/dashboard/studio/videos");
}
