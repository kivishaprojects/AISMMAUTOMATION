import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

export type OrgIntegration = Tables<"org_integrations">;

export async function getIntegration(
  organizationId: string,
  provider: string
): Promise<OrgIntegration | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("org_integrations")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("provider", provider)
    .maybeSingle();
  return data ?? null;
}
