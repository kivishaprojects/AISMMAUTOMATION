import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

export type SiteChange = Tables<"site_changes">;

export async function getSiteChangesByBatch(organizationId: string, batchId: string): Promise<SiteChange[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_changes")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("batch_id", batchId)
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return data;
}

export async function getRecentBatches(organizationId: string, limit = 10): Promise<{ batchId: string; createdAt: string; count: number; pageUrl: string | null }[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_changes")
    .select("batch_id, created_at, page_url")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (!data) return [];

  const byBatch = new Map<string, { createdAt: string; count: number; pageUrl: string | null }>();
  for (const row of data) {
    if (!byBatch.has(row.batch_id)) {
      byBatch.set(row.batch_id, { createdAt: row.created_at, count: 0, pageUrl: row.page_url });
    }
    byBatch.get(row.batch_id)!.count++;
  }

  return [...byBatch.entries()]
    .map(([batchId, v]) => ({ batchId, ...v }))
    .slice(0, limit);
}
