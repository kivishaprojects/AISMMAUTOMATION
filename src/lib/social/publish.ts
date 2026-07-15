import "server-only";
import { GRAPH_BASE } from "./meta";
import { LINKEDIN_VERSION } from "./linkedin";

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

/**
 * Publishes an image post to LinkedIn (personal profile or Company Page,
 * depending on which URN is passed as authorUrn). LinkedIn's Posts API
 * requires images to be uploaded to their own storage first \u2014 unlike
 * Meta, it won't fetch an arbitrary image URL for you.
 */
export async function publishLinkedInPost({
  authorUrn,
  accessToken,
  imageUrl,
  caption,
}: {
  authorUrn: string;
  accessToken: string;
  imageUrl: string;
  caption: string;
}): Promise<string> {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    "LinkedIn-Version": LINKEDIN_VERSION,
    "X-Restli-Protocol-Version": "2.0.0",
  };

  // Step 1: register an image upload slot.
  const initRes = await fetch("https://api.linkedin.com/rest/images?action=initializeUpload", {
    method: "POST",
    headers,
    body: JSON.stringify({ initializeUploadRequest: { owner: authorUrn } }),
  });
  if (!initRes.ok) {
    throw new Error(`LinkedIn image upload init failed: ${await initRes.text()}`);
  }
  const initData = await initRes.json();
  const uploadUrl: string = initData.value.uploadUrl;
  const imageUrn: string = initData.value.image;

  // Step 2: fetch our own hosted image and push its bytes to LinkedIn's
  // pre-signed upload URL.
  const imageRes = await fetch(imageUrl);
  if (!imageRes.ok) {
    throw new Error("Could not fetch generated image to upload to LinkedIn");
  }
  const imageBuffer = await imageRes.arrayBuffer();

  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: imageBuffer,
  });
  if (!uploadRes.ok) {
    throw new Error(`LinkedIn image upload failed: ${await uploadRes.text()}`);
  }

  // Step 3: create the post referencing the uploaded image.
  const postRes = await fetch("https://api.linkedin.com/rest/posts", {
    method: "POST",
    headers,
    body: JSON.stringify({
      author: authorUrn,
      commentary: caption,
      visibility: "PUBLIC",
      distribution: {
        feedDistribution: "MAIN_FEED",
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      content: { media: { id: imageUrn } },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false,
    }),
  });

  if (!postRes.ok) {
    throw new Error(`LinkedIn publish failed: ${await postRes.text()}`);
  }

  return postRes.headers.get("x-restli-id") ?? postRes.headers.get("x-linkedin-id") ?? "";
}
