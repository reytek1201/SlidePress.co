import {
  ensureFreshYouTubeAccessToken,
  getYouTubeConnectionRow,
  upsertYouTubeConnection,
} from "@/utils/youtube/connection-store";
import {
  exchangeYouTubeCode,
  fetchYouTubeChannel,
  YOUTUBE_OAUTH_STATE_COOKIE,
} from "@/utils/youtube/oauth";
import { getAppUrl } from "@/utils/stripe";
import { createClient } from "@/utils/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

function redirectToSettings(query: string): NextResponse {
  const appUrl = getAppUrl();
  const response = NextResponse.redirect(
    `${appUrl}/settings/connected-accounts?${query}`,
  );

  response.cookies.set(YOUTUBE_OAUTH_STATE_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return response;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  if (oauthError) {
    return redirectToSettings("youtube=denied");
  }

  if (!code || !state) {
    return redirectToSettings("youtube=error");
  }

  const storedState = request.cookies.get(YOUTUBE_OAUTH_STATE_COOKIE)?.value;

  if (!storedState || storedState !== state) {
    return redirectToSettings("youtube=error");
  }

  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return redirectToSettings("youtube=error");
    }

    const tokens = await exchangeYouTubeCode(code);
    const channel = await fetchYouTubeChannel(tokens.access_token);
    const existing = await getYouTubeConnectionRow(user.id);

    await upsertYouTubeConnection({
      userId: user.id,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? null,
      expiresInSeconds: tokens.expires_in,
      channel,
      existingRefreshToken: existing?.refresh_token,
    });

    const saved = await getYouTubeConnectionRow(user.id);

    if (saved) {
      await ensureFreshYouTubeAccessToken(saved);
    }

    return redirectToSettings("youtube=connected");
  } catch (error) {
    console.error("YouTube OAuth callback error:", error);
    return redirectToSettings("youtube=error");
  }
}
