"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { verifyRepoAccess } from "@/lib/github/client";

const connectSchema = z.object({
  repoOwner: z.string().min(1, "Enter the repo owner/organization"),
  repoName: z.string().min(1, "Enter the repo name"),
  token: z.string().min(10, "Enter a valid GitHub personal access token"),
});

export async function connectRepoAction(
  organizationId: string,
  _prevState: unknown,
  formData: FormData
) {
  const parsed = connectSchema.safeParse({
    repoOwner: formData.get("repoOwner"),
    repoName: formData.get("repoName"),
    token: formData.get("token"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await verifyRepoAccess(parsed.data.repoOwner, parsed.data.repoName, parsed.data.token);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not verify repo access" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("repo_connections").upsert(
    {
      organization_id: organizationId,
      provider: "github",
      repo_owner: parsed.data.repoOwner,
      repo_name: parsed.data.repoName,
      access_token_encrypted: parsed.data.token,
    },
    { onConflict: "organization_id,provider,repo_owner,repo_name" }
  );

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings/website-repo");
  return { success: true };
}

export async function disconnectRepoAction(connectionId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("repo_connections").delete().eq("id", connectionId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/settings/website-repo");
}
