import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "./client";

export type InvoiceSummary = {
  id: string;
  amountPaid: number;
  currency: string;
  status: string | null;
  created: number;
  hostedInvoiceUrl: string | null;
};

export async function getInvoicesForOrg(organizationId: string): Promise<InvoiceSummary[]> {
  const supabase = await createClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("stripe_customer_id")
    .eq("id", organizationId)
    .single();

  if (!org?.stripe_customer_id) return [];

  try {
    const stripe = getStripe();
    const invoices = await stripe.invoices.list({ customer: org.stripe_customer_id, limit: 20 });
    return invoices.data.map((inv) => ({
      id: inv.id ?? "",
      amountPaid: inv.amount_paid,
      currency: inv.currency,
      status: inv.status,
      created: inv.created,
      hostedInvoiceUrl: inv.hosted_invoice_url ?? null,
    }));
  } catch {
    return [];
  }
}
