"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { brandKitSchema } from "./schema";

function parseBrandKitForm(formData: FormData) {
  return brandKitSchema.safeParse({
    name: formData.get("name"),
    primaryColor: formData.get("primaryColor"),
    secondaryColor: formData.get("secondaryColor"),
    accentColor: formData.get("accentColor"),
    headingFont: formData.get("headingFont"),
    bodyFont: formData.get("bodyFont"),
    toneOfVoice: formData.get("toneOfVoice") ?? "",
  });
}

export async function createBrandKitAction(
  organizationId: string,
  _prevState: unknown,
  formData: FormData
) {
  const parsed = parseBrandKitForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { primaryColor, secondaryColor, accentColor, headingFont, bodyFont } =
    parsed.data;

  const { error } = await supabase.from("brand_kits").insert({
    organization_id: organizationId,
    name: parsed.data.name,
    tone_of_voice: parsed.data.toneOfVoice || null,
    colors: { primary: primaryColor, secondary: secondaryColor, accent: accentColor },
    fonts: { heading: headingFont, body: bodyFont },
  });

  if (error) {
    // RLS denies this insert for VIEWER/APPROVER roles — surface that clearly
    // rather than a raw Postgres error.
    return {
      error: error.code === "42501"
        ? "You don't have permission to create a brand kit in this organization."
        : error.message,
    };
  }

  revalidatePath("/dashboard/brand-kit");
  return { success: true };
}

export async function updateBrandKitAction(
  brandKitId: string,
  _prevState: unknown,
  formData: FormData
) {
  const parsed = parseBrandKitForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { primaryColor, secondaryColor, accentColor, headingFont, bodyFont } =
    parsed.data;

  const { error } = await supabase
    .from("brand_kits")
    .update({
      name: parsed.data.name,
      tone_of_voice: parsed.data.toneOfVoice || null,
      colors: { primary: primaryColor, secondary: secondaryColor, accent: accentColor },
      fonts: { heading: headingFont, body: bodyFont },
    })
    .eq("id", brandKitId);

  if (error) {
    return {
      error: error.code === "42501"
        ? "You don't have permission to edit this brand kit."
        : error.message,
    };
  }

  revalidatePath("/dashboard/brand-kit");
  return { success: true };
}

export async function deleteBrandKitAction(brandKitId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("brand_kits").delete().eq("id", brandKitId);
  if (error) {
    throw new Error(
      error.code === "42501"
        ? "You don't have permission to delete this brand kit."
        : error.message
    );
  }
  revalidatePath("/dashboard/brand-kit");
}

export async function updateBrandKitLogoAction(
  brandKitId: string,
  logoUrl: string
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("brand_kits")
    .update({ logo_url: logoUrl })
    .eq("id", brandKitId);

  if (error) {
    throw new Error(
      error.code === "42501"
        ? "You don't have permission to update this brand kit's logo."
        : error.message
    );
  }
  revalidatePath("/dashboard/brand-kit");
}
