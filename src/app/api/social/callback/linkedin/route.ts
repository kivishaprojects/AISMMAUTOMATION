import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exchangeLinkedInCode, getLinkedInMemberUrn } from "@/lib/social/linkedin";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const organizationId = searchParams.get("state");
  const oauthError = searchParams.get("error_description") || searchParams.get("error");

  const settingsUrl = `${origin}/dashboard/settings/social-accounts`;

  if (oauthError) {
    return NextResponse.redirect(`${settingsUrl}?error=${encodeURIComponent(oauthError)}`);
  }
  if (!code || !organizationId) {
    return NextResponse.redirect(`${settingsUrl}?error=missing_code_or_state`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${origin}/sign-in`);
  }

  try {
    const accessToken = await exchangeLinkedInCode(code);
    const personUrn = await getLinkedInMemberUrn(accessToken);

    // Stored immediately as the person's own profile \u2014 this works right
    // away via the self-serve w_member_social scope. A Company Page target
    // can be added afterward from the Social Accounts page once
    // w_organization_social has been approved for this app.
    await supabase.from("social_accounts").upsert(
      {
        organization_id: organizationId,
        platform: "LINKEDIN",
        external_id: personUrn,
        access_token_encrypted: accessToken,
        status: "ACTIVE",
      },
      { onConflict: "organization_id,platform,external_id" }
    );

    return NextResponse.redirect(`${settingsUrl}?connected=1`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Connection failed";
    return NextResponse.redirect(`${settingsUrl}?error=${encodeURIComponent(message)}`);
  }
}
