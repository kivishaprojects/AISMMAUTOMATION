import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // First-time OAuth users (e.g. via Google) won't have an
      // organization yet — the email/password sign-up flow creates one
      // inline, but OAuth skips that form entirely. Send them to a short
      // onboarding step instead of a dashboard with nothing in it.
      const { count } = await supabase
        .from("memberships")
        .select("*", { count: "exact", head: true });

      if (!count || count === 0) {
        return NextResponse.redirect(`${origin}/onboarding`);
      }

      return NextResponse.redirect(`${origin}${redirectTo}`);
    }
  }

  return NextResponse.redirect(`${origin}/sign-in?error=auth_callback_failed`);
}
