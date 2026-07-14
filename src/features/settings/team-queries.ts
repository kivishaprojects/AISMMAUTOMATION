import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type TeamMember = {
  membershipId: string;
  userId: string;
  email: string;
  role: string;
  joinedAt: string;
};

export async function getTeamMembers(organizationId: string): Promise<TeamMember[]> {
  const supabase = await createClient();

  const { data: memberships, error } = await supabase
    .from("memberships")
    .select("id, user_id, role, created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });

  if (error || !memberships) return [];

  // Membership rows only carry user_id (auth.users isn't directly queryable
  // via the anon/RLS client) — resolve display emails with the admin client.
  // Safe here because this page is only reachable by OWNER/ADMIN (enforced
  // by the RLS policy on `memberships` itself, and re-checked in actions).
  const admin = createAdminClient();
  const results: TeamMember[] = [];

  for (const m of memberships) {
    const { data } = await admin.auth.admin.getUserById(m.user_id);
    results.push({
      membershipId: m.id,
      userId: m.user_id,
      email: data.user?.email ?? "(unknown)",
      role: m.role,
      joinedAt: m.created_at,
    });
  }

  return results;
}
