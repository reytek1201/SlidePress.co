import { Browser } from "@capacitor/browser";
import {
  appendNativeOAuthParam,
  isNativePlatformCallbackUrl,
  parseNativePlatformCallbackUrl,
} from "@/utils/platforms/oauth-return";

export async function startNativePlatformOAuth(
  apiPath: string,
  onReturn: (nextPath: string) => void,
): Promise<{ error: string | null }> {
  try {
    const response = await fetch(appendNativeOAuthParam(apiPath), {
      credentials: "include",
    });
    const data = (await response.json().catch(() => null)) as {
      url?: string;
      error?: string;
    } | null;

    if (!response.ok) {
      return { error: data?.error ?? "Could not start authorization." };
    }

    const url = data?.url;
    if (!url) {
      return { error: "Could not start authorization." };
    }

    if (isNativePlatformCallbackUrl(url)) {
      const parsed = parseNativePlatformCallbackUrl(url);
      if (parsed) {
        onReturn(parsed.nextPath);
        return { error: null };
      }
      return { error: "Invalid authorization response." };
    }

    await Browser.open({ url });
    return { error: null };
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : "Could not open authorization.",
    };
  }
}

export function navigatePlatformOAuth(
  apiPath: string,
  isNativeApp: boolean,
  onNativeReturn: (nextPath: string) => void,
): void {
  if (isNativeApp) {
    void startNativePlatformOAuth(apiPath, onNativeReturn);
    return;
  }

  window.location.href = apiPath;
}
