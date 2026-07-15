import "server-only";

// Meta's Graph API version drifts over time; centralizing it here means
// bumping one constant rather than hunting through every call site.
const GRAPH_VERSION = "v21.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

function getAppCredentials() {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) {
    throw new Error(
      "META_APP_ID / META_APP_SECRET are not set. Add them once you've created your Meta app."
    );
  }
  return { appId, appSecret };
}

function getRedirectUri() {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return `${base}/api/social/callback/meta`;
}

/**
 * Builds the URL the user is sent to on Facebook to authorize this app.
 * `state` carries the organization ID through the OAuth round-trip so the
 * callback knows which org to attach the connected pages to.
 */
export function buildMetaAuthUrl(state: string): string {
  const { appId } = getAppCredentials();
  const scopes = [
    "pages_show_list",
    "pages_read_engagement",
    "pages_manage_posts",
    "instagram_basic",
    "instagram_content_publish",
  ].join(",");

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: getRedirectUri(),
    state,
    scope: scopes,
    response_type: "code",
  });

  return `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth?${params.toString()}`;
}

export async function exchangeCodeForUserToken(code: string): Promise<string> {
  const { appId, appSecret } = getAppCredentials();
  const params = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    redirect_uri: getRedirectUri(),
    code,
  });

  const res = await fetch(`${GRAPH_BASE}/oauth/access_token?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Meta token exchange failed: ${await res.text()}`);
  }
  const data = await res.json();
  return data.access_token as string;
}

/** Exchanges a short-lived user token for a long-lived one (~60 days). */
export async function getLongLivedUserToken(shortToken: string): Promise<string> {
  const { appId, appSecret } = getAppCredentials();
  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: appId,
    client_secret: appSecret,
    fb_exchange_token: shortToken,
  });

  const res = await fetch(`${GRAPH_BASE}/oauth/access_token?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Meta long-lived token exchange failed: ${await res.text()}`);
  }
  const data = await res.json();
  return data.access_token as string;
}

export type ManagedPage = {
  id: string;
  name: string;
  accessToken: string; // page access token, used for both FB and linked IG publishing
  instagramBusinessAccountId: string | null;
};

/**
 * Lists the Facebook Pages the authorizing user manages, along with each
 * page's own access token and its linked Instagram Business Account (if
 * any) \u2014 page access tokens generally don't expire the way user tokens do,
 * which is what we actually store and use for publishing.
 */
export async function getManagedPages(userToken: string): Promise<ManagedPage[]> {
  const params = new URLSearchParams({
    fields: "id,name,access_token,instagram_business_account",
    access_token: userToken,
  });

  const res = await fetch(`${GRAPH_BASE}/me/accounts?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Meta pages lookup failed: ${await res.text()}`);
  }
  const data = await res.json();

  return (data.data ?? []).map(
    (p: { id: string; name: string; access_token: string; instagram_business_account?: { id: string } }) => ({
      id: p.id,
      name: p.name,
      accessToken: p.access_token,
      instagramBusinessAccountId: p.instagram_business_account?.id ?? null,
    })
  );
}

export { GRAPH_BASE };
