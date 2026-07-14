import "server-only";

type CaptionResult = {
  caption: string;
  hashtags: string[];
};

/**
 * Generates a caption + hashtags for a piece of visual content, steered by
 * the original image prompt and (optionally) the brand's tone of voice.
 * Uses a plain-text delimited format rather than JSON mode to keep this
 * working across any chat-completions-compatible model without relying on
 * structured-output support.
 */
export async function generateCaptionOpenAI({
  imagePrompt,
  brandTone,
}: {
  imagePrompt: string;
  brandTone?: string | null;
}): Promise<CaptionResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not set. Add it in your environment variables."
    );
  }

  const systemPrompt = [
    "You write short, high-converting social media captions for small businesses.",
    "Respond in exactly this format, nothing else:",
    "CAPTION: <the caption, 1-3 sentences, no hashtags inside it>",
    "HASHTAGS: <8-12 relevant hashtags separated by spaces, each starting with #>",
  ].join(" ");

  const userPrompt = [
    `The image being posted was generated from this description: "${imagePrompt}".`,
    brandTone ? `Brand tone of voice: ${brandTone}.` : "",
    "Write a caption and hashtag set for this post.",
  ]
    .filter(Boolean)
    .join(" ");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.8,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `OpenAI caption generation failed (${response.status}): ${errorBody.slice(0, 500)}`
    );
  }

  const data = await response.json();
  const text: string = data?.choices?.[0]?.message?.content ?? "";

  const captionMatch = text.match(/CAPTION:\s*(.+?)(?:\n|$)/i);
  const hashtagsMatch = text.match(/HASHTAGS:\s*(.+)/i);

  const caption = captionMatch?.[1]?.trim() ?? text.trim();
  const hashtags = (hashtagsMatch?.[1] ?? "")
    .split(/\s+/)
    .map((h) => h.trim())
    .filter((h) => h.startsWith("#"));

  return { caption, hashtags };
}
