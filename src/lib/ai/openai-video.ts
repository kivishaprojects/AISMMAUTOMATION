import "server-only";

// NOTE: OpenAI has announced the Sora 2 Videos API (sora-2, sora-2-pro)
// will shut down September 24, 2026. This integration works today but
// will need a provider swap before then \u2014 kept isolated in this one file
// so that swap is a matter of rewriting these three functions, not
// touching the calling code in video-actions.ts.

export type VideoSize = "1280x720" | "720x1280";

type CreateVideoJobResult = {
  externalJobId: string;
  status: string;
};

export async function createVideoJob({
  prompt,
  size = "1280x720",
  seconds = "8",
  apiKeyOverride,
}: {
  prompt: string;
  size?: VideoSize;
  seconds?: string;
  apiKeyOverride?: string | null;
}): Promise<CreateVideoJobResult> {
  const apiKey = apiKeyOverride || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not set. Add it in your environment variables, or add your own key under Settings \u2192 My API Keys."
    );
  }

  const res = await fetch("https://api.openai.com/v1/videos", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: "sora-2", prompt, size, seconds }),
  });

  if (!res.ok) {
    throw new Error(`Video job creation failed (${res.status}): ${await res.text()}`);
  }
  const data = await res.json();
  return { externalJobId: data.id, status: data.status };
}

export async function getVideoJobStatus({
  externalJobId,
  apiKeyOverride,
}: {
  externalJobId: string;
  apiKeyOverride?: string | null;
}): Promise<{ status: string; error?: string }> {
  const apiKey = apiKeyOverride || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set.");

  const res = await fetch(`https://api.openai.com/v1/videos/${externalJobId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) {
    throw new Error(`Video status check failed (${res.status}): ${await res.text()}`);
  }
  const data = await res.json();
  return { status: data.status, error: data.error?.message };
}

export async function downloadVideoContent({
  externalJobId,
  apiKeyOverride,
}: {
  externalJobId: string;
  apiKeyOverride?: string | null;
}): Promise<ArrayBuffer> {
  const apiKey = apiKeyOverride || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set.");

  const res = await fetch(`https://api.openai.com/v1/videos/${externalJobId}/content`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) {
    throw new Error(`Video download failed (${res.status}): ${await res.text()}`);
  }
  return res.arrayBuffer();
}
