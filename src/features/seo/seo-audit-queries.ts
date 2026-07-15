import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

export type SeoAuditRow = Tables<"seo_audits">;
export type SeoAuditFixRow = Tables<"seo_audit_fixes">;

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

export async function getFixesForAudit(auditId: string): Promise<SeoAuditFixRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("seo_audit_fixes")
    .select("*")
    .eq("audit_id", auditId)
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return data;
}
