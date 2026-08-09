"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { resolveOpenAiKey, debitWalletCredits, refundWalletCredits, CREDIT_COSTS } from "@/lib/ai/usage";

const schema = z
  .object({
    topic: z.string().optional(),
    keywords: z.string().optional(),
  })
  .refine((v) => (v.keywords ?? "").trim().length >= 5 || (v.topic ?? "").trim().length >= 3, {
    message: "Paste keywords (one per line), or enter a topic to discover keywords from",
  });

export type KeywordCluster = {
  topic: string;
  intent: "informational" | "commercial" | "transactional" | "navigational";
  keywords: string[];
};

export async function analyzeKeywordsAction(
  organizationId: string,
  _prevState: unknown,
  formData: FormData
) {
  const parsed = schema.safeParse({
    topic: formData.get("topic") || undefined,
    keywords: formData.get("keywords"),
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
  if (!apiKeyOverride) {
    const { error: debitError } = await debitWalletCredits(
      supabase,
      organizationId,
      CREDIT_COSTS.KEYWORD_ANALYSIS,
      "Keyword intelligence report"
    );
    if (debitError) return { error: debitError };
  }

  const apiKey = apiKeyOverride || process.env.OPENAI_API_KEY;
  if (!apiKey) return { error: "No OpenAI key available. Add one under Settings \u2192 My API Keys." };

  const keywordList = (parsed.data.keywords ?? "")
    .split("\n")
    .map((k) => k.trim())
    .filter(Boolean);
  const discoveryMode = keywordList.length === 0;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: discoveryMode
              ? "You are an SEO strategist doing keyword discovery. Given a seed topic/niche, generate " +
                "30-45 realistic search keywords people actually type, spanning: informational, commercial, " +
                "transactional, question-form, long-tail, and comparison queries. Do NOT invent search " +
                "volumes or difficulty numbers. Group the generated keywords into topic clusters and " +
                "classify each cluster's dominant intent as exactly one of: informational, commercial, " +
                "transactional, navigational. Also list 3-6 further subtopic gaps worth exploring. " +
                "Respond with ONLY valid JSON, no markdown fences, in this shape:\n" +
                '{"clusters": [{"topic": "...", "intent": "informational", "keywords": ["...","..."]}], "gaps": "1. ...\\n2. ..."}'
              : "You are an SEO strategist. Given a list of keywords, group them into topic " +
                "clusters, and classify the dominant search intent of each cluster as exactly one " +
                "of: informational, commercial, transactional, navigational. Every input keyword " +
                "must appear in exactly one cluster. Also identify 3-6 topic gaps \u2014 related " +
                "subtopics or questions that are NOT covered by this keyword list but likely should " +
                "be, given the topic. Respond with ONLY valid JSON, no markdown fences, in this shape:\n" +
                '{"clusters": [{"topic": "...", "intent": "informational", "keywords": ["...","..."]}], "gaps": "1. ...\\n2. ..."}',
          },
          {
            role: "user",
            content: discoveryMode
              ? `Seed topic/niche to discover keywords for: ${parsed.data.topic}`
              : `Topic/niche: ${parsed.data.topic || "(not specified, infer from the keywords)"}\n\nKeywords:\n${keywordList.join("\n")}`,
          },
        ],
        temperature: 0.4,
      }),
    });

    if (!res.ok) throw new Error(`Keyword analysis failed: ${await res.text()}`);
    const json = await res.json();
    let content: string = json.choices?.[0]?.message?.content ?? "{}";
    content = content.replace(/^```(json)?/i, "").replace(/```$/, "").trim();
    const parsedResult = JSON.parse(content) as { clusters: KeywordCluster[]; gaps: string };

    const { data: saved, error: saveError } = await supabase
      .from("keyword_reports")
      .insert({
        organization_id: organizationId,
        created_by: user.id,
        topic: parsed.data.topic || null,
        keywords_input: discoveryMode
          ? parsedResult.clusters.flatMap((c) => c.keywords).join("\n")
          : (parsed.data.keywords ?? ""),
        clusters: parsedResult.clusters,
        gaps: parsedResult.gaps,
      })
      .select()
      .single();

    if (saveError || !saved) throw new Error(saveError?.message ?? "Could not save report");

    return { success: true, report: saved };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Keyword analysis failed";
    if (!apiKeyOverride) {
      await refundWalletCredits(organizationId, CREDIT_COSTS.KEYWORD_ANALYSIS, "Refund: failed keyword analysis");
    }
    return { error: message };
  }
}
