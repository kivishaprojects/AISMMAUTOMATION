import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

export type RepoConnection = Tables<"repo_connections">;

export async function getRepoConnections(organizationId: string): Promise<RepoConnection[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("repo_connections")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data;
}
