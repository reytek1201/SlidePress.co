import { getAppUrl } from "@/utils/stripe";
import { createClient } from "@/utils/supabase/server";
import {
  buildYouTubeAuthUrl,
  getYouTubeOAuthConfig,
  YOUTUBE_OAUTH_STATE_COOKIE,
} from "@/utils/youtube/oauth";
import { randomBytes } from "crypto";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.redirect(
        new URL("/login?next=/settings/connected-accounts", getAppUrl()),
      );
    }

    getYouTubeOAuthConfig();

    const state = randomBytes(32).toString("hex");
    const authUrl = buildYouTubeAuthUrl(state);
    const response = NextResponse.redirect(authUrl);

    response.cookies.set(YOUTUBE_OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("YouTube connect error:", error);

    return NextResponse.redirect(
      `${getAppUrl()}/settings/connected-accounts?youtube=error`,
    );
  }
}
