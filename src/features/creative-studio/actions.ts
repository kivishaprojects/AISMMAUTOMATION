"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateImageOpenAI } from "@/lib/ai/openai-image";
import { generateCaptionOpenAI } from "@/lib/ai/openai-text";
import { resolveOpenAiKey, debitWalletCredits, refundWalletCredits, CREDIT_COSTS } from "@/lib/ai/usage";
import { generateImageSchema, ASPECT_RATIO_TO_SIZE } from "./schema";

function buildPrompt(basePrompt: string, brandTone?: string | null, colors?: unknown) {
  const parts = [basePrompt];

  if (brandTone) {
    parts.push(`Match this brand tone/style: ${brandTone}.`);
  }

  const c = colors as { primary?: string; secondary?: string; accent?: string } | null;
  if (c?.primary) {
    parts.push(
      `Favor a color palette built around ${c.primary}${c.secondary ? `, ${c.secondary}` : ""}${c.accent ? `, and ${c.accent}` : ""} where it fits naturally.`
    );
  }

  // gpt-image-1 tends to render any requested text far too large and lets
  // it bleed off the edges. Explicitly constrain size/placement whenever
  // the request implies text/quotes should appear in the image.
  parts.push(
    "If the image includes any text, quote, or wording, render it small " +
      "and clean \u2014 no more than 8-10 words, sized proportionally to the " +
      "overall composition (not oversized), fully inside the frame with " +
      "visible padding from every edge, and positioned so it doesn't " +
      "overlap or crop into the main subject."
  );

  return parts.join(" ");
}

