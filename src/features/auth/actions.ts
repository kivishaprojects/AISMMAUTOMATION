"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signInSchema, signUpSchema } from "./schema";

function slugify(input: string) {
  return (
    input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "") +
    "-" +
    Math.random().toString(36).slice(2, 7)
  );
}

export async function signUpAction(_prevState: unknown, formData: FormData) {
  const parsed = signUpSchema.safeParse({
    fullName: formData.get("fullName"),
    orgName: formData.get("orgName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { fullName, orgName, email, password } = parsed.data;
  const supabase = await createClient();

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (authError) {
    return { error: authError.message };
  }
  if (!authData.user) {
    return {
      error: "Check your email to confirm your account, then sign in.",
    };
  }

  // Bootstrap: create the organization and make this user OWNER.
  // Runs under the user's own session — RLS "authenticated users can create
  // orgs" policy allows the insert, and the membership insert is allowed
  // because we're inserting a row for auth.uid() itself via the owners/admins
  // policy path (first membership for a brand-new org has no existing
  // members, so this uses a security-definer RPC instead of a raw insert).
  const { data: org, error: orgError } = await supabase
    .rpc("create_organization_with_owner", {
      org_name: orgName,
      org_slug: slugify(orgName),
    })
    .single();

  if (orgError) {
    return { error: `Account created, but org setup failed: ${orgError.message}` };
  }

  redirect("/dashboard");
}

export async function signInAction(_prevState: unknown, formData: FormData) {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}

/**
 * Used by the /onboarding page for users who signed in via OAuth (Google)
 * and don't have an organization yet — the email/password sign-up flow
 * creates one inline, this covers the OAuth path.
 */
export async function createOrgOnboardingAction(
  _prevState: unknown,
  formData: FormData
) {
  const orgName = String(formData.get("orgName") ?? "").trim();
  if (orgName.length < 2) {
    return { error: "Enter your business/organization name" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { error } = await supabase
    .rpc("create_organization_with_owner", {
      org_name: orgName,
      org_slug: slugify(orgName),
    })
    .single();

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}
