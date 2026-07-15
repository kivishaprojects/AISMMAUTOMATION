"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { buildMetaAuthUrl } from "@/lib/social/meta";

export async function connectMetaAction(organizationId: string) {
  // organizationId travels through Meta's OAuth `state` param and comes
  // back on the callback so we know which org to attach the pages to.
  redirect(buildMetaAuthUrl(organizationId));
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
