"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { crawlPage } from "@/lib/seo/crawler";
import { scanSite, summarizeScanForAi } from "@/lib/seo/site-scan";
import { analyzeScanWithAi, type ScanSuggestion, type AiScanAnalysis } from "@/lib/ai/ai-scan";
import { resolveOpenAiKey, debitWalletCredits, refundWalletCredits, CREDIT_COSTS } from "@/lib/ai/usage";
import type { SiteChange } from "@/features/seo/site-changes-queries";

const scanSchema = z.object({
  url: z.string().min(4, "Enter your website URL"),
  businessContext: z.string().optional(),
});

export async function runAiScanAction(
  organizationId: string,
  _prevState: unknown,
  formData: FormData
) {
  const parsed = scanSchema.safeParse({
    url: formData.get("url"),
    businessContext: formData.get("businessContext") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const apiKeyOverride = await resolveOpenAiKey(supabase, organizationId);
  const cost = CREDIT_COSTS.AI_SCAN;
  if (!apiKeyOverride) {
    const { error: debitError } = await debitWalletCredits(supabase, organizationId, cost, "AI Scan");
    if (debitError) return { error: debitError };
  }
  const apiKey = apiKeyOverride || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    if (!apiKeyOverride) await refundWalletCredits(organizationId, cost, "Refund: AI Scan (no API key)");
    return { error: "No OpenAI key configured. Add one under Settings → My API Keys." };
  }

  try {
    const scanData = await scanSite(parsed.data.url);
    if (!scanData.pages.some((p) => p.ok)) {
      throw new Error("Could not fetch any page from that site. Check the URL and try again.");
    }

    const analysis: AiScanAnalysis = await analyzeScanWithAi({
      scanText: summarizeScanForAi(scanData),
      businessContext: parsed.data.businessContext,
      apiKey,
    });

    const { data: scan, error: insertError } = await supabase
      .from("ai_scans")
      .insert({
        organization_id: organizationId,
        created_by: user.id,
        site_url: scanData.siteUrl,
        business_context: parsed.data.businessContext ?? null,
        pages_crawled: scanData.pages.filter((p) => p.ok).length,
        scores: analysis.scores,
        summary: analysis.summary,
        suggestions: analysis.suggestions as unknown as import("@/lib/supabase/database.types").Json,
      })
      .select("*")
      .single();
    if (insertError || !scan) throw new Error(insertError?.message ?? "Could not save scan");

    return { success: true, scanId: scan.id };
  } catch (err) {
    if (!apiKeyOverride) {
      await refundWalletCredits(organizationId, cost, "Refund: failed AI Scan");
    }
    return { error: err instanceof Error ? err.message : "AI Scan failed" };
  }
}

type ProposedRow = {
  page_url: string | null;
  change_type: string;
  label: string;
  current_value: string | null;
  proposed_value: string;
};

async function generateElementRewrite(
  apiKey: string,
  url: string,
  element: "TITLE" | "META" | "H1" | "H2" | "FAQ" | "SCHEMA",
  recommendation: string
): Promise<ProposedRow[]> {
  const crawl = await crawlPage(url);
  const context = [
    `URL: ${crawl.finalUrl}`,
    `Current title: ${crawl.title ?? "(missing)"}`,
    `Current meta description: ${crawl.metaDescription ?? "(missing)"}`,
    `Current H1(s): ${crawl.h1Text.join(" | ") || "(none)"}`,
    `Current H2s: ${crawl.h2Text.slice(0, 8).join(" | ") || "(none)"}`,
    `Existing schema types: ${crawl.schemaTypes.join(", ") || "(none)"}`,
    `Page content sample: ${crawl.bodyTextSample}`,
    `Auditor's recommendation for this fix: ${recommendation}`,
  ].join("\n");

  const instructions: Record<typeof element, string> = {
    TITLE: 'Rewrite the page title (30-60 chars, keyword-relevant, compelling). JSON: {"value": "..."}',
    META: 'Write a meta description (120-160 chars, intent-matching, with a hook). JSON: {"value": "..."}',
    H1: 'Write a single strong H1 for this page. JSON: {"value": "..."}',
    H2: 'Suggest 2-4 additional H2 section headings that improve topical coverage. JSON: {"value": "<h2>...</h2>\\n<h2>...</h2>"}',
    FAQ: 'Write 3-5 FAQ question/answer pairs grounded ONLY in the page content. JSON: {"faq": [{"q": "...", "a": "..."}]}',
    SCHEMA: 'Generate the most appropriate JSON-LD schema block for this page, grounded in visible content only. JSON: {"value": "<script type=\\"application/ld+json\\">...</script>"}',
  };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an on-page SEO editor executing an approved audit recommendation. " +
            "Respond with ONLY valid JSON, no markdown fences. " +
            instructions[element],
        },
        { role: "user", content: context },
      ],
      temperature: 0.5,
    }),
  });
  if (!res.ok) throw new Error(`Generation failed for ${url} (${res.status})`);
  const json = await res.json();
  let content: string = json.choices?.[0]?.message?.content ?? "{}";
  content = content.replace(/^```(json)?/i, "").replace(/```$/, "").trim();
  const ai = JSON.parse(content) as { value?: string; faq?: { q: string; a: string }[] };

  if (element === "FAQ" && ai.faq?.length) {
    const faqJsonLd = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: ai.faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    };
    return [
      {
        page_url: crawl.finalUrl,
        change_type: "FAQ",
        label: `FAQ section + schema on ${crawl.finalUrl}`,
        current_value: null,
        proposed_value: `<script type="application/ld+json">\n${JSON.stringify(faqJsonLd, null, 2)}\n</script>`,
      },
    ];
  }
  if (!ai.value) return [];
  if (element === "SCHEMA") {
    // Validate the JSON-LD inside the script tag before queueing it.
    const inner = ai.value.replace(/^[\s\S]*?<script[^>]*>/i, "").replace(/<\/script>[\s\S]*$/i, "").trim();
    try {
      const parsedLd = JSON.parse(inner);
      const items = Array.isArray(parsedLd) ? parsedLd : [parsedLd];
      for (const item of items) {
        if (!item["@context"] || !item["@type"]) throw new Error("missing @context/@type");
      }
    } catch {
      throw new Error(`Generated schema for ${url} failed validation — try Execute again.`);
    }
  }
  const currentByElement: Record<string, string | null> = {
    TITLE: crawl.title,
    META: crawl.metaDescription,
    H1: crawl.h1Text[0] ?? null,
    H2: null,
    SCHEMA: crawl.schemaTypes.join(", ") || null,
  };
  return [
    {
      page_url: crawl.finalUrl,
      change_type: element,
      label: `${element === "META" ? "Meta description" : element === "SCHEMA" ? "Schema markup" : element.charAt(0) + element.slice(1).toLowerCase()} on ${crawl.finalUrl}`,
      current_value: currentByElement[element],
      proposed_value: ai.value,
    },
  ];
}

