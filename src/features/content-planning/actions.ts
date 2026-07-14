"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const noteSchema = z.object({
  title: z.string().min(2, "Give this a short title"),
  noteDate: z.string().min(1, "Pick a date"),
  details: z.string().optional(),
});

export async function createContentNoteAction(
  organizationId: string,
  _prevState: unknown,
  formData: FormData
) {
  const parsed = noteSchema.safeParse({
    title: formData.get("title"),
    noteDate: formData.get("noteDate"),
    details: formData.get("details") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("content_notes").insert({
    organization_id: organizationId,
    created_by: user.id,
    title: parsed.data.title,
    note_date: parsed.data.noteDate,
    details: parsed.data.details ?? null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/content-planning");
  return { success: true };
}

export async function deleteContentNoteAction(noteId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("content_notes").delete().eq("id", noteId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/content-planning");
}
