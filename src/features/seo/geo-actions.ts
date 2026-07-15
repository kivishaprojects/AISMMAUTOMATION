"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { resolveOpenAiKey, debitWalletCredits, refundWalletCredits, CREDIT_COSTS } from "@/lib/ai/usage";

const addPromptSchema = z.object({
  prompt: z.string().min(5, "Enter the prompt to track"),
  brandName: z.string().min(1, "Enter the brand/client name to look for"),
});

export async function addTrackedPromptAction(
  organizationId: string,
  _prevState: unknown,
  formData: FormData
) {
  const parsed = addPromptSchema.safeParse({
    prompt: formData.get("prompt"),
    brandName: formData.get("brandName"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("geo_tracked_prompts").insert({
    organization_id: organizationId,
    created_by: user.id,
    prompt: parsed.data.prompt,
    brand_name: parsed.data.brandName,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/analytics/geo-tracking");
  return { success: true };
}

export async function deleteTrackedPromptAction(promptId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("geo_tracked_prompts").delete().eq("id", promptId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/analytics/geo-tracking");
}

export async function runGeoCheckAction(organizationId: string, promptId: string) {
  const supabase = await createClient();

  const { data: tracked } = await supabase
    .from("geo_tracked_prompts")
    .select("prompt, brand_name")
    .eq("id", promptId)
    .single();
  if (!tracked) throw new Error("Tracked prompt not found");

  const apiKeyOverride = await resolveOpenAiKey(supabase, organizationId);
  if (!apiKeyOverride) {
    const { error: debitError } = await debitWalletCredits(
      supabase,
      organizationId,
      CREDIT_COSTS.GEO_CHECK,
      "GEO visibility check"
    );
    if (debitError) throw new Error(debitError);
  }

  const apiKey = apiKeyOverride || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("No OpenAI key available.");

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: tracked.prompt }],
        temperature: 0.7,
      }),
    });
    if (!res.ok) throw new Error(`GEO check failed: ${await res.text()}`);
    const json = await res.json();
    const responseText: string = json.choices?.[0]?.message?.content ?? "";

    const mentioned = responseText.toLowerCase().includes(tracked.brand_name.toLowerCase());

    const { error: insertError } = await supabase.from("geo_check_results").insert({
      tracked_prompt_id: promptId,
      organization_id: organizationId,
      provider: "openai",
      mentioned,
      response_snippet: responseText.slice(0, 600),
    });
    if (insertError) throw new Error(insertError.message);

    revalidatePath("/dashboard/analytics/geo-tracking");
    return { mentioned };
  } catch (err) {
    if (!apiKeyOverride) {
      await refundWalletCredits(organizationId, CREDIT_COSTS.GEO_CHECK, "Refund: failed GEO check");
    }
    throw err;
  }
}
