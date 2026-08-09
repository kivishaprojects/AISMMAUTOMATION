import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

export type AiScan = Tables<"ai_scans">;

export async function getRecentAiScans(organizationId: string, limit = 10): Promise<AiScan[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ai_scans")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data;
}
