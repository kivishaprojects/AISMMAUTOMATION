import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

export type WalletTransaction = Tables<"wallet_transactions">;

export async function getWalletTransactions(organizationId: string): Promise<WalletTransaction[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("wallet_transactions")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !data) return [];
  return data;
}
