import {
  getTikTokConnectionRow,
  upsertTikTokConnection,
} from "@/utils/tiktok/connection-store";
import {
  exchangeTikTokCode,
  fetchTikTokUserInfo,
} from "@/utils/tiktok/oauth";
import { verifyTikTokOAuthState } from "@/utils/tiktok/oauth-state";
import {
  buildOAuthErrorRedirect,
  buildOAuthSuccessRedirect,
  platformOAuthRedirectContext,
} from "@/utils/platforms/oauth-return";
import { hasTikTokPublishScope } from "@/utils/platforms/scopes";
import { assertPlatformConnectAllowed } from "@/utils/platform-connection-limits";
import { isUsageLimitError } from "@/utils/usage-limits";
import { createClient } from "@/utils/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");
  const oauthErrorDescription = searchParams.get("error_description");

  let oauthState;

  try {
    oauthState = state ? verifyTikTokOAuthState(state) : null;
  } catch {
    oauthState = null;
  }

  const redirectContext = platformOAuthRedirectContext(oauthState);
  const intent = oauthState?.intent ?? "connect";

  if (oauthError) {
    const reason = oauthErrorDescription
      ? `denied:${oauthErrorDescription}`
      : "denied";

    return NextResponse.redirect(
      buildOAuthErrorRedirect({
        platform: "tiktok",
        reason,
        ...redirectContext,
      }),
    );
  }

  if (!code || !state || !oauthState) {
    return NextResponse.redirect(
      buildOAuthErrorRedirect({
        platform: "tiktok",
        reason: !oauthState ? "state" : "missing_code",
        ...redirectContext,
      }),
    );
  }

  const userId = oauthState.userId;

  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (!authError && user && user.id !== userId) {
      return NextResponse.redirect(
        buildOAuthErrorRedirect({
          platform: "tiktok",
          reason: "session_mismatch",
          ...redirectContext,
        }),
      );
    }

    const tokens = await exchangeTikTokCode(code);
    const profile = await fetchTikTokUserInfo(tokens.access_token);
    const existing = await getTikTokConnectionRow(userId);

    await assertPlatformConnectAllowed(userId, "tiktok");

    await upsertTikTokConnection({
      userId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? null,
      expiresInSeconds: tokens.expires_in,
      user: profile,
      scopes: tokens.scope,
      existingRefreshToken: existing?.refresh_token,
      existingScopes: existing?.scopes,
    });

    const saved = await getTikTokConnectionRow(userId);

    if (intent === "publish" && !hasTikTokPublishScope(saved?.scopes ?? tokens.scope)) {
      return NextResponse.redirect(
        buildOAuthErrorRedirect({
          platform: "tiktok",
          reason: "scope",
          ...redirectContext,
        }),
      );
    }

    return NextResponse.redirect(
      buildOAuthSuccessRedirect({
        platform: "tiktok",
        intent,
        ...redirectContext,
      }),
    );
  } catch (error) {
    if (isUsageLimitError(error)) {
      return NextResponse.redirect(
        buildOAuthErrorRedirect({
          platform: "tiktok",
          reason: "platform_limit",
          ...redirectContext,
        }),
      );
    }

    console.error("TikTok OAuth callback error:", error);

    const message = error instanceof Error ? error.message.toLowerCase() : "";

    if (message.includes("platform_connections") || message.includes("relation")) {
      return NextResponse.redirect(
        buildOAuthErrorRedirect({
          platform: "tiktok",
          reason: "database",
          ...redirectContext,
        }),
      );
    }

    if (message.includes("tiktok account") || message.includes("user")) {
      return NextResponse.redirect(
        buildOAuthErrorRedirect({
          platform: "tiktok",
          reason: "account",
          ...redirectContext,
        }),
      );
    }

    if (message.includes("token") || message.includes("oauth")) {
      return NextResponse.redirect(
        buildOAuthErrorRedirect({
          platform: "tiktok",
          reason: "token",
          ...redirectContext,
        }),
      );
    }

    return NextResponse.redirect(
      buildOAuthErrorRedirect({
        platform: "tiktok",
        reason: "unknown",
        ...redirectContext,
      }),
    );
  }
}
