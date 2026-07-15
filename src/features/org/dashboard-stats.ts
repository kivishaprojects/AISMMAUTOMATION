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

export type DayActivity = { day: string; generations: number; posts: number };

export async function getRecentActivity(organizationId: string): Promise<DayActivity[]> {
  const supabase = await createClient();

  const start = new Date();
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);

  const [{ data: jobs }, { data: posts }] = await Promise.all([
    supabase
      .from("ai_generation_jobs")
      .select("created_at")
      .eq("organization_id", organizationId)
      .gte("created_at", start.toISOString()),
    supabase
      .from("posts")
      .select("created_at")
      .eq("organization_id", organizationId)
      .gte("created_at", start.toISOString()),
  ]);

  const days: DayActivity[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString(undefined, { weekday: "short" });

    days.push({
      day: label,
      generations: (jobs ?? []).filter((j) => j.created_at.slice(0, 10) === key).length,
      posts: (posts ?? []).filter((p) => p.created_at.slice(0, 10) === key).length,
    });
  }
  return days;
}
