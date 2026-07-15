import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

export type KeywordReportRow = Tables<"keyword_reports">;

export async function getKeywordReports(organizationId: string): Promise<KeywordReportRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("keyword_reports")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error || !data) return [];
  return data;
}
