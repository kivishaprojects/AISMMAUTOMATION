import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

export type TrackedPrompt = Tables<"geo_tracked_prompts">;
export type GeoCheckResult = Tables<"geo_check_results">;

export type TrackedPromptWithHistory = TrackedPrompt & {
  history: GeoCheckResult[];
  mentionRate: number | null;
};

export async function getTrackedPromptsWithHistory(
  organizationId: string
): Promise<TrackedPromptWithHistory[]> {
  const supabase = await createClient();

  const { data: prompts } = await supabase
    .from("geo_tracked_prompts")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (!prompts || prompts.length === 0) return [];

  const results: TrackedPromptWithHistory[] = [];
  for (const p of prompts) {
    const { data: history } = await supabase
      .from("geo_check_results")
      .select("*")
      .eq("tracked_prompt_id", p.id)
      .order("checked_at", { ascending: false })
      .limit(10);

    const h = history ?? [];
    const mentionRate = h.length > 0 ? Math.round((h.filter((r) => r.mentioned).length / h.length) * 100) : null;

    results.push({ ...p, history: h, mentionRate });
  }
  return results;
}
