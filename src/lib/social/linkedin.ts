import "server-only";

const LINKEDIN_VERSION = "202505"; // LinkedIn-Version header, YYYYMM format

function getCredentials() {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "LINKEDIN_CLIENT_ID / LINKEDIN_CLIENT_SECRET are not set. Add them once you've created your LinkedIn app."
    );
  }
  return { clientId, clientSecret };
}

function getRedirectUri() {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return `${base}/api/social/callback/linkedin`;
}

/**
 * Requests both scopes up front. w_member_social is self-serve and always
 * granted; w_organization_social only actually takes effect once LinkedIn
 * has approved this app for Marketing API / Community Management API
 * access \u2014 until then, LinkedIn simply won't grant it, and organization
 * posting stays unavailable while personal-profile posting still works.
 */
export function buildLinkedInAuthUrl(state: string): string {
  const { clientId } = getCredentials();
  const scopes = ["openid", "profile", "w_member_social", "w_organization_social"].join(" ");

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: getRedirectUri(),
    state,
    scope: scopes,
  });

  return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
}

export async function exchangeLinkedInCode(code: string): Promise<string> {
  const { clientId, clientSecret } = getCredentials();
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: getRedirectUri(),
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) {
    throw new Error(`LinkedIn token exchange failed: ${await res.text()}`);
  }
  const data = await res.json();
  return data.access_token as string;
}

/** Returns the authenticated member's URN, built from the OIDC userinfo endpoint. */
export async function getLinkedInMemberUrn(accessToken: string): Promise<string> {
  const res = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`LinkedIn userinfo lookup failed: ${await res.text()}`);
  }
  const data = await res.json();
  return `urn:li:person:${data.sub}`;
}

export { LINKEDIN_VERSION };
