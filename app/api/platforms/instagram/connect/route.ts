import { createClient } from "@/utils/supabase/server";
import {
  buildInstagramAuthUrl,
  getInstagramOAuthConfig,
} from "@/utils/instagram/oauth";
import { createInstagramOAuthState } from "@/utils/instagram/oauth-state";
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

    getInstagramOAuthConfig();

    await assertPlatformConnectAllowed(user.id, "instagram");

    const state = createInstagramOAuthState(user.id, {
      returnTo,
      intent: "connect",
      native,
    });
    const authUrl = buildInstagramAuthUrl(state);

    return respondPlatformOAuthStart(authUrl, native);
  } catch (error) {
    if (isUsageLimitError(error)) {
      return respondPlatformOAuthStartError(
        buildOAuthErrorRedirect({
          platform: "instagram",
          reason: "platform_limit",
          returnTo: returnTo ?? undefined,
          native,
        }),
        native,
      );
    }

    console.error("Instagram connect error:", error);

    return respondPlatformOAuthStartError(
      buildOAuthErrorRedirect({
        platform: "instagram",
        reason: "connect",
        returnTo: returnTo ?? undefined,
        native,
      }),
      native,
    );
  }
}
