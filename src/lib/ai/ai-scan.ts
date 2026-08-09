import "server-only";

export type ScanScores = {
  overall: number;
  technical: number;
  onPage: number;
  content: number;
  structuredData: number;
  geoReadiness: number;
};

export type ScanSuggestion = {
  id: string;
  category: "TECHNICAL" | "ON_PAGE" | "CONTENT" | "SCHEMA" | "GEO" | "PERFORMANCE";
  title: string;
  problem: string;
  why_it_matters: string;
  recommendation: string;
  expected_outcome: string;
  affected_urls: string[];
  impact: "HIGH" | "MEDIUM" | "LOW";
  difficulty: "LOW" | "MEDIUM" | "HIGH";
  // Executable types map onto the site_changes framework; MANUAL means guidance only.
  execute_type:
    | "TITLE"
    | "META"
    | "H1"
    | "H2"
    | "FAQ"
    | "CANONICAL"
    | "OG"
    | "TWITTER_CARD"
    | "SCHEMA"
    | "ROBOTS"
    | "SITEMAP"
    | "MANUAL";
  executed_batch_id?: string | null;
};

export type AiScanAnalysis = {
  summary: string;
  scores: ScanScores;
  suggestions: ScanSuggestion[];
};

const SYSTEM_PROMPT = [
  "You are a senior SEO and GEO (Generative Engine Optimization) auditor. You receive raw crawl data",
  "for a website (multiple pages, robots/sitemap state, duplicates, broken links) plus optional business context.",
  "Produce a rigorous, evidence-based review. Only cite problems visible in the data — never invent pages,",
  "statistics, or issues you cannot see. Cover both classic SEO and GEO/AI-search readiness (entity clarity,",
  "question coverage, citation-worthiness, structured information AI engines can quote).",
  "",
  "Respond with ONLY valid JSON, no markdown fences, in exactly this shape:",
  `{"summary": "3-5 sentence executive overview of the site's SEO/GEO state",`,
  ` "scores": {"overall": 0-100, "technical": 0-100, "onPage": 0-100, "content": 0-100, "structuredData": 0-100, "geoReadiness": 0-100},`,
  ` "suggestions": [{`,
  `   "category": "TECHNICAL|ON_PAGE|CONTENT|SCHEMA|GEO|PERFORMANCE",`,
  `   "title": "short imperative title",`,
  `   "problem": "what is wrong, with the evidence from the crawl",`,
  `   "why_it_matters": "SEO/GEO impact explained plainly",`,
  `   "recommendation": "specifically what to change",`,
  `   "expected_outcome": "what should improve",`,
  `   "affected_urls": ["only URLs that appear in the crawl data"],`,
  `   "impact": "HIGH|MEDIUM|LOW",`,
  `   "difficulty": "LOW|MEDIUM|HIGH",`,
  `   "execute_type": "TITLE|META|H1|H2|FAQ|CANONICAL|OG|TWITTER_CARD|SCHEMA|ROBOTS|SITEMAP|MANUAL"`,
  ` }]}`,
  "",
  "execute_type rules: use the specific type when the fix is generating/rewriting that exact element on the",
  "affected pages (the platform can then auto-generate the change for approval). Use MANUAL for anything",
  "requiring content writing, design, server config, or human judgment. 8-15 suggestions, ordered by impact.",
].join("\n");

export async function analyzeScanWithAi({
  scanText,
  businessContext,
  apiKey,
}: {
  scanText: string;
  businessContext?: string | null;
  apiKey: string;
}): Promise<AiScanAnalysis> {
  const userContent = [
    businessContext ? `Business context provided by the site owner: ${businessContext}` : "",
    "Crawl data:",
    scanText,
  ]
    .filter(Boolean)
    .join("\n\n");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`AI analysis failed (${response.status}): ${body.slice(0, 300)}`);
  }

  const data = await response.json();
  let content: string = data?.choices?.[0]?.message?.content ?? "{}";
  content = content.replace(/^```(json)?/i, "").replace(/```$/, "").trim();
  const parsed = JSON.parse(content) as Omit<AiScanAnalysis, "suggestions"> & {
    suggestions: Omit<ScanSuggestion, "id">[];
  };

  const clamp = (n: unknown) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));
  return {
    summary: parsed.summary ?? "",
    scores: {
      overall: clamp(parsed.scores?.overall),
      technical: clamp(parsed.scores?.technical),
      onPage: clamp(parsed.scores?.onPage),
      content: clamp(parsed.scores?.content),
      structuredData: clamp(parsed.scores?.structuredData),
      geoReadiness: clamp(parsed.scores?.geoReadiness),
    },
    suggestions: (parsed.suggestions ?? []).slice(0, 20).map((s) => ({
      ...s,
      id: crypto.randomUUID(),
      affected_urls: (s.affected_urls ?? []).slice(0, 10),
      executed_batch_id: null,
    })),
  };
}
