import { createClient } from "@/utils/supabase/server";
import {
  buildTikTokPublishAuthUrl,
  getTikTokOAuthConfig,
} from "@/utils/tiktok/oauth";
import { createTikTokOAuthState } from "@/utils/tiktok/oauth-state";
import {
  buildOAuthErrorRedirect,
  respondPlatformOAuthStart,
  respondPlatformOAuthStartError,
  respondPlatformOAuthUnauthorized,
  wantsNativeOAuthClient,
} from "@/utils/platforms/oauth-return";
import { assertPlatformConnectAllowed } from "@/utils/platform-connection-limits";
import { isUsageLimitError } from "@/utils/usage-limits";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const returnTo = searchParams.get("returnTo");
  const native = wantsNativeOAuthClient(searchParams);

  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return respondPlatformOAuthUnauthorized(native);
    }

    getTikTokOAuthConfig();

    await assertPlatformConnectAllowed(user.id, "tiktok");

    const state = createTikTokOAuthState(user.id, {
      returnTo,
      intent: "publish",
      native,
    });
    const authUrl = buildTikTokPublishAuthUrl(state);

    return respondPlatformOAuthStart(authUrl, native);
  } catch (error) {
    if (isUsageLimitError(error)) {
      return respondPlatformOAuthStartError(
        buildOAuthErrorRedirect({
          platform: "tiktok",
          reason: "platform_limit",
          returnTo: returnTo ?? undefined,
          native,
        }),
        native,
      );
    }

    console.error("TikTok publish authorize error:", error);

    return respondPlatformOAuthStartError(
      buildOAuthErrorRedirect({
        platform: "tiktok",
        reason: "connect",
        returnTo: returnTo ?? undefined,
        native,
      }),
      native,
    );
  }
}
