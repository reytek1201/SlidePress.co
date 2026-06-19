import {
  ensureFreshYouTubeAccessToken,
  getYouTubeConnectionRow,
  upsertYouTubeConnection,
} from "@/utils/youtube/connection-store";
import { exchangeYouTubeCode, fetchYouTubeChannel } from "@/utils/youtube/oauth";
import { verifyYouTubeOAuthState } from "@/utils/youtube/oauth-state";
import { getAppUrl } from "@/utils/stripe";
import { createClient } from "@/utils/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

function redirectToSettings(query: string): NextResponse {
  return NextResponse.redirect(`${getAppUrl()}/settings/connected-accounts?${query}`);
}

function redirectWithError(reason: string): NextResponse {
  return redirectToSettings(`youtube=error&reason=${encodeURIComponent(reason)}`);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");
  const oauthErrorDescription = searchParams.get("error_description");

  if (oauthError) {
    const detail = oauthErrorDescription
      ? `youtube=denied&reason=${encodeURIComponent(oauthErrorDescription)}`
      : "youtube=denied";
    return redirectToSettings(detail);
  }

  if (!code || !state) {
    return redirectWithError("missing_code");
  }

  let userId: string;

  try {
    userId = verifyYouTubeOAuthState(state);
  } catch (error) {
    console.error("YouTube OAuth state verification failed:", error);
    return redirectWithError("state");
  }

  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (!authError && user && user.id !== userId) {
      return redirectWithError("session_mismatch");
    }

    const tokens = await exchangeYouTubeCode(code);
    const channel = await fetchYouTubeChannel(tokens.access_token);
    const existing = await getYouTubeConnectionRow(userId);

    await upsertYouTubeConnection({
      userId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? null,
      expiresInSeconds: tokens.expires_in,
      channel,
      existingRefreshToken: existing?.refresh_token,
    });

    const saved = await getYouTubeConnectionRow(userId);

    if (saved) {
      await ensureFreshYouTubeAccessToken(saved);
    }

    return redirectToSettings("youtube=connected");
  } catch (error) {
    console.error("YouTube OAuth callback error:", error);

    const message = error instanceof Error ? error.message.toLowerCase() : "";

    if (message.includes("platform_connections") || message.includes("relation")) {
      return redirectWithError("database");
    }

    if (message.includes("channel")) {
      return redirectWithError("channel");
    }

    if (message.includes("token") || message.includes("oauth")) {
      return redirectWithError("token");
    }

    return redirectWithError("unknown");
  }
}
