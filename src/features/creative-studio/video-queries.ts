import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

export type GeneratedVideo = Tables<"assets">;

export async function getGeneratedVideos(organizationId: string): Promise<GeneratedVideo[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assets")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("type", "VIDEO")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data;
}
