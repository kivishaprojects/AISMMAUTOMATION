"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { crawlPage } from "@/lib/seo/crawler";
import { resolveOpenAiKey, debitWalletCredits, refundWalletCredits, CREDIT_COSTS } from "@/lib/ai/usage";

const schema = z.object({
  urls: z.string().min(5, "Enter at least one page URL"),
});

type ProposedRow = {
  change_type: string;
  label: string;
  current_value: string | null;
  proposed_value: string;
};

export async function runOnPageCheckAction(
  organizationId: string,
  _prevState: unknown,
  formData: FormData
) {
  const parsed = schema.safeParse({ urls: formData.get("urls") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const urls = parsed.data.urls.split("\n").map((u) => u.trim()).filter(Boolean).slice(0, 10);

  const apiKeyOverride = await resolveOpenAiKey(supabase, organizationId);
  const cost = CREDIT_COSTS.SEO_AUDIT * urls.length;
  if (!apiKeyOverride) {
    const { error: debitError } = await debitWalletCredits(supabase, organizationId, cost, `On-page check (${urls.length} pages)`);
    if (debitError) return { error: debitError };
  }

  const apiKey = apiKeyOverride || process.env.OPENAI_API_KEY;
  const batchId = crypto.randomUUID();
  let processedCount = 0;

  try {
    for (const url of urls) {
      const crawl = await crawlPage(url);
      const rows: ProposedRow[] = [];

      if (apiKey) {
        const context = [
          `URL: ${crawl.finalUrl}`,
          `Current title: ${crawl.title ?? "(missing)"}`,
          `Current meta description: ${crawl.metaDescription ?? "(missing)"}`,
          `Current H1(s): ${crawl.h1Text.join(" | ") || "(none)"}`,
          `Current H2s: ${crawl.h2Text.slice(0, 8).join(" | ") || "(none)"}`,
          `Page content sample: ${crawl.bodyTextSample}`,
        ].join("\n");

        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content:
                  "You are an on-page SEO editor. Given a page's current elements, propose improved " +
                  "versions ONLY for elements that are missing or clearly weak (bad length, generic, " +
                  "keyword-thin, or duplicate-sounding). Skip elements that already look solid. " +
                  "Respond with ONLY valid JSON, no markdown fences, in this shape:\n" +
                  '{"title": "... or null if current is fine", "meta_description": "... or null", ' +
                  '"h1": "... or null", "additional_h2s": ["...", "..."] or [], ' +
                  '"faq": [{"q":"...","a":"..."}] or [], "cta_suggestion": "... or null"}',
              },
              { role: "user", content: context },
            ],
            temperature: 0.5,
          }),
        });

        if (res.ok) {
          const json = await res.json();
          let content: string = json.choices?.[0]?.message?.content ?? "{}";
          content = content.replace(/^```(json)?/i, "").replace(/```$/, "").trim();
          const ai = JSON.parse(content) as {
            title?: string | null;
            meta_description?: string | null;
            h1?: string | null;
            additional_h2s?: string[];
            faq?: { q: string; a: string }[];
            cta_suggestion?: string | null;
          };

          if (ai.title) rows.push({ change_type: "TITLE", label: `Title on ${crawl.finalUrl}`, current_value: crawl.title, proposed_value: ai.title });
          if (ai.meta_description) rows.push({ change_type: "META", label: `Meta description on ${crawl.finalUrl}`, current_value: crawl.metaDescription, proposed_value: ai.meta_description });
          if (ai.h1) rows.push({ change_type: "H1", label: `H1 on ${crawl.finalUrl}`, current_value: crawl.h1Text[0] ?? null, proposed_value: ai.h1 });
          if (ai.additional_h2s?.length) {
            rows.push({ change_type: "H2", label: `Suggested additional H2s on ${crawl.finalUrl}`, current_value: null, proposed_value: ai.additional_h2s.map((h) => `<h2>${h}</h2>`).join("\n") });
          }
          if (ai.faq?.length) {
            const faqJsonLd = {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: ai.faq.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: f.a },
              })),
            };
            rows.push({
              change_type: "FAQ",
              label: `FAQ section + schema on ${crawl.finalUrl}`,
              current_value: null,
              proposed_value: `<script type="application/ld+json">\n${JSON.stringify(faqJsonLd, null, 2)}\n</script>`,
            });
          }
          if (ai.cta_suggestion) {
            rows.push({ change_type: "CTA", label: `CTA suggestion on ${crawl.finalUrl}`, current_value: crawl.ctaTexts[0] ?? null, proposed_value: ai.cta_suggestion });
          }
        }
      }

      if (!crawl.hasCanonical) {
        rows.push({ change_type: "CANONICAL", label: `Missing canonical tag on ${crawl.finalUrl}`, current_value: null, proposed_value: `<link rel="canonical" href="${crawl.finalUrl}" />` });
      }
      if (!crawl.ogTitle || !crawl.ogDescription || !crawl.ogImage) {
        rows.push({
          change_type: "OG",
          label: `Missing/incomplete Open Graph tags on ${crawl.finalUrl}`,
          current_value: null,
          proposed_value: [
            !crawl.ogTitle ? `<meta property="og:title" content="${crawl.title ?? ""}" />` : "",
            !crawl.ogDescription ? `<meta property="og:description" content="${crawl.metaDescription ?? ""}" />` : "",
            !crawl.ogImage ? `<meta property="og:image" content="" /><!-- add an image URL -->` : "",
          ].filter(Boolean).join("\n"),
        });
      }
      if (!crawl.twitterCard) {
        rows.push({
          change_type: "TWITTER_CARD",
          label: `Missing Twitter Card tags on ${crawl.finalUrl}`,
          current_value: null,
          proposed_value: `<meta name="twitter:card" content="summary_large_image" />\n<meta name="twitter:title" content="${crawl.title ?? ""}" />\n<meta name="twitter:description" content="${crawl.metaDescription ?? ""}" />`,
        });
      }

      if (rows.length > 0) {
        await supabase.from("site_changes").insert(
          rows.map((r) => ({
            organization_id: organizationId,
            created_by: user.id,
            batch_id: batchId,
            page_url: crawl.finalUrl,
            change_type: r.change_type,
            label: r.label,
            current_value: r.current_value,
            proposed_value: r.proposed_value,
          }))
        );
      }
      processedCount++;
    }

    return { success: true, batchId, pagesProcessed: processedCount };
  } catch (err) {
    const message = err instanceof Error ? err.message : "On-page check failed";
    if (!apiKeyOverride) {
      await refundWalletCredits(organizationId, cost, "Refund: failed on-page check");
    }
    return { error: message };
  }
}
