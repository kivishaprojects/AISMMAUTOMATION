import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

export type PageReportRow = Tables<"page_analysis_reports">;

export async function getPageReports(organizationId: string): Promise<PageReportRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("page_analysis_reports")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error || !data) return [];
  return data;
}
