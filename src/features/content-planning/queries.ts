import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

export type ContentNote = Tables<"content_notes">;

export async function getContentNotes(organizationId: string): Promise<ContentNote[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("content_notes")
    .select("*")
    .eq("organization_id", organizationId)
    .order("note_date", { ascending: true });

  if (error || !data) return [];
  return data;
}
