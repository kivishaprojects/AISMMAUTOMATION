"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ROLES = ["OWNER", "ADMIN", "MANAGER", "EDITOR", "APPROVER", "VIEWER"] as const;

const inviteSchema = z.object({
  email: z.string().email("Enter a valid email"),
  role: z.enum(ROLES),
});

export async function inviteMemberAction(
  organizationId: string,
  _prevState: unknown,
  formData: FormData
) {
  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  // Permission check: only OWNER/ADMIN of this org can invite. Re-checked
  // here (not just relying on RLS) because the membership insert below
  // goes through the service-role admin client, which bypasses RLS.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: callerMembership } = await supabase
    .from("memberships")
    .select("role")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .single();

  if (!callerMembership || !["OWNER", "ADMIN"].includes(callerMembership.role)) {
    return { error: "Only owners/admins can invite members." };
  }

  const admin = createAdminClient();
  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
    parsed.data.email
  );

  if (inviteError || !invited.user) {
    return { error: inviteError?.message ?? "Could not send invite" };
  }

  const { error: membershipError } = await admin.from("memberships").insert({
    organization_id: organizationId,
    user_id: invited.user.id,
    role: parsed.data.role,
  });

  if (membershipError) {
    return { error: membershipError.message };
  }

  revalidatePath("/dashboard/settings/team");
  return { success: true };
}

export async function updateMemberRoleAction(membershipId: string, role: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("memberships")
    .update({ role: role as (typeof ROLES)[number] })
    .eq("id", membershipId);

  if (error) {
    throw new Error(
      error.code === "42501" ? "Only owners/admins can change roles." : error.message
    );
  }
  revalidatePath("/dashboard/settings/team");
}

export async function removeMemberAction(membershipId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("memberships").delete().eq("id", membershipId);

  if (error) {
    throw new Error(
      error.code === "42501" ? "Only owners/admins can remove members." : error.message
    );
  }
  revalidatePath("/dashboard/settings/team");
}
