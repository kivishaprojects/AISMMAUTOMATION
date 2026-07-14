import { createClient } from "@/lib/supabase/server";

export type CurrentOrg = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  role: string;
};

/**
 * Returns the orgs the current user belongs to, with their role in each.
 * RLS ensures this only ever returns orgs the user is actually a member of
 * — there's no need to filter by user id in the query itself.
 */
export async function getCurrentUserOrgs(): Promise<CurrentOrg[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("memberships")
    .select("role, organizations(id, name, slug, plan)")
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  return data
    .filter((m) => m.organizations)
    .map((m) => ({
      id: (m.organizations as unknown as { id: string }).id,
      name: (m.organizations as unknown as { name: string }).name,
      slug: (m.organizations as unknown as { slug: string }).slug,
      plan: (m.organizations as unknown as { plan: string }).plan,
      role: m.role,
    }));
}
