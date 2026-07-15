import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

export type SeoAuditRow = Tables<"seo_audits">;

export async function getSeoAudits(organizationId: string): Promise<SeoAuditRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("seo_audits")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error || !data) return [];
  return data;
}
