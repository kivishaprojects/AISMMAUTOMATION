import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { publishFacebookPhoto, publishInstagramPhoto, publishLinkedInPost } from "./publish";

/**
 * Attempts to publish every PUBLISHING target for a post, using the
 * service-role client since this runs outside a user's request context
 * (cron) as often as it does inside one (immediate publish).
 */
export async function attemptPublishPost(postId: string): Promise<void> {
  const admin = createAdminClient();

  const { data: post } = await admin
    .from("posts")
    .select("caption, hashtags, created_by, organization_id")
    .eq("id", postId)
    .single();
  if (!post) return;

  const { data: assetLinks } = await admin
    .from("post_assets")
    .select("assets(url)")
    .eq("post_id", postId);
  const imageUrl = (assetLinks as unknown as { assets: { url: string } }[] | null)?.[0]?.assets?.url;

  const captionWithTags = [post.caption, ...(post.hashtags ?? [])].filter(Boolean).join("\n\n");

  const { data: targets } = await admin
    .from("post_targets")
    .select("id, social_accounts(id, platform, external_id, access_token_encrypted)")
    .eq("post_id", postId)
    .eq("status", "PUBLISHING");

  if (!targets || targets.length === 0) return;

  let anyPublished = false;
  let anyFailed = false;

  for (const target of targets) {
    const account = (
      target as unknown as {
        social_accounts: {
          id: string;
          platform: string;
          external_id: string;
          access_token_encrypted: string | null;
        } | null;
      }
    ).social_accounts;

    if (!account || !account.access_token_encrypted || !imageUrl) {
      await admin
        .from("post_targets")
        .update({ status: "FAILED", error_message: "Missing account credentials or image" })
        .eq("id", target.id);
      anyFailed = true;
      continue;
    }

    try {
      let platformPostId: string;
      if (account.platform === "FACEBOOK") {
        platformPostId = await publishFacebookPhoto({
          pageId: account.external_id,
          pageAccessToken: account.access_token_encrypted,
          imageUrl,
          caption: captionWithTags,
        });
      } else if (account.platform === "INSTAGRAM") {
        platformPostId = await publishInstagramPhoto({
          igUserId: account.external_id,
          pageAccessToken: account.access_token_encrypted,
          imageUrl,
          caption: captionWithTags,
        });
      } else if (account.platform === "LINKEDIN") {
        platformPostId = await publishLinkedInPost({
          authorUrn: account.external_id,
          accessToken: account.access_token_encrypted,
          imageUrl,
          caption: captionWithTags,
        });
      } else {
        throw new Error(`Publishing to ${account.platform} isn't implemented yet`);
      }

      await admin
        .from("post_targets")
        .update({ status: "PUBLISHED", platform_post_id: platformPostId })
        .eq("id", target.id);
      anyPublished = true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Publish failed";
      await admin
        .from("post_targets")
        .update({ status: "FAILED", error_message: message })
        .eq("id", target.id);
      anyFailed = true;
    }
  }

  const finalStatus = anyPublished && !anyFailed ? "PUBLISHED" : anyFailed && !anyPublished ? "FAILED" : "PUBLISHED";
  await admin.from("posts").update({ status: finalStatus }).eq("id", postId);

  await admin.from("notifications").insert({
    organization_id: post.organization_id,
    user_id: post.created_by,
    type: finalStatus === "FAILED" ? "POST_FAILED" : "POST_PUBLISHED",
    title:
      finalStatus === "FAILED"
        ? "A post failed to publish"
        : anyFailed
        ? "Post published to some pages, others failed"
        : "Post published successfully",
    body: post.caption ? post.caption.slice(0, 120) : null,
    link: "/dashboard/scheduler",
  });
}
