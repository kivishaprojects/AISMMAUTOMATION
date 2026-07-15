import "server-only";
import { GRAPH_BASE } from "./meta";

/** Publishes a photo post to a Facebook Page. Returns the new post ID. */
export async function publishFacebookPhoto({
  pageId,
  pageAccessToken,
  imageUrl,
  caption,
}: {
  pageId: string;
  pageAccessToken: string;
  imageUrl: string;
  caption: string;
}): Promise<string> {
  const res = await fetch(`${GRAPH_BASE}/${pageId}/photos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: imageUrl,
      caption,
      access_token: pageAccessToken,
    }),
  });

  if (!res.ok) {
    throw new Error(`Facebook publish failed: ${await res.text()}`);
  }
  const data = await res.json();
  // Facebook returns { id, post_id }; post_id is the feed post itself.
  return data.post_id ?? data.id;
}

/**
 * Publishes a photo to an Instagram Business account. This is a two-step
 * Graph API dance: create a media container, then publish it \u2014 Instagram
 * processes the container asynchronously, so a brief poll/delay is often
 * needed in production; this does a single publish attempt with a short
 * settle delay, which is sufficient for standard image posts.
 */
export async function publishInstagramPhoto({
  igUserId,
  pageAccessToken,
  imageUrl,
  caption,
}: {
  igUserId: string;
  pageAccessToken: string;
  imageUrl: string;
  caption: string;
}): Promise<string> {
  const containerRes = await fetch(`${GRAPH_BASE}/${igUserId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image_url: imageUrl,
      caption,
      access_token: pageAccessToken,
    }),
  });

  if (!containerRes.ok) {
    throw new Error(`Instagram container creation failed: ${await containerRes.text()}`);
  }
  const container = await containerRes.json();
  const creationId = container.id as string;

  // Give Instagram a moment to finish processing the container before
  // attempting to publish it.
  await new Promise((resolve) => setTimeout(resolve, 3000));

  const publishRes = await fetch(`${GRAPH_BASE}/${igUserId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      creation_id: creationId,
      access_token: pageAccessToken,
    }),
  });

  if (!publishRes.ok) {
    throw new Error(`Instagram publish failed: ${await publishRes.text()}`);
  }
  const published = await publishRes.json();
  return published.id;
}
