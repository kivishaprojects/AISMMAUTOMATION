import "server-only";

export type AltTextSuggestion = { src: string; suggestedAlt: string };

/**
 * Suggests real alt text for a sample of images missing it, using vision
 * so the suggestion actually describes what's in the image rather than
 * guessing from the filename. Capped at a handful of images to keep this
 * fast and cheap \u2014 a full-page audit isn't meant to caption every image
 * on a large gallery page.
 */
export async function suggestAltText({
  imageSrcs,
  pageContext,
  apiKeyOverride,
}: {
  imageSrcs: string[];
  pageContext: string;
  apiKeyOverride?: string | null;
}): Promise<AltTextSuggestion[]> {
  const apiKey = apiKeyOverride || process.env.OPENAI_API_KEY;
  if (!apiKey || imageSrcs.length === 0) return [];

  const sample = imageSrcs.slice(0, 8);

  const results = await Promise.all(
    sample.map(async (src): Promise<AltTextSuggestion | null> => {
      try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text:
                      `Write concise, descriptive alt text (under 125 characters) for this image, ` +
                      `for a page about: ${pageContext}. Respond with ONLY the alt text, no quotes, no explanation.`,
                  },
                  { type: "image_url", image_url: { url: src } },
                ],
              },
            ],
            max_tokens: 60,
          }),
        });
        if (!res.ok) return null;
        const json = await res.json();
        const text = json.choices?.[0]?.message?.content?.trim();
        return text ? { src, suggestedAlt: text } : null;
      } catch {
        return null;
      }
    })
  );

  return results.filter((r): r is AltTextSuggestion => r !== null);
}
