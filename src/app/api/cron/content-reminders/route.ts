import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: dueNotes, error } = await admin
    .from("content_notes")
    .select("id, organization_id, created_by, title")
    .eq("note_date", today)
    .eq("notified", false);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  for (const note of dueNotes ?? []) {
    await admin.from("notifications").insert({
      organization_id: note.organization_id,
      user_id: note.created_by,
      type: "CONTENT_REMINDER",
      title: "Content due today",
      body: note.title,
      link: "/dashboard/content-planning",
    });
    await admin.from("content_notes").update({ notified: true }).eq("id", note.id);
  }

  return NextResponse.json({ notified: dueNotes?.length ?? 0 });
}
