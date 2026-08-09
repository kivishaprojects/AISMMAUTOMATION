import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

export type ContentDoc = Tables<"content_docs">;

export async function getContentDocs(
  organizationId: string,
  docTypes: string[],
  limit = 15
): Promise<ContentDoc[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("content_docs")
    .select("*")
    .eq("organization_id", organizationId)
    .in("doc_type", docTypes)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data;
}
