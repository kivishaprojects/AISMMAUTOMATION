import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  exchangeCodeForUserToken,
  getLongLivedUserToken,
  getManagedPages,
} from "@/lib/social/meta";

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
    const shortToken = await exchangeCodeForUserToken(code);
    const userToken = await getLongLivedUserToken(shortToken);
    const pages = await getManagedPages(userToken);

    if (pages.length === 0) {
      return NextResponse.redirect(
        `${settingsUrl}?error=${encodeURIComponent("No Facebook Pages found for this account.")}`
      );
    }

    // Insert goes through the user's own session so RLS enforces that only
    // MANAGER/ADMIN/OWNER can attach accounts to this org \u2014 no service-role
    // client needed here.
    for (const page of pages) {
      await supabase.from("social_accounts").upsert(
        {
          organization_id: organizationId,
          platform: "FACEBOOK",
          external_id: page.id,
          access_token_encrypted: page.accessToken,
          status: "ACTIVE",
        },
        { onConflict: "organization_id,platform,external_id" }
      );

      if (page.instagramBusinessAccountId) {
        await supabase.from("social_accounts").upsert(
          {
            organization_id: organizationId,
            platform: "INSTAGRAM",
            external_id: page.instagramBusinessAccountId,
            access_token_encrypted: page.accessToken,
            status: "ACTIVE",
          },
          { onConflict: "organization_id,platform,external_id" }
        );
      }
    }

    return NextResponse.redirect(`${settingsUrl}?connected=1`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Connection failed";
    return NextResponse.redirect(`${settingsUrl}?error=${encodeURIComponent(message)}`);
  }
}
