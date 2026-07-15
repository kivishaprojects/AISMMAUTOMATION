import "server-only";
import type { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Resolves which OpenAI key to use for this org: their own key if
 * Settings \u2192 My API Keys is set to "My own key", otherwise null (signals
 * platform-managed usage, which is what triggers a wallet-credit debit).
 */
export async function resolveOpenAiKey(
  supabase: SupabaseClient,
  organizationId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("org_integrations")
    .select("mode, api_key")
    .eq("organization_id", organizationId)
    .eq("provider", "openai")
    .maybeSingle();

  if (data?.mode === "CUSTOM" && data.api_key) {
    return data.api_key;
  }
  return null;
}

/**
 * Debits wallet credits for platform-managed generation. Only called when
 * resolveOpenAiKey returned null (i.e. the org is using our shared key,
 * not their own) \u2014 bring-your-own-key usage never touches the wallet
 * since the org is paying OpenAI directly in that case.
 */
export async function debitWalletCredits(
  supabase: SupabaseClient,
  organizationId: string,
  amount: number,
  description: string
): Promise<{ error?: string }> {
  const { error } = await supabase.rpc("deduct_wallet_credits", {
    org_id: organizationId,
    amount,
    description,
  });

  if (error) {
    return {
      error: error.message.includes("Insufficient credits")
        ? "Not enough wallet credits for this. Add credits under Settings \u2192 Wallet, or switch to your own API key under Settings \u2192 My API Keys."
        : error.message,
    };
  }
  return {};
}

export const CREDIT_COSTS = {
  IMAGE: 5,
  VIDEO: 50,
} as const;

/**
 * Refunds credits after a platform-managed generation fails partway
 * through (e.g. the provider call itself errors after the debit already
 * succeeded). Goes straight through the admin client with plain table
 * operations rather than the deduct_wallet_credits RPC, since that RPC
 * checks auth.uid() membership \u2014 which doesn't exist under the
 * service-role connection this runs on.
 */
export async function refundWalletCredits(
  organizationId: string,
  amount: number,
  description: string
): Promise<void> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const { data: org } = await admin
    .from("organizations")
    .select("credits_balance")
    .eq("id", organizationId)
    .single();
  if (!org) return;

  await admin
    .from("organizations")
    .update({ credits_balance: org.credits_balance + amount })
    .eq("id", organizationId);

  await admin.from("wallet_transactions").insert({
    organization_id: organizationId,
    type: "REFUND",
    credits: amount,
    description,
  });
}
