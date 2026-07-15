"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { buildMetaAuthUrl } from "@/lib/social/meta";
import { buildLinkedInAuthUrl } from "@/lib/social/linkedin";

export async function connectMetaAction(organizationId: string) {
  // organizationId travels through Meta's OAuth `state` param and comes
  // back on the callback so we know which org to attach the pages to.
  redirect(buildMetaAuthUrl(organizationId));
}

export async function connectLinkedInAction(organizationId: string) {
  redirect(buildLinkedInAuthUrl(organizationId));
}

/**
 * Switches a connected LinkedIn account from posting-as-yourself to
 * posting-as-your-Company-Page, by pointing external_id at the org URN
 * instead of the person URN. Only takes effect once LinkedIn has actually
 * approved this app for w_organization_social \u2014 otherwise publishing to
 * that URN will fail with a permissions error, which the Scheduler will
 * surface clearly.
 */
export async function setLinkedInCompanyPageAction(
  accountId: string,
  _prevState: unknown,
  formData: FormData
) {
  const pageId = String(formData.get("pageId") ?? "").trim();
  if (!/^\d+$/.test(pageId)) {
    return { error: "Enter just the numeric Company Page ID (from your page admin URL)." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("social_accounts")
    .update({ external_id: `urn:li:organization:${pageId}` })
    .eq("id", accountId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/settings/social-accounts");
  return { success: true };
}

export async function disconnectSocialAccountAction(accountId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("social_accounts")
    .update({ status: "REVOKED" })
    .eq("id", accountId);

  if (error) {
    throw new Error(
      error.code === "42501"
        ? "Only managers/admins can disconnect accounts."
        : error.message
    );
  }
  revalidatePath("/dashboard/settings/social-accounts");
}
