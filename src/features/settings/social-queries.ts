import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

export type SocialAccount = Tables<"social_accounts">;

export async function getActiveSocialAccounts(
  organizationId: string
): Promise<SocialAccount[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("social_accounts")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("status", "ACTIVE")
    .order("platform", { ascending: true });

  if (error || !data) return [];
  return data;
}