async function generateDeterministicFix(
  url: string,
  type: "CANONICAL" | "OG" | "TWITTER_CARD"
): Promise<ProposedRow[]> {
  const crawl = await crawlPage(url);
  if (type === "CANONICAL") {
    if (crawl.hasCanonical) return [];
    return [
      {
        page_url: crawl.finalUrl,
        change_type: "CANONICAL",
        label: `Missing canonical tag on ${crawl.finalUrl}`,
        current_value: null,
        proposed_value: `<link rel="canonical" href="${crawl.finalUrl}" />`,
      },
    ];
  }
  if (type === "OG") {
    if (crawl.ogTitle && crawl.ogDescription && crawl.ogImage) return [];
    return [
      {
        page_url: crawl.finalUrl,
        change_type: "OG",
        label: `Missing/incomplete Open Graph tags on ${crawl.finalUrl}`,
        current_value: null,
        proposed_value: [
          !crawl.ogTitle ? `<meta property="og:title" content="${crawl.title ?? ""}" />` : "",
          !crawl.ogDescription ? `<meta property="og:description" content="${crawl.metaDescription ?? ""}" />` : "",
          !crawl.ogImage ? `<meta property="og:image" content="" /><!-- add an image URL -->` : "",
        ]
          .filter(Boolean)
          .join("\n"),
      },
    ];
  }
  if (crawl.twitterCard) return [];
  return [
    {
      page_url: crawl.finalUrl,
      change_type: "TWITTER_CARD",
      label: `Missing Twitter Card tags on ${crawl.finalUrl}`,
      current_value: null,
      proposed_value: `<meta name="twitter:card" content="summary_large_image" />\n<meta name="twitter:title" content="${crawl.title ?? ""}" />\n<meta name="twitter:description" content="${crawl.metaDescription ?? ""}" />`,
    },
  ];
}

/**
 * Turns one AI Scan suggestion into concrete proposed changes in the shared
 * site_changes queue (the same approve → edit → deploy-as-PR flow every other
 * SEO tool uses), then stamps the suggestion with its batch id.
 */
