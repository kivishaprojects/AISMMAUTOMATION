"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getPageAuditData } from "@/lib/social/meta";
import { buildPageReport } from "@/lib/ai/page-analyzer";
import { resolveOpenAiKey, debitWalletCredits, refundWalletCredits, CREDIT_COSTS } from "@/lib/ai/usage";

export async function generatePageReportAction(
  organizationId: string,
  _prevState: unknown,
  formData: FormData
) {
  const socialAccountId = String(formData.get("socialAccountId") ?? "");
  if (!socialAccountId) return { error: "Pick a connected page first" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: account } = await supabase
    .from("social_accounts")
    .select("id, platform, external_id, access_token_encrypted")
    .eq("id", socialAccountId)
    .single();

  if (!account || account.platform !== "FACEBOOK" || !account.access_token_encrypted) {
    return { error: "Page analysis currently supports connected Facebook Pages." };
  }

  const apiKeyOverride = await resolveOpenAiKey(supabase, organizationId);
  if (!apiKeyOverride) {
    const { error: debitError } = await debitWalletCredits(
      supabase,
      organizationId,
      CREDIT_COSTS.PAGE_REPORT,
      "Page analysis report"
    );
    if (debitError) return { error: debitError };
  }

  try {
    const data = await getPageAuditData(account.external_id, account.access_token_encrypted);
    const report = await buildPageReport({ data, apiKeyOverride });

    const { data: saved, error: saveError } = await supabase
      .from("page_analysis_reports")
      .insert({
        organization_id: organizationId,
        social_account_id: account.id,
        created_by: user.id,
        page_name: data.name,
        score: report.score,
        checklist: report.checklist,
        stats: report.stats,
        recommendations: report.recommendations,
      })
      .select()
      .single();

    if (saveError || !saved) throw new Error(saveError?.message ?? "Could not save report");

    revalidatePath("/dashboard/analytics/page-analyzer");
    return { success: true, report: saved };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not generate report";
    if (!apiKeyOverride) {
      await refundWalletCredits(organizationId, CREDIT_COSTS.PAGE_REPORT, "Refund: failed page report");
    }
    return { error: message };
  }
}
