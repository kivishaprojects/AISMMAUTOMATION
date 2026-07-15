import { createClient } from "@/lib/supabase/server";

export type DashboardStats = {
  scheduledPosts: number;
  aiGenerationsThisMonth: number;
};

export async function getDashboardStats(organizationId: string): Promise<DashboardStats> {
  const supabase = await createClient();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [{ count: scheduledPosts }, { count: aiGenerationsThisMonth }] = await Promise.all([
    supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "SCHEDULED"),
    supabase
      .from("ai_generation_jobs")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .gte("created_at", startOfMonth.toISOString()),
  ]);

  return {
    scheduledPosts: scheduledPosts ?? 0,
    aiGenerationsThisMonth: aiGenerationsThisMonth ?? 0,
  };
}
