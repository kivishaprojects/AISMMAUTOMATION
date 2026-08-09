"use server";

import { createClient } from "@/lib/supabase/server";
import { crawlPage } from "@/lib/seo/crawler";
import { resolveOpenAiKey, debitWalletCredits, refundWalletCredits } from "@/lib/ai/usage";

const DOC_COST = 5;

async function runOpenAi(apiKey: string, system: string, user: string, model = "gpt-4o"): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.5,
    }),
  });
  if (!res.ok) throw new Error(`AI generation failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
  const json = await res.json();
  return json.choices?.[0]?.message?.content?.trim() ?? "";
}

async function crawlSummary(url: string): Promise<string> {
  const c = await crawlPage(url);
  return [
    `URL: ${c.finalUrl}`,
    `Title: ${c.title ?? "(missing)"} | Meta: ${c.metaDescription ?? "(missing)"}`,
    `H1: ${c.h1Text.join(" | ") || "(none)"} | H2s: ${c.h2Text.slice(0, 10).join(" | ") || "(none)"}`,
    `Schema: ${c.schemaTypes.join(", ") || "none"} | FAQ schema: ${c.hasFaqSchema} | Words: ${c.wordCount}`,
    `Internal links (${c.internalLinks.length}): ${c.internalLinks.slice(0, 15).join(", ")}`,
    `Content sample: ${c.bodyTextSample}`,
  ].join("\n");
}

/**
 * Generic engine behind Content Studio, LLM/GEO Optimizer, Internal Linking,
 * and Competitor Intelligence: gather optional crawl context, run one prompt,
 * save the markdown result as a content_doc.
 */
export async function generateContentDocAction(
  organizationId: string,
  _prevState: unknown,
  formData: FormData
) {
  const docType = String(formData.get("docType") ?? "");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const apiKeyOverride = await resolveOpenAiKey(supabase, organizationId);
  if (!apiKeyOverride) {
    const { error: debitError } = await debitWalletCredits(supabase, organizationId, DOC_COST, `SEO tool: ${docType}`);
    if (debitError) return { error: debitError };
  }
  const apiKey = apiKeyOverride || process.env.OPENAI_API_KEY;
  if (!apiKey) return { error: "No OpenAI key available. Add one under Settings → My API Keys." };

  try {
    let system = "";
    let userMsg = "";
    let title = "";
    let inputContext = "";

    if (docType === "CONTENT_BRIEF" || docType === "ARTICLE" || docType === "FAQ_SET" || docType === "META_SET") {
      const topic = String(formData.get("topic") ?? "").trim();
      const audience = String(formData.get("audience") ?? "").trim();
      const language = String(formData.get("language") ?? "English").trim() || "English";
      const url = String(formData.get("url") ?? "").trim();
      if (!topic) throw new Error("Enter a topic or target keyword");
      const pageContext = url ? `\n\nExisting page to consider:\n${await crawlSummary(url)}` : "";
      inputContext = `Topic: ${topic}${audience ? ` | Audience: ${audience}` : ""} | Language: ${language}${url ? ` | URL: ${url}` : ""}`;

      const modes: Record<string, [string, string]> = {
        CONTENT_BRIEF: [
          "You are an SEO content strategist. Produce a complete SEO content brief in clean markdown: primary keyword, secondary keywords, search intent, target audience, recommended title + H1, full H2/H3 outline, questions to answer, entities to cover, internal/external link opportunities, FAQ suggestions, schema recommendation, and GEO/AI-search opportunities. Ground everything in the topic; do not invent statistics.",
          `Create a content brief for: "${topic}"${audience ? ` targeting ${audience}` : ""}. Write in ${language}.${pageContext}`,
        ],
        ARTICLE: [
          "You are an expert SEO writer. Write a well-structured, genuinely useful article in clean markdown: compelling title, intro, clear H2/H3 sections, FAQ section at the end, and a suggested meta description. Never fabricate statistics, studies, or product specifications — write from general knowledge and clearly hedge anything uncertain.",
          `Write an SEO article about: "${topic}"${audience ? ` for ${audience}` : ""}. Language: ${language}.${pageContext}`,
        ],
        FAQ_SET: [
          "You are an SEO editor. Produce 8-12 FAQ question/answer pairs in markdown, followed by the matching FAQPage JSON-LD in a code block. Answers must be concise, direct-answer formatted (good for AI answer engines), and free of invented facts.",
          `Create FAQs for: "${topic}"${audience ? ` (audience: ${audience})` : ""}. Language: ${language}.${pageContext}`,
        ],
        META_SET: [
          "You are an on-page SEO editor. Produce 5 title tag options (30-60 chars each, with char counts) and 5 meta description options (120-160 chars each, with char counts) in markdown, then recommend the best pairing and explain why in two sentences.",
          `Generate title + meta description options for: "${topic}"${audience ? ` (audience: ${audience})` : ""}. Language: ${language}.${pageContext}`,
        ],
      };
      [system, userMsg] = modes[docType];
      title = `${docType === "CONTENT_BRIEF" ? "Brief" : docType === "ARTICLE" ? "Article" : docType === "FAQ_SET" ? "FAQs" : "Titles & metas"}: ${topic}`;
    } else if (docType === "GEO_OPTIMIZE") {
      const url = String(formData.get("url") ?? "").trim();
      if (!url) throw new Error("Enter the page URL to optimize");
      const page = await crawlSummary(url);
      inputContext = url;
      title = `GEO optimization: ${url}`;
      system =
        "You are a GEO (Generative Engine Optimization) specialist. Analyze the crawled page and produce a markdown report that makes it more likely AI answer engines (ChatGPT, Perplexity, Gemini, AI Overviews) understand, quote, and cite this page. Cover: (1) GEO readiness assessment of what's there now; (2) direct-answer formatting fixes — where to add concise definitional sentences; (3) entity clarity — which entities to name explicitly; (4) Q&A restructuring with concrete rewritten examples based on the actual content; (5) citation-friendly phrasing rewrites; (6) structured-information opportunities (tables, lists, schema). Every suggestion must reference the actual page content — never invent facts about the business.";
      userMsg = `Crawled page:\n${page}`;
    } else if (docType === "INTERNAL_LINKING") {
      const urlsRaw = String(formData.get("urls") ?? "").trim();
      const urls = urlsRaw.split("\n").map((u) => u.trim()).filter(Boolean).slice(0, 8);
      if (urls.length < 2) throw new Error("Enter at least 2 page URLs (one per line)");
      inputContext = urls.join("\n");
      title = `Internal linking plan (${urls.length} pages)`;
      const summaries: string[] = [];
      const linkMap: string[] = [];
      const crawls = await Promise.all(urls.map((u) => crawlPage(u).catch(() => null)));
      crawls.forEach((c, i) => {
        if (!c) {
          summaries.push(`- ${urls[i]}: FAILED TO FETCH`);
          return;
        }
        summaries.push(`- ${c.finalUrl}\n  H1: ${c.h1Text[0] ?? "(none)"} | Topic sample: ${c.bodyTextSample.slice(0, 200)}`);
        const linksToOthers = urls.filter((u, j) => j !== i && c.internalLinks.some((l) => l.replace(/\/$/, "") === u.replace(/\/$/, "")));
        linkMap.push(`${c.finalUrl} links to: ${linksToOthers.join(", ") || "(none of the provided pages)"}`);
      });
      system =
        "You are an internal-linking strategist. Given a set of pages (topics + existing cross-links between them), produce a markdown report: (1) orphan/under-linked pages within this set; (2) a concrete linking plan — for each recommended link give source page, target page, suggested anchor text, and where in the content it fits (based on the topic samples); (3) anchor-text guidance. Only recommend links between the provided pages.";
      userMsg = `Pages:\n${summaries.join("\n")}\n\nExisting links between these pages:\n${linkMap.join("\n")}`;
    } else if (docType === "COMPETITOR_ANALYSIS") {
      const yourUrl = String(formData.get("yourUrl") ?? "").trim();
      const competitorUrl = String(formData.get("competitorUrl") ?? "").trim();
      if (!yourUrl || !competitorUrl) throw new Error("Enter both your page URL and the competitor's");
      inputContext = `${yourUrl} vs ${competitorUrl}`;
      title = `Competitor gap: ${new URL(yourUrl.startsWith("http") ? yourUrl : `https://${yourUrl}`).hostname} vs ${new URL(competitorUrl.startsWith("http") ? competitorUrl : `https://${competitorUrl}`).hostname}`;
      const [yours, theirs] = await Promise.all([crawlSummary(yourUrl), crawlSummary(competitorUrl)]);
      system =
        "You are a competitive SEO analyst. Compare the two crawled pages and produce a markdown gap analysis: side-by-side comparison table (title/meta quality, heading structure, content depth by word count, schema, FAQ coverage, internal linking); content gaps — topics/questions the competitor covers that your page doesn't; structural advantages either side has; and a prioritized action list to close the gap. Base everything strictly on the crawled data — note that this compares these two pages only, not full-site authority or backlinks.";
      userMsg = `YOUR PAGE:\n${yours}\n\nCOMPETITOR PAGE:\n${theirs}`;
    } else {
      throw new Error("Unknown tool type");
    }

    const content = await runOpenAi(apiKey, system, userMsg);
    if (!content) throw new Error("AI returned an empty result — try again");

    const { data: saved, error: saveError } = await supabase
      .from("content_docs")
      .insert({
        organization_id: organizationId,
        created_by: user.id,
        doc_type: docType,
        title,
        input_context: inputContext,
        content,
      })
      .select("*")
      .single();
    if (saveError || !saved) throw new Error(saveError?.message ?? "Could not save result");

    return { success: true, doc: saved };
  } catch (err) {
    if (!apiKeyOverride) {
      await refundWalletCredits(organizationId, DOC_COST, `Refund: failed ${docType}`);
    }
    return { error: err instanceof Error ? err.message : "Generation failed" };
  }
}

export async function deleteContentDocAction(id: string) {
  const supabase = await createClient();
  await supabase.from("content_docs").delete().eq("id", id);
}

/** AI SEO Assistant: answers questions grounded in the org's own tool data. */
export async function askSeoAssistantAction(
  organizationId: string,
  messages: { role: "user" | "assistant"; content: string }[]
): Promise<{ error?: string; reply?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const apiKeyOverride = await resolveOpenAiKey(supabase, organizationId);
  if (!apiKeyOverride) {
    const { error: debitError } = await debitWalletCredits(supabase, organizationId, 1, "SEO assistant message");
    if (debitError) return { error: debitError };
  }
  const apiKey = apiKeyOverride || process.env.OPENAI_API_KEY;
  if (!apiKey) return { error: "No OpenAI key available. Add one under Settings → My API Keys." };

  try {
    const [{ data: scans }, { data: changes }, { data: prompts }] = await Promise.all([
      supabase.from("ai_scans").select("site_url, scores, summary, created_at").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(2),
      supabase.from("site_changes").select("status").eq("organization_id", organizationId),
      supabase.from("geo_tracked_prompts").select("prompt, brand_name").eq("organization_id", organizationId).limit(10),
    ]);
    const statusCounts: Record<string, number> = {};
    for (const c of changes ?? []) statusCounts[c.status] = (statusCounts[c.status] ?? 0) + 1;

    const context = [
      "Workspace data (real, from this user's account):",
      `Recent AI Scans: ${(scans ?? []).map((s) => `${s.site_url} scored ${JSON.stringify(s.scores)} on ${s.created_at.slice(0, 10)} — ${s.summary?.slice(0, 200)}`).join(" || ") || "none yet"}`,
      `Site changes by status: ${JSON.stringify(statusCounts)}`,
      `Tracked GEO prompts: ${(prompts ?? []).map((p) => p.prompt).join("; ") || "none"}`,
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
              "You are the AIDigiMarket SEO assistant. Answer questions about SEO/GEO strategy and about the user's own workspace data (provided below). Be concise and practical. When a task maps to a platform tool, point them to it: AI Scan (full-site audit + executable fixes), On-Page Checker, Crawlability, Keyword Intelligence, Competitor Intelligence, Content Studio, Internal Linking, Technical SEO Auditor, Schema Generator, Rank & AI Visibility, LLM/GEO Optimization, SEO Command Center. Never invent data that isn't in the workspace context.\n\n" +
              context,
          },
          ...messages.slice(-12),
        ],
        temperature: 0.4,
      }),
    });
    if (!res.ok) throw new Error(`Assistant failed (${res.status})`);
    const json = await res.json();
    return { reply: json.choices?.[0]?.message?.content ?? "" };
  } catch (err) {
    if (!apiKeyOverride) await refundWalletCredits(organizationId, 1, "Refund: failed assistant message");
    return { error: err instanceof Error ? err.message : "Assistant failed" };
  }
}
