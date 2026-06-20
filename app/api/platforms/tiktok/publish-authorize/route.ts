import { getAppUrl } from "@/utils/stripe";
import { createClient } from "@/utils/supabase/server";
import {
  buildTikTokPublishAuthUrl,
  getTikTokOAuthConfig,
} from "@/utils/tiktok/oauth";
import { createTikTokOAuthState } from "@/utils/tiktok/oauth-state";
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

    getTikTokOAuthConfig();

    const state = createTikTokOAuthState(user.id);
    const authUrl = buildTikTokPublishAuthUrl(state);

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("TikTok publish authorize error:", error);

    return NextResponse.redirect(
      `${getAppUrl()}/settings/connected-accounts?tiktok=error&reason=${encodeURIComponent("connect")}`,
    );
  }
}
