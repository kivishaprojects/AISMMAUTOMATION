"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { openFixPullRequest, type FileEdit } from "@/lib/github/client";

export async function applyFixesViaGithubAction({
  organizationId,
  auditId,
  filePath,
  applyTitle,
  applyMeta,
}: {
  organizationId: string;
  auditId: string;
  filePath: string;
  applyTitle: boolean;
  applyMeta: boolean;
}) {
  const supabase = await createClient();

  const { data: repoConn } = await supabase
    .from("repo_connections")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("provider", "github")
    .limit(1)
    .single();
  if (!repoConn) throw new Error("No GitHub repo connected. Add one under Settings \u2192 Website Repository.");

  const { data: audit } = await supabase.from("seo_audits").select("*").eq("id", auditId).single();
  if (!audit) throw new Error("Audit not found");

  const checks = (audit.checks as { label: string; detail?: string }[] | null) ?? [];
  const currentTitle = checks.find((c) => c.label === "Title tag present")?.detail;
  const currentMeta = checks.find((c) => c.label === "Meta description present")?.detail;

  const edits: FileEdit[] = [];
  if (applyTitle && audit.suggested_title) {
    if (!currentTitle) throw new Error("No current title text was captured to safely replace \u2014 can't apply this fix.");
    edits.push({ path: filePath, find: currentTitle, replace: audit.suggested_title });
  }
  if (applyMeta && audit.suggested_meta_description) {
    if (!currentMeta) throw new Error("No current meta description text was captured to safely replace \u2014 can't apply this fix.");
    edits.push({ path: filePath, find: currentMeta, replace: audit.suggested_meta_description });
  }

  if (edits.length === 0) throw new Error("Nothing selected to apply.");

  const branchName = `seo-fix/${auditId.slice(0, 8)}-${Date.now()}`;
  const prUrl = await openFixPullRequest({
    owner: repoConn.repo_owner,
    repo: repoConn.repo_name,
    token: repoConn.access_token_encrypted,
    branchName,
    title: `SEO fixes for ${audit.url}`,
    body:
      `Automated SEO fix proposed by AI Marketing OS for ${audit.url}.\n\n` +
      (applyTitle && audit.suggested_title ? `- Title: "${currentTitle}" \u2192 "${audit.suggested_title}"\n` : "") +
      (applyMeta && audit.suggested_meta_description ? `- Meta description updated\n` : "") +
      `\nReview the diff before merging \u2014 this was generated automatically and applied to a specific text match, not verified against your site's rendering.`,
    edits,
  });

  await supabase
    .from("seo_audits")
    .update({
      fixes_status: {
        titleApplied: applyTitle,
        metaApplied: applyMeta,
        prUrl,
        appliedAt: new Date().toISOString(),
      },
    })
    .eq("id", auditId);

  revalidatePath("/dashboard/analytics/seo-audit");
  return prUrl;
}
