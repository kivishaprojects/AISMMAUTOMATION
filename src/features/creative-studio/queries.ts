import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

export type GeneratedAsset = Tables<"assets">;

export async function getGeneratedImages(
  organizationId: string
): Promise<GeneratedAsset[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("assets")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("type", "IMAGE")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data;
}
