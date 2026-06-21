import { getAppUrl } from "@/utils/stripe";

const GRAPH_API_VERSION = "v22.0";

/** Scopes requested when connecting an account (Settings). */
export const INSTAGRAM_CONNECT_SCOPES = [
  "instagram_basic",
  "pages_show_list",
  // Required to read instagram_business_account on Page nodes (Graph API v17+).
  "pages_read_engagement",
  // Required when Pages live in Meta Business Suite / Business portfolio.
  "business_management",
] as const;

/** Added at publish time — requires Meta app review for public use. */
export const INSTAGRAM_PUBLISH_SCOPE = "instagram_content_publish";

const INSTAGRAM_PUBLISH_EXTRA_SCOPES = ["pages_read_engagement"] as const;

function instagramConnectScopeString(): string {
  return INSTAGRAM_CONNECT_SCOPES.join(",");
}

function instagramPublishScopeString(): string {
  return [
    ...INSTAGRAM_CONNECT_SCOPES,
    INSTAGRAM_PUBLISH_SCOPE,
    ...INSTAGRAM_PUBLISH_EXTRA_SCOPES,
  ].join(",");
}

export function getInstagramRedirectUri(): string {
  return (
    process.env.META_REDIRECT_URI?.replace(/\/$/, "") ??
    `${getAppUrl()}/api/platforms/instagram/callback`
  );
}

export function getInstagramOAuthConfig(): {
  appId: string;
  appSecret: string;
  redirectUri: string;
} {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;

  if (!appId || !appSecret) {
    throw new Error("Instagram OAuth is not configured");
  }

  return {
    appId,
    appSecret,
    redirectUri: getInstagramRedirectUri(),
  };
}

export function buildInstagramAuthUrl(state: string): string {
  const { appId, redirectUri } = getInstagramOAuthConfig();

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: instagramConnectScopeString(),
    state,
    // Ensures newly added scopes are offered on reconnect.
    auth_type: "rerequest",
  });

  return `https://www.facebook.com/${GRAPH_API_VERSION}/dialog/oauth?${params.toString()}`;
}

export function buildInstagramPublishAuthUrl(state: string): string {
  const { appId, redirectUri } = getInstagramOAuthConfig();

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: instagramPublishScopeString(),
    state,
  });

  return `https://www.facebook.com/${GRAPH_API_VERSION}/dialog/oauth?${params.toString()}`;
}

export interface InstagramTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface InstagramAccountInfo {
  instagramUserId: string;
  username: string;
  displayName: string;
  pageId: string;
  pageName: string;
}

async function parseInstagramTokenResponse(
  response: Response,
): Promise<InstagramTokenResponse> {
  const data = (await response.json().catch(() => null)) as
    | (InstagramTokenResponse & {
        error?: { message?: string; type?: string };
      })
    | null;

  if (!response.ok || !data?.access_token) {
    const message =
      data?.error?.message ?? "Failed to exchange OAuth code";
    throw new Error(message);
  }

  return data;
}

export async function exchangeInstagramCode(
  code: string,
): Promise<InstagramTokenResponse> {
  const { appId, appSecret, redirectUri } = getInstagramOAuthConfig();

  const params = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    redirect_uri: redirectUri,
    code,
  });

  const response = await fetch(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/oauth/access_token?${params.toString()}`,
  );

  const shortLived = await parseInstagramTokenResponse(response);
  return exchangeForLongLivedInstagramToken(shortLived.access_token);
}

export async function exchangeForLongLivedInstagramToken(
  shortLivedToken: string,
): Promise<InstagramTokenResponse> {
  const { appId, appSecret } = getInstagramOAuthConfig();

  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: appId,
    client_secret: appSecret,
    fb_exchange_token: shortLivedToken,
  });

  const response = await fetch(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/oauth/access_token?${params.toString()}`,
  );

  return parseInstagramTokenResponse(response);
}

interface InstagramBusinessAccountFields {
  id?: string;
  username?: string;
  name?: string;
}

interface FacebookPageFields {
  id?: string;
  name?: string;
  instagram_business_account?: InstagramBusinessAccountFields;
}

interface DebugTokenInfo {
  scopes: string[];
  pageIds: string[];
  instagramUserIds: string[];
}

const PAGE_ACCOUNT_FIELDS =
  "id,name,instagram_business_account{id,username,name}";

async function graphGet<T>(
  path: string,
  accessToken: string,
  query?: Record<string, string>,
): Promise<T> {
  const params = new URLSearchParams({
    access_token: accessToken,
    ...query,
  });

  const response = await fetch(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/${path}?${params.toString()}`,
  );

  const data = (await response.json().catch(() => null)) as
    | (T & { error?: { message?: string } })
    | null;

  if (!response.ok || !data) {
    throw new Error(
      data?.error?.message ?? "Meta Graph API request failed",
    );
  }

  return data;
}

async function fetchDebugTokenInfo(accessToken: string): Promise<DebugTokenInfo> {
  const { appId, appSecret } = getInstagramOAuthConfig();

  const params = new URLSearchParams({
    input_token: accessToken,
    access_token: `${appId}|${appSecret}`,
  });

  const response = await fetch(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/debug_token?${params.toString()}`,
  );

  const data = (await response.json().catch(() => null)) as {
    data?: {
      scopes?: string[];
      granular_scopes?: Array<{
        scope?: string;
        target_ids?: string[];
      }>;
    };
    error?: { message?: string };
  } | null;

  const pageIds = new Set<string>();
  const instagramUserIds = new Set<string>();

  for (const entry of data?.data?.granular_scopes ?? []) {
    const scope = entry.scope ?? "";
    const targets = entry.target_ids ?? [];

    if (
      scope === "pages_show_list" ||
      scope === "pages_read_engagement" ||
      scope === "pages_manage_posts"
    ) {
      for (const id of targets) {
        pageIds.add(id);
      }
    }

    if (scope === "instagram_basic" || scope === "instagram_content_publish") {
      for (const id of targets) {
        instagramUserIds.add(id);
      }
    }
  }

  return {
    scopes: data?.data?.scopes ?? [],
    pageIds: Array.from(pageIds),
    instagramUserIds: Array.from(instagramUserIds),
  };
}

