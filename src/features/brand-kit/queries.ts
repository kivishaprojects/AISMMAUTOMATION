import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

export type BrandKit = Tables<"brand_kits">;

export async function getBrandKits(organizationId: string): Promise<BrandKit[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("brand_kits")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return data;
}

export async function getBrandKit(id: string): Promise<BrandKit | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("brand_kits")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data;
}
