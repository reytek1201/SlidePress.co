import { getAppUrl } from "@/utils/stripe";

/** Scopes requested when connecting a channel (Settings). */
export const YOUTUBE_CONNECT_SCOPES = [
  "https://www.googleapis.com/auth/youtube.readonly",
] as const;

/** Added at publish time (Phase 1) — requires Google OAuth verification. */
export const YOUTUBE_UPLOAD_SCOPE =
  "https://www.googleapis.com/auth/youtube.upload";

function youtubeConnectScopeString(): string {
  return YOUTUBE_CONNECT_SCOPES.join(" ");
}

export function getYouTubeRedirectUri(): string {
  return (
    process.env.YOUTUBE_REDIRECT_URI?.replace(/\/$/, "") ??
    `${getAppUrl()}/api/platforms/youtube/callback`
  );
}

export function getYouTubeOAuthConfig(): {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
} {
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("YouTube OAuth is not configured");
  }

  return {
    clientId,
    clientSecret,
    redirectUri: getYouTubeRedirectUri(),
  };
}

export function buildYouTubeAuthUrl(state: string): string {
  const { clientId, redirectUri } = getYouTubeOAuthConfig();

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: youtubeConnectScopeString(),
    access_type: "offline",
    include_granted_scopes: "false",
    prompt: "consent select_account",
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export function buildYouTubeUploadAuthUrl(state: string): string {
  const { clientId, redirectUri } = getYouTubeOAuthConfig();

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: YOUTUBE_UPLOAD_SCOPE,
    access_type: "offline",
    include_granted_scopes: "true",
    prompt: "consent",
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export interface YouTubeTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope?: string;
}

export interface YouTubeChannelInfo {
  channelId: string;
  title: string;
}

export async function exchangeYouTubeCode(
  code: string,
): Promise<YouTubeTokenResponse> {
  const { clientId, clientSecret, redirectUri } = getYouTubeOAuthConfig();

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const data = (await response.json().catch(() => null)) as
    | (YouTubeTokenResponse & { error?: string; error_description?: string })
    | null;

  if (!response.ok || !data?.access_token) {
    const message =
      data?.error_description ?? data?.error ?? "Failed to exchange OAuth code";
    throw new Error(message);
  }

  return data;
}

export async function refreshYouTubeAccessToken(
  refreshToken: string,
): Promise<YouTubeTokenResponse> {
  const { clientId, clientSecret } = getYouTubeOAuthConfig();

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
  });

  const data = (await response.json().catch(() => null)) as
    | (YouTubeTokenResponse & { error?: string; error_description?: string })
    | null;

  if (!response.ok || !data?.access_token) {
    const message =
      data?.error_description ??
      data?.error ??
      "Failed to refresh YouTube access token";
    throw new Error(message);
  }

  return data;
}

export async function fetchYouTubeChannel(
  accessToken: string,
): Promise<YouTubeChannelInfo> {
  const params = new URLSearchParams({
    part: "snippet",
    mine: "true",
  });

  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  const data = (await response.json().catch(() => null)) as {
    items?: Array<{
      id?: string;
      snippet?: { title?: string };
    }>;
    error?: { message?: string };
  } | null;

  if (!response.ok) {
    throw new Error(
      data?.error?.message ?? "Failed to load YouTube channel information",
    );
  }

  const channel = data?.items?.[0];

  if (!channel?.id || !channel.snippet?.title) {
    throw new Error(
      "No YouTube channel found on this Google account. Create a channel at youtube.com first.",
    );
  }

  return {
    channelId: channel.id,
    title: channel.snippet.title,
  };
}

export async function revokeYouTubeToken(token: string): Promise<void> {
  const response = await fetch("https://oauth2.googleapis.com/revoke", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ token }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || "Failed to revoke YouTube token");
  }
}
