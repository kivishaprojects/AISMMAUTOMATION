"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { resolveOpenAiKey } from "@/lib/ai/usage";
import { openFixPullRequest, type FileEdit, type FileCreate } from "@/lib/github/client";

// Change types whose proposed_value is a whole file's contents to be
// created/overwritten, rather than a find/replace edit within a page.
const FILE_CREATE_TYPES = new Set([
  "ROBOTS_TXT",
  "SITEMAP_XML",
  "SITEMAP_HTML",
  "SITEMAP_NEWS",
  "SITEMAP_IMAGE",
  "SITEMAP_VIDEO",
]);

export async function updateSiteChangeAction(id: string, newValue: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("site_changes").update({ proposed_value: newValue }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/seo");
}

export async function updateSiteChangeFilePathAction(id: string, filePath: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("site_changes").update({ file_path: filePath }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/seo");
}

export async function deleteSiteChangeAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("site_changes").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/seo");
}

/** Generic rewrite \u2014 asks for an alternative version of the same proposed change. */
export async function regenerateSiteChangeAction(organizationId: string, id: string) {
  const supabase = await createClient();
  const { data: change } = await supabase.from("site_changes").select("*").eq("id", id).single();
  if (!change) throw new Error("Change not found");

  const apiKeyOverride = await resolveOpenAiKey(supabase, organizationId);
  const apiKey = apiKeyOverride || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("No OpenAI key available.");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Rewrite the given SEO content with a fresh alternative approach, keeping the same purpose and constraints. Respond with ONLY the new content, no explanation.",
        },
        { role: "user", content: `Type: ${change.change_type}\nLabel: ${change.label}\nCurrent proposal: ${change.proposed_value}` },
      ],
      temperature: 0.9,
    }),
  });
  if (!res.ok) throw new Error(`Regeneration failed: ${await res.text()}`);
  const json = await res.json();
  const newValue: string = json.choices?.[0]?.message?.content?.trim() ?? change.proposed_value;

  await supabase.from("site_changes").update({ proposed_value: newValue }).eq("id", id);
  revalidatePath("/dashboard/seo");
}

export async function deploySiteChangesAction(organizationId: string, changeIds: string[]) {
  const supabase = await createClient();

  const { data: repoConn } = await supabase
    .from("repo_connections")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("provider", "github")
    .limit(1)
    .single();
  if (!repoConn) throw new Error("No GitHub repo connected. Add one under Settings \u2192 Website Repository.");

  const { data: changes } = await supabase.from("site_changes").select("*").in("id", changeIds);
  if (!changes || changes.length === 0) throw new Error("No changes selected");

  const edits: FileEdit[] = [];
  const creates: FileCreate[] = [];

  for (const change of changes) {
    if (!change.file_path) {
      throw new Error(`"${change.label}" is missing a file path \u2014 fill one in before deploying.`);
    }

    if (FILE_CREATE_TYPES.has(change.change_type)) {
      creates.push({ path: change.file_path, content: change.proposed_value });
    } else if (change.current_value) {
      edits.push({ path: change.file_path, find: change.current_value, replace: change.proposed_value });
    } else {
      // No existing value to replace (e.g. adding a missing OG tag/schema
      // block that wasn't there before) \u2014 insert just before </head>.
      edits.push({ path: change.file_path, find: "</head>", replace: `${change.proposed_value}\n</head>` });
    }
  }

  const branchName = `ai-seo-fixes/${Date.now()}`;
  const summary = changes.map((c) => `- ${c.label}`).join("\n");

  const prUrl = await openFixPullRequest({
    owner: repoConn.repo_owner,
    repo: repoConn.repo_name,
    token: repoConn.access_token_encrypted,
    branchName,
    title: `AI SEO fixes (${changes.length} change${changes.length > 1 ? "s" : ""})`,
    body: `Automated fixes proposed by AI Marketing OS:\n\n${summary}\n\nReview the diff before merging \u2014 generated automatically and applied via exact text match, not verified against your site's rendering.`,
    edits,
    creates,
  });

  await supabase
    .from("site_changes")
    .update({ status: "DEPLOYED", pr_url: prUrl })
    .in("id", changeIds);

  revalidatePath("/dashboard/seo");
  return prUrl;
}

export async function getChangesForBatchAction(organizationId: string, batchId: string) {
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