export async function executeSuggestionAction(
  organizationId: string,
  scanId: string,
  suggestionId: string
): Promise<{ error?: string; batchId?: string; changes?: SiteChange[] }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: scan } = await supabase
    .from("ai_scans")
    .select("*")
    .eq("id", scanId)
    .eq("organization_id", organizationId)
    .single();
  if (!scan) return { error: "Scan not found" };

  const suggestions = (scan.suggestions as unknown as ScanSuggestion[]) ?? [];
  const suggestion = suggestions.find((s) => s.id === suggestionId);
  if (!suggestion) return { error: "Suggestion not found" };
  if (suggestion.execute_type === "MANUAL") return { error: "This suggestion needs manual implementation" };
  if (suggestion.executed_batch_id) return { error: "Already executed" };

  const apiKeyOverride = await resolveOpenAiKey(supabase, organizationId);
  const needsAi = ["TITLE", "META", "H1", "H2", "FAQ", "SCHEMA"].includes(suggestion.execute_type);
  const cost = CREDIT_COSTS.SUGGESTION_EXECUTE;
  if (needsAi && !apiKeyOverride) {
    const { error: debitError } = await debitWalletCredits(supabase, organizationId, cost, `Execute: ${suggestion.title}`);
    if (debitError) return { error: debitError };
  }
  const apiKey = apiKeyOverride || process.env.OPENAI_API_KEY;

  const urls = (suggestion.affected_urls.length > 0 ? suggestion.affected_urls : [scan.site_url]).slice(0, 5);
  const batchId = crypto.randomUUID();

  try {
    const rows: ProposedRow[] = [];

    if (suggestion.execute_type === "ROBOTS") {
      const origin = new URL(scan.site_url.startsWith("http") ? scan.site_url : `https://${scan.site_url}`).origin;
      rows.push({
        page_url: null,
        change_type: "ROBOTS",
        label: `robots.txt for ${origin}`,
        current_value: null,
        proposed_value: `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml`,
      });
    } else if (suggestion.execute_type === "SITEMAP") {
      const origin = new URL(scan.site_url.startsWith("http") ? scan.site_url : `https://${scan.site_url}`).origin;
      const urlEntries = [origin, ...suggestion.affected_urls.filter((u) => u.startsWith(origin))];
      rows.push({
        page_url: null,
        change_type: "SITEMAP",
        label: `XML sitemap starting point for ${origin}`,
        current_value: null,
        proposed_value:
          `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemap.org/schemas/sitemap/0.9">\n` +
          [...new Set(urlEntries)].map((u) => `  <url><loc>${u}</loc></url>`).join("\n") +
          `\n</urlset>`,
      });
    } else if (["CANONICAL", "OG", "TWITTER_CARD"].includes(suggestion.execute_type)) {
      for (const url of urls) {
        rows.push(...(await generateDeterministicFix(url, suggestion.execute_type as "CANONICAL" | "OG" | "TWITTER_CARD")));
      }
    } else {
      if (!apiKey) throw new Error("No OpenAI key configured. Add one under Settings → My API Keys.");
      for (const url of urls) {
        rows.push(
          ...(await generateElementRewrite(
            apiKey,
            url,
            suggestion.execute_type as "TITLE" | "META" | "H1" | "H2" | "FAQ" | "SCHEMA",
            suggestion.recommendation
          ))
        );
      }
    }

    if (rows.length === 0) {
      return { error: "Nothing to generate — the affected pages already look fixed. Re-run the scan to refresh." };
    }

    const { data: inserted, error: insertError } = await supabase
      .from("site_changes")
      .insert(
        rows.map((r) => ({
          organization_id: organizationId,
          created_by: user.id,
          batch_id: batchId,
          page_url: r.page_url,
          change_type: r.change_type,
          label: r.label,
          current_value: r.current_value,
          proposed_value: r.proposed_value,
        }))
      )
      .select("*");
    if (insertError || !inserted) throw new Error(insertError?.message ?? "Could not queue changes");

    const updatedSuggestions = suggestions.map((s) =>
      s.id === suggestionId ? { ...s, executed_batch_id: batchId } : s
    );
    await supabase
      .from("ai_scans")
      .update({ suggestions: updatedSuggestions as unknown as import("@/lib/supabase/database.types").Json })
      .eq("id", scanId);

    return { batchId, changes: inserted };
  } catch (err) {
    if (needsAi && !apiKeyOverride) {
      await refundWalletCredits(organizationId, cost, `Refund: failed execute (${suggestion.title})`);
    }
    return { error: err instanceof Error ? err.message : "Execution failed" };
  }
}
