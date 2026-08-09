import { createClient } from "@/lib/supabase/server";

export type DashboardStats = {
  seoAudits: number;
  siteChanges: number;
};

export async function getDashboardStats(organizationId: string): Promise<DashboardStats> {
  const supabase = await createClient();

  const [{ count: seoAudits }, { count: siteChanges }] = await Promise.all([
    supabase
      .from("seo_audits")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId),
    supabase
      .from("site_changes")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId),
  ]);

  return {
    seoAudits: seoAudits ?? 0,
    siteChanges: siteChanges ?? 0,
  };
}

export type DayActivity = { day: string; audits: number; changes: number };

export async function getRecentActivity(organizationId: string): Promise<DayActivity[]> {
  const supabase = await createClient();

  const start = new Date();
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);

  const [{ data: audits }, { data: changes }] = await Promise.all([
    supabase
      .from("seo_audits")
      .select("created_at")
      .eq("organization_id", organizationId)
      .gte("created_at", start.toISOString()),
    supabase
      .from("site_changes")
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
      audits: (audits ?? []).filter((a) => a.created_at.slice(0, 10) === key).length,
      changes: (changes ?? []).filter((c) => c.created_at.slice(0, 10) === key).length,
    });
  }
  return days;
}