export async function fetchGrantedInstagramScopes(
  accessToken: string,
): Promise<string | null> {
  const debug = await fetchDebugTokenInfo(accessToken);
  return debug.scopes.length > 0 ? debug.scopes.join(",") : null;
}

async function fetchManagedPages(
  accessToken: string,
): Promise<FacebookPageFields[]> {
  const pages: FacebookPageFields[] = [];
  let nextUrl: string | null =
    `https://graph.facebook.com/${GRAPH_API_VERSION}/me/accounts?fields=${encodeURIComponent(PAGE_ACCOUNT_FIELDS)}&limit=100&access_token=${encodeURIComponent(accessToken)}`;

  while (nextUrl) {
    const response = await fetch(nextUrl);
    const data = (await response.json().catch(() => null)) as {
      data?: FacebookPageFields[];
      paging?: { next?: string };
      error?: { message?: string };
    } | null;

    if (!response.ok) {
      throw new Error(
        data?.error?.message ?? "Failed to load Facebook Pages for this account",
      );
    }

    pages.push(...(data?.data ?? []));
    nextUrl = data?.paging?.next ?? null;
  }

  return pages;
}

async function fetchPageWithInstagram(
  pageId: string,
  accessToken: string,
): Promise<FacebookPageFields | null> {
  try {
    return await graphGet<FacebookPageFields>(pageId, accessToken, {
      fields: PAGE_ACCOUNT_FIELDS,
    });
  } catch {
    return null;
  }
}

async function fetchInstagramProfile(
  instagramUserId: string,
  accessToken: string,
): Promise<InstagramBusinessAccountFields | null> {
  try {
    return await graphGet<InstagramBusinessAccountFields>(
      instagramUserId,
      accessToken,
      { fields: "id,username,name" },
    );
  } catch {
    return null;
  }
}

function resolveInstagramAccountInfo(input: {
  page: FacebookPageFields;
}): InstagramAccountInfo | null {
  const instagramAccount = input.page.instagram_business_account;

  if (!input.page.id || !instagramAccount?.id) {
    return null;
  }

  const username = instagramAccount.username?.trim();
  const displayName =
    instagramAccount.name?.trim() ||
    (username ? `@${username}` : "Instagram account");

  return {
    instagramUserId: instagramAccount.id,
    username: username ?? "",
    displayName,
    pageId: input.page.id,
    pageName: input.page.name?.trim() || "Facebook Page",
  };
}

export async function fetchInstagramBusinessAccount(
  accessToken: string,
): Promise<InstagramAccountInfo> {
  const managedPages = await fetchManagedPages(accessToken);

  for (const page of managedPages) {
    const resolved = resolveInstagramAccountInfo({ page });
    if (resolved) {
      return resolved;
    }
  }

  const debug = await fetchDebugTokenInfo(accessToken);

  for (const pageId of debug.pageIds) {
    const page = await fetchPageWithInstagram(pageId, accessToken);
    const resolved = page ? resolveInstagramAccountInfo({ page }) : null;
    if (resolved) {
      return resolved;
    }
  }

  if (debug.instagramUserIds.length > 0 && debug.pageIds.length > 0) {
    const instagramUserId = debug.instagramUserIds[0];
    const pageId = debug.pageIds[0];
    const profile = await fetchInstagramProfile(instagramUserId, accessToken);
    const username = profile?.username?.trim();
    const displayName =
      profile?.name?.trim() ||
      (username ? `@${username}` : "Instagram account");

    const page = await fetchPageWithInstagram(pageId, accessToken);

    return {
      instagramUserId,
      username: username ?? "",
      displayName,
      pageId,
      pageName: page?.name?.trim() || "Facebook Page",
    };
  }

  if (debug.instagramUserIds.length > 0) {
    const instagramUserId = debug.instagramUserIds[0];
    const profile = await fetchInstagramProfile(instagramUserId, accessToken);

    if (profile?.id) {
      const username = profile.username?.trim();
      const displayName =
        profile.name?.trim() ||
        (username ? `@${username}` : "Instagram account");

      return {
        instagramUserId: profile.id,
        username: username ?? "",
        displayName,
        pageId: debug.pageIds[0] ?? profile.id,
        pageName: "Facebook Page",
      };
    }
  }

  throw new Error(
    "No Instagram Professional account linked to a Facebook Page. Link one in Meta Business Suite, then try again.",
  );
}

export async function revokeInstagramPermissions(
  accessToken: string,
): Promise<void> {
  const response = await fetch(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/me/permissions`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as {
      error?: { message?: string };
    } | null;
    throw new Error(
      data?.error?.message ?? "Failed to revoke Instagram permissions",
    );
  }
}