export async function generateImageAction(
  organizationId: string,
  _prevState: unknown,
  formData: FormData
) {
  const parsed = generateImageSchema.safeParse({
    prompt: formData.get("prompt"),
    brandKitId: formData.get("brandKitId") || undefined,
    aspectRatio: formData.get("aspectRatio") || "square",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { prompt, brandKitId, aspectRatio } = parsed.data;

  // Pull brand kit context (tone + colors) if the user picked one, so the
  // generated image actually reflects the brand rather than being generic.
  let brandTone: string | null = null;
  let brandColors: unknown = null;
  if (brandKitId) {
    const { data: kit } = await supabase
      .from("brand_kits")
      .select("tone_of_voice, colors")
      .eq("id", brandKitId)
      .single();
    brandTone = kit?.tone_of_voice ?? null;
    brandColors = kit?.colors ?? null;
  }

  const finalPrompt = buildPrompt(prompt, brandTone, brandColors);
  const apiKeyOverride = await resolveOpenAiKey(supabase, organizationId);

  // Only platform-managed usage (no custom key) draws from the wallet \u2014
  // bring-your-own-key orgs pay OpenAI directly, so nothing to deduct.
  if (!apiKeyOverride) {
    const { error: debitError } = await debitWalletCredits(
      supabase,
      organizationId,
      CREDIT_COSTS.IMAGE,
      "Image generation"
    );
    if (debitError) return { error: debitError };
  }

  // Create the job row first (status QUEUED) so there's a durable record
  // even if generation fails partway through — this also gives the UI
  // something to show a "generating..." state against if we add polling
  // later instead of the current synchronous await.
  const { data: job, error: jobError } = await supabase
    .from("ai_generation_jobs")
    .insert({
      organization_id: organizationId,
      created_by: user.id,
      type: "IMAGE",
      provider: "openai",
      prompt: finalPrompt,
      status: "PROCESSING",
    })
    .select()
    .single();

  if (jobError || !job) {
    return { error: jobError?.message ?? "Could not start generation job" };
  }

  try {
    const size = ASPECT_RATIO_TO_SIZE[aspectRatio];
    const result = await generateImageOpenAI({ prompt: finalPrompt, size, apiKeyOverride });

    const buffer = Buffer.from(result.base64, "base64");
    const storagePath = `${organizationId}/generated/${job.id}.png`;

    const { error: uploadError } = await supabase.storage
      .from("creative-assets")
      .upload(storagePath, buffer, {
        contentType: result.mimeType,
        upsert: true,
      });

    if (uploadError) throw new Error(uploadError.message);

    const {
      data: { publicUrl },
    } = supabase.storage.from("creative-assets").getPublicUrl(storagePath);

    const { data: asset, error: assetError } = await supabase
      .from("assets")
      .insert({
        organization_id: organizationId,
        brand_kit_id: brandKitId || null,
        type: "IMAGE",
        storage_path: storagePath,
        url: publicUrl,
        metadata: { prompt: finalPrompt, provider: result.provider, model: result.model, aspectRatio },
        created_by: user.id,
      })
      .select()
      .single();

    if (assetError || !asset) throw new Error(assetError?.message ?? "Could not save asset");

    await supabase
      .from("ai_generation_jobs")
      .update({ status: "COMPLETED", result_asset_id: asset.id })
      .eq("id", job.id);

    revalidatePath("/dashboard/studio");
    return { success: true, asset };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Image generation failed";
    await supabase
      .from("ai_generation_jobs")
      .update({ status: "FAILED" })
      .eq("id", job.id);
    if (!apiKeyOverride) {
      await refundWalletCredits(organizationId, CREDIT_COSTS.IMAGE, "Refund: failed image generation");
    }
    return { error: message };
  }
}

export async function deleteAssetAction(assetId: string, storagePath: string) {
  const supabase = await createClient();

  await supabase.storage.from("creative-assets").remove([storagePath]);
  const { error } = await supabase.from("assets").delete().eq("id", assetId);

  if (error) {
    throw new Error(
      error.code === "42501"
        ? "You don't have permission to delete this asset."
        : error.message
    );
  }

  revalidatePath("/dashboard/studio");
}

export async function generateCaptionAction(
  organizationId: string,
  _prevState: unknown,
  formData: FormData
) {
  const imagePrompt = String(formData.get("imagePrompt") ?? "");
  const brandKitId = String(formData.get("brandKitId") ?? "") || undefined;

  if (!imagePrompt) {
    return { error: "Missing image context" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  let brandTone: string | null = null;
  if (brandKitId) {
    const { data: kit } = await supabase
      .from("brand_kits")
      .select("tone_of_voice")
      .eq("id", brandKitId)
      .single();
    brandTone = kit?.tone_of_voice ?? null;
  }

  try {
    const apiKeyOverride = await resolveOpenAiKey(supabase, organizationId);
    const result = await generateCaptionOpenAI({ imagePrompt, brandTone, apiKeyOverride });
    return { success: true, caption: result.caption, hashtags: result.hashtags };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Caption generation failed";
    return { error: message };
  }
}

const scheduleSchema = z.object({
  assetId: z.string().min(1),
  caption: z.string().min(1, "Caption can't be empty"),
  hashtags: z.string().optional(),
  mode: z.enum(["now", "schedule"]),
  scheduledFor: z.string().optional(),
  socialAccountIds: z.string().min(1, "Select at least one page to post to"),
});

export async function publishOrScheduleAction(
  organizationId: string,
  _prevState: unknown,
  formData: FormData
) {
  const parsed = scheduleSchema.safeParse({
    assetId: formData.get("assetId"),
    caption: formData.get("caption"),
    hashtags: formData.get("hashtags") || "",
    mode: formData.get("mode"),
    scheduledFor: formData.get("scheduledFor") || undefined,
    socialAccountIds: formData.get("socialAccountIds"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { assetId, caption, hashtags, mode, scheduledFor, socialAccountIds } = parsed.data;
  const accountIds = socialAccountIds.split(",").filter(Boolean);

  if (accountIds.length === 0) {
    return { error: "Select at least one connected page to post to." };
  }

  if (mode === "schedule" && !scheduledFor) {
    return { error: "Pick a date and time to schedule this post" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const hashtagList = hashtags
    ? hashtags.split(/\s+/).map((h) => h.trim()).filter(Boolean)
    : [];

  const { data: post, error: postError } = await supabase
    .from("posts")
    .insert({
      organization_id: organizationId,
      created_by: user.id,
      caption,
      hashtags: hashtagList,
      status: mode === "now" ? "PUBLISHING" : "SCHEDULED",
      scheduled_for: mode === "schedule" ? new Date(scheduledFor!).toISOString() : null,
    })
    .select()
    .single();

  if (postError || !post) {
    return { error: postError?.message ?? "Could not create post" };
  }

  const { error: linkError } = await supabase
    .from("post_assets")
    .insert({ post_id: post.id, asset_id: assetId });

  if (linkError) {
    return { error: linkError.message };
  }

  // Fan out to each selected page. No real publishing call happens here yet
  // (that needs the Meta/LinkedIn/X app credentials registered under
  // Settings \u2192 Social Media Accounts) \u2014 rows are created in PUBLISHING
  // status so the Scheduler shows exactly what's pending vs. actually live
  // (platform_post_id stays null until real integration fills it in).
  const targetRows = accountIds.map((socialAccountId) => ({
    post_id: post.id,
    social_account_id: socialAccountId,
    status: mode === "now" ? ("PUBLISHING" as const) : ("SCHEDULED" as const),
  }));

  const { error: targetsError } = await supabase.from("post_targets").insert(targetRows);
  if (targetsError) {
    return { error: targetsError.message };
  }

  if (mode === "now") {
    // Fire-and-await: attempt real publishing to each selected page right
    // now. If Meta credentials aren't configured yet, this fails cleanly
    // and marks targets/post as FAILED rather than pretending it worked.
    try {
      const { attemptPublishPost } = await import("@/lib/social/dispatch");
      await attemptPublishPost(post.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Publishing failed";
      return { error: message };
    }
  }

  revalidatePath("/dashboard/studio");
  revalidatePath("/dashboard/scheduler");
  return { success: true, post };
}

