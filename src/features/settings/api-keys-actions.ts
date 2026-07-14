"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function saveApiKeyModeAction(
  organizationId: string,
  provider: string,
  _prevState: unknown,
  formData: FormData
) {
  const mode = String(formData.get("mode") ?? "MANAGED");
  const apiKey = String(formData.get("apiKey") ?? "").trim();

  if (mode === "CUSTOM" && !apiKey) {
    return { error: "Enter your API key, or switch back to platform-managed." };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("org_integrations").upsert(
    {
      organization_id: organizationId,
      provider,
      mode,
      api_key: mode === "CUSTOM" ? apiKey : null,
    },
    { onConflict: "organization_id,provider" }
  );

  if (error) {
    return {
      error: error.code === "42501"
        ? "Only owners/admins can change API key settings."
        : error.message,
    };
  }

  revalidatePath("/dashboard/settings/api-keys");
  return { success: true };
}
