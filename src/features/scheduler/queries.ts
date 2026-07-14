import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

export type PostTargetInfo = {
  platform: string;
  platformPostId: string | null;
  status: string;
};

export type ScheduledPost = Tables<"posts"> & {
  assets: { url: string }[];
  targets: PostTargetInfo[];
};

export async function getPosts(organizationId: string): Promise<ScheduledPost[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("posts")
    .select("*, post_assets(assets(url)), post_targets(status, platform_post_id, social_accounts(platform))")
    .eq("organization_id", organizationId)
    .order("scheduled_for", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((post) => ({
    ...post,
    assets: (post.post_assets as unknown as { assets: { url: string } }[])
      ?.map((pa) => pa.assets)
      .filter(Boolean) ?? [],
    targets: (
      post.post_targets as unknown as {
        status: string;
        platform_post_id: string | null;
        social_accounts: { platform: string } | null;
      }[]
    )?.map((t) => ({
      platform: t.social_accounts?.platform ?? "",
      platformPostId: t.platform_post_id,
      status: t.status,
    })) ?? [],
  })) as ScheduledPost[];
}
