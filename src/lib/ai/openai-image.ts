import "server-only";

export type ImageSize = "1024x1024" | "1024x1536" | "1536x1024";

type GenerateImageParams = {
  prompt: string;
  size?: ImageSize;
};

type GenerateImageResult = {
  base64: string;
  mimeType: "image/png";
  provider: "openai";
  model: string;
};

/**
 * Thin wrapper around OpenAI's image generation endpoint. Kept as a
 * standalone module (rather than inlined in the server action) so that
 * swapping in Stability/Flux/Ideogram later is a matter of adding a sibling
 * file with the same shape and branching on a `provider` param — the
 * calling code in actions.ts doesn't need to change.
 */
export async function generateImageOpenAI({
  prompt,
  size = "1024x1024",
  apiKeyOverride,
}: GenerateImageParams & { apiKeyOverride?: string | null }): Promise<GenerateImageResult> {
  const apiKey = apiKeyOverride || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not set. Add it in your environment variables, or add your own key under Settings \u2192 My API Keys."
    );
  }

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt,
      size,
      n: 1,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `OpenAI image generation failed (${response.status}): ${errorBody.slice(0, 500)}`
    );
  }

  const data = await response.json();
  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error("OpenAI response did not include image data");
  }

  return {
    base64: b64,
    mimeType: "image/png",
    provider: "openai",
    model: "gpt-image-1",
  };
}
