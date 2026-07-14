import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

export type ScheduledPost = Tables<"posts"> & {
  assets: { url: string }[];
};

export async function getPosts(organizationId: string): Promise<ScheduledPost[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("posts")
    .select("*, post_assets(assets(url))")
    .eq("organization_id", organizationId)
    .order("scheduled_for", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((post) => ({
    ...post,
    assets: (post.post_assets as unknown as { assets: { url: string } }[])
      ?.map((pa) => pa.assets)
      .filter(Boolean) ?? [],
  })) as ScheduledPost[];
}
