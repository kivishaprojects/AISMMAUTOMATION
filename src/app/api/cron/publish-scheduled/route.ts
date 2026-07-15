import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { attemptPublishPost } from "@/lib/social/dispatch";

export async function GET(request: Request) {
  // Vercel Cron automatically sends this header when CRON_SECRET is set
  // as an environment variable on the project \u2014 verifying it stops anyone
  // else from hitting this endpoint and force-publishing scheduled posts.
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: duePosts, error } = await admin
    .from("posts")
    .select("id")
    .eq("status", "SCHEDULED")
    .lte("scheduled_for", new Date().toISOString());

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  for (const post of duePosts ?? []) {
    // Move to PUBLISHING first so a retry of this cron run (or an overlap)
    // doesn't double-publish the same post.
    await admin.from("posts").update({ status: "PUBLISHING" }).eq("id", post.id);
    await admin
      .from("post_targets")
      .update({ status: "PUBLISHING" })
      .eq("post_id", post.id)
      .in("status", ["SCHEDULED"]);
    await attemptPublishPost(post.id);
  }

  return NextResponse.json({ processed: duePosts?.length ?? 0 });
}
