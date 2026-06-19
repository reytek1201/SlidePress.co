import { getAppUrl } from "@/utils/stripe";
import { createClient } from "@/utils/supabase/server";
import { buildYouTubeAuthUrl, getYouTubeOAuthConfig } from "@/utils/youtube/oauth";
import { createYouTubeOAuthState } from "@/utils/youtube/oauth-state";
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

    const state = createYouTubeOAuthState(user.id);
    const authUrl = buildYouTubeAuthUrl(state);

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("YouTube connect error:", error);

    return NextResponse.redirect(
      `${getAppUrl()}/settings/connected-accounts?youtube=error&reason=${encodeURIComponent("connect")}`,
    );
  }
}
