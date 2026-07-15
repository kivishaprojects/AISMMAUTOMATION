import "server-only";
import type { CrawlResult, SeoCheck } from "@/lib/seo/crawler";

export type StructuredFix = {
  fixType: "TITLE" | "META_DESCRIPTION" | "H1" | "ALT_TEXT";
  targetRef: string | null;
  currentValue: string | null;
  suggestedValue: string;
  snippet: string;
};

/**
 * Turns failing checks into concrete before/after fixes with ready-to-
 * paste HTML snippets \u2014 deliberately not a free-text paragraph, since
 * "add better alt text" isn't actionable but 'alt="Raj Kapoor and Nargis
 * in a still from Awaara (1951)"' is.
 */
export async function generateStructuredFixes({
  crawl,
  checklist,
  apiKeyOverride,
}: {
  crawl: CrawlResult;
  checklist: SeoCheck[];
  apiKeyOverride?: string | null;
}): Promise<StructuredFix[]> {
  const apiKey = apiKeyOverride || process.env.OPENAI_API_KEY;
  if (!apiKey) return [];

  const failing = new Set(checklist.filter((c) => !c.passed).map((c) => c.label));
  const needsTitleFix = failing.has("Title tag present") || failing.has("Title length reasonable (30-60 chars)");
  const needsMetaFix = failing.has("Meta description present") || failing.has("Meta description length reasonable (120-160 chars)");
  const needsH1Fix = failing.has("Exactly one H1");
  const needsAltFixes = failing.has("All images have alt text") && crawl.imagesMissingAltSample.length > 0;

  if (!needsTitleFix && !needsMetaFix && !needsH1Fix && !needsAltFixes) return [];

  const prompt = [
    `Page URL: ${crawl.finalUrl}`,
    `Current title (${crawl.title?.length ?? 0} chars): ${crawl.title ?? "(missing)"}`,
    `Current meta description (${crawl.metaDescription?.length ?? 0} chars): ${crawl.metaDescription ?? "(missing)"}`,
    `Current H1s found: ${crawl.h1Count}`,
    `Page content sample: ${crawl.bodyTextSample}`,
    needsAltFixes
      ? `Images missing alt text (with surrounding page context):\n${crawl.imagesMissingAltSample
          .map((img, i) => `${i + 1}. src: ${img.src}\n   context: ${img.nearbyText}`)
          .join("\n")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You write specific SEO fixes for a real page, based only on the real data given. " +
            "Respond with ONLY a JSON object, no markdown fences, no explanation, in this exact shape:\n" +
            `{"title": "new title text or null", "metaDescription": "new meta description or null", ` +
            `"h1": "suggested H1 text or null", "altTexts": [{"src": "same src as given", "alt": "specific alt text describing that image"}]}\n` +
            "Only include title/metaDescription/h1 if that fix was actually needed (based on what's " +
            "described as missing or wrong). Title should be 50-60 chars, meta description 120-160 chars. " +
            "Alt text must be specific to the image's likely content based on context given, not generic.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.4,
    }),
  });

  if (!res.ok) return [];
  const json = await res.json();
  let content: string = json.choices?.[0]?.message?.content ?? "{}";
  content = content.replace(/^```(json)?/i, "").replace(/```$/, "").trim();

  let parsed: {
    title?: string | null;
    metaDescription?: string | null;
    h1?: string | null;
    altTexts?: { src: string; alt: string }[];
  };
  try {
    parsed = JSON.parse(content);
  } catch {
    return [];
  }

  const fixes: StructuredFix[] = [];

  if (needsTitleFix && parsed.title) {
    fixes.push({
      fixType: "TITLE",
      targetRef: null,
      currentValue: crawl.title,
      suggestedValue: parsed.title,
      snippet: `<title>${parsed.title}</title>`,
    });
  }
  if (needsMetaFix && parsed.metaDescription) {
    fixes.push({
      fixType: "META_DESCRIPTION",
      targetRef: null,
      currentValue: crawl.metaDescription,
      suggestedValue: parsed.metaDescription,
      snippet: `<meta name="description" content="${parsed.metaDescription.replace(/"/g, "&quot;")}">`,
    });
  }
  if (needsH1Fix && parsed.h1) {
    fixes.push({
      fixType: "H1",
      targetRef: null,
      currentValue: null,
      suggestedValue: parsed.h1,
      snippet: `<h1>${parsed.h1}</h1>`,
    });
  }
  if (needsAltFixes && parsed.altTexts) {
    for (const item of parsed.altTexts) {
      fixes.push({
        fixType: "ALT_TEXT",
        targetRef: item.src,
        currentValue: null,
        suggestedValue: item.alt,
        snippet: `<img src="${item.src}" alt="${item.alt.replace(/"/g, "&quot;")}">`,
      });
    }
  }

  return fixes;
}
