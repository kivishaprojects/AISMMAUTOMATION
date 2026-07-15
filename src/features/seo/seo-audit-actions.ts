"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { crawlPage, checkBrokenLinks, buildOnPageChecklist } from "@/lib/seo/crawler";
import { getPageSpeedData } from "@/lib/seo/pagespeed";
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
    const apiKey = apiKeyOverride || process.env.OPENAI_API_KEY;
    if (apiKey) {
      const summary = [
        `URL: ${crawl.finalUrl}`,
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
                "You are a technical SEO consultant. Given real on-page audit findings, write 4-6 " +
                "specific, prioritized, actionable fixes. Be concrete, not generic. Numbered list, " +
                "1-2 sentences each.",
            },
            { role: "user", content: summary },
          ],
          temperature: 0.5,
        }),
      });
      if (aiRes.ok) {
        const json = await aiRes.json();
        recommendations = json.choices?.[0]?.message?.content ?? recommendations;
      }
    }

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
      })
      .select()
      .single();

    if (saveError || !saved) throw new Error(saveError?.message ?? "Could not save audit");

    revalidatePath("/dashboard/analytics/seo-audit");
    return { success: true, audit: saved };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Audit failed";
    if (!apiKeyOverride) {
      await refundWalletCredits(organizationId, CREDIT_COSTS.SEO_AUDIT, "Refund: failed SEO audit");
    }
    return { error: message };
  }
}
