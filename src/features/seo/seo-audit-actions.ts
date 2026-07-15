"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";
import { crawlPage, checkBrokenLinks, buildOnPageChecklist } from "@/lib/seo/crawler";
import { getPageSpeedData } from "@/lib/seo/pagespeed";
import { suggestAltText } from "@/lib/ai/alt-text";
import { generateStructuredFixes } from "@/lib/ai/seo-fixes";
import { resolveOpenAiKey, debitWalletCredits, refundWalletCredits, CREDIT_COSTS } from "@/lib/ai/usage";

const auditSchema = z.object({
  url: z.string().url("Enter a full URL, including https://"),
});

export async function runSeoAuditAction(
  organizationId: string,
  _prevState: unknown,
  formData: FormData
) {
  const parsed = auditSchema.safeParse({ url: formData.get("url") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid URL" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const apiKeyOverride = await resolveOpenAiKey(supabase, organizationId);
  if (!apiKeyOverride) {
    const { error: debitError } = await debitWalletCredits(
      supabase,
      organizationId,
      CREDIT_COSTS.SEO_AUDIT,
      "SEO audit"
    );
    if (debitError) return { error: debitError };
  }

  try {
    const crawl = await crawlPage(parsed.data.url);
    const brokenLinks = await checkBrokenLinks(crawl.internalLinks);
    const checklist = buildOnPageChecklist(crawl, brokenLinks);
    const pagespeed = await getPageSpeedData(crawl.finalUrl);

    const passedCount = checklist.filter((c) => c.passed).length;
    const checklistScore = (passedCount / checklist.length) * 70;
    const perfScore = pagespeed?.performanceScore ?? 70; // neutral assumption if unavailable
    const score = Math.round(checklistScore + (perfScore / 100) * 30);

    let recommendations = "Add an OpenAI key under Settings \u2192 My API Keys to generate written recommendations.";
    let suggestedTitle: string | null = null;
    let suggestedMetaDescription: string | null = null;

    const apiKey = apiKeyOverride || process.env.OPENAI_API_KEY;
    if (apiKey) {
      const summary = [
        `URL: ${crawl.finalUrl}`,
        `Current title (${crawl.title?.length ?? 0} chars): ${crawl.title ?? "(missing)"}`,
        `Current meta description (${crawl.metaDescription?.length ?? 0} chars): ${crawl.metaDescription ?? "(missing)"}`,
        `Failing checks: ${checklist.filter((c) => !c.passed).map((c) => c.label).join("; ") || "none"}`,
        pagespeed ? `PageSpeed (mobile): score ${pagespeed.performanceScore}, LCP ${pagespeed.lcp}, CLS ${pagespeed.cls}` : "PageSpeed data unavailable",
        `Broken links found: ${brokenLinks.length}`,
      ].join("\n");

      const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are a technical SEO consultant. Given real on-page audit findings, respond in " +
                "EXACTLY this format:\n" +
                "TITLE: <a rewritten title tag, 30-60 characters, or 'SKIP' if the current one is already good>\n" +
                "META: <a rewritten meta description, 120-160 characters, or 'SKIP' if already good>\n" +
                "RECOMMENDATIONS:\n<4-6 specific, prioritized, actionable fixes as a numbered list, 1-2 sentences each>",
            },
            { role: "user", content: summary },
          ],
          temperature: 0.5,
        }),
      });
      if (aiRes.ok) {
        const json = await aiRes.json();
        const text: string = json.choices?.[0]?.message?.content ?? "";

        const titleMatch = text.match(/TITLE:\s*(.+?)(?:\n|$)/i);
        const metaMatch = text.match(/META:\s*(.+?)(?:\n|$)/i);
        const recsMatch = text.match(/RECOMMENDATIONS:\s*([\s\S]+)/i);

        const rawTitle = titleMatch?.[1]?.trim();
        const rawMeta = metaMatch?.[1]?.trim();
        suggestedTitle = rawTitle && !/^skip$/i.test(rawTitle) ? rawTitle : null;
        suggestedMetaDescription = rawMeta && !/^skip$/i.test(rawMeta) ? rawMeta : null;
        recommendations = recsMatch?.[1]?.trim() || recommendations;
      }
    }

    const altTextSuggestions = crawl.imagesMissingAltSrcs.length
      ? await suggestAltText({
          imageSrcs: crawl.imagesMissingAltSrcs,
          pageContext: crawl.title ?? crawl.finalUrl,
          apiKeyOverride,
        })
      : [];

    const { data: saved, error: saveError } = await supabase
      .from("seo_audits")
      .insert({
        organization_id: organizationId,
        created_by: user.id,
        url: crawl.finalUrl,
        score,
        checks: checklist,
        pagespeed,
        recommendations,
        suggested_title: suggestedTitle,
        suggested_meta_description: suggestedMetaDescription,
        alt_text_suggestions: altTextSuggestions,
      })
      .select()
      .single();

    if (saveError || !saved) throw new Error(saveError?.message ?? "Could not save audit");

    const fixes = await generateStructuredFixes({ crawl, checklist, apiKeyOverride });
    let savedFixes: Tables<"seo_audit_fixes">[] = [];
    if (fixes.length > 0) {
      const { data: insertedFixes } = await supabase
        .from("seo_audit_fixes")
        .insert(
          fixes.map((f) => ({
            audit_id: saved.id,
            organization_id: organizationId,
            fix_type: f.fixType,
            target_ref: f.targetRef,
            current_value: f.currentValue,
            suggested_value: f.suggestedValue,
            snippet: f.snippet,
          }))
        )
        .select();
      savedFixes = insertedFixes ?? [];
    }

    revalidatePath("/dashboard/analytics/seo-audit");
    return { success: true, audit: saved, fixes: savedFixes };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Audit failed";
    if (!apiKeyOverride) {
      await refundWalletCredits(organizationId, CREDIT_COSTS.SEO_AUDIT, "Refund: failed SEO audit");
    }
    return { error: message };
  }
}

export async function updateFixStatusAction(fixId: string, status: "APPROVED" | "REJECTED") {
  const supabase = await createClient();
  const { error } = await supabase.from("seo_audit_fixes").update({ status }).eq("id", fixId);
  if (error) {
    throw new Error(
      error.code === "42501" ? "You don't have permission to update this fix." : error.message
    );
  }
  revalidatePath("/dashboard/analytics/seo-audit");
}
