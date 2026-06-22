import { NATIVE_OAUTH_SCHEME } from "@/utils/native-oauth";
import { getAppUrl } from "@/utils/stripe";
import { NextResponse } from "next/server";

export type PlatformOAuthIntent = "connect" | "publish";

export const NATIVE_PLATFORM_CALLBACK_PREFIX = `${NATIVE_OAUTH_SCHEME}://platforms/callback`;

export function resolveSafeReturnPath(returnTo: string | null | undefined): string | undefined {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }

  return undefined;
}

export function wantsNativeOAuthClient(searchParams: URLSearchParams): boolean {
  return searchParams.get("native") === "1";
}

export function appendNativeOAuthParam(apiPath: string): string {
  const separator = apiPath.includes("?") ? "&" : "?";
  return `${apiPath}${separator}native=1`;
}

export function buildNativePlatformCallbackDeepLink(nextPath: string): string {
  const safePath =
    nextPath.startsWith("/") && !nextPath.startsWith("//")
      ? nextPath
      : "/settings/connected-accounts";

  return `${NATIVE_PLATFORM_CALLBACK_PREFIX}?next=${encodeURIComponent(safePath)}`;
}

export function isNativePlatformCallbackUrl(url: string): boolean {
  return url.startsWith(NATIVE_PLATFORM_CALLBACK_PREFIX);
}

export function parseNativePlatformCallbackUrl(
  url: string,
): { nextPath: string } | null {
  if (!isNativePlatformCallbackUrl(url)) {
    return null;
  }

  const queryIndex = url.indexOf("?");
  const params = new URLSearchParams(
    queryIndex >= 0 ? url.slice(queryIndex + 1) : "",
  );
  const next = params.get("next");

  if (!next?.startsWith("/") || next.startsWith("//")) {
    return null;
  }

  return { nextPath: next };
}

export function finalizePlatformOAuthRedirect(
  webUrl: string,
  native?: boolean,
): string {
  if (!native) {
    return webUrl;
  }

  const url = new URL(webUrl);
  return buildNativePlatformCallbackDeepLink(url.pathname + url.search);
}

export function buildOAuthSuccessRedirect(input: {
  platform: "instagram" | "tiktok" | "youtube";
  intent: PlatformOAuthIntent;
  returnTo?: string;
  native?: boolean;
}): string {
  const safeReturnTo = resolveSafeReturnPath(input.returnTo);

  if (!safeReturnTo) {
    return finalizePlatformOAuthRedirect(
      `${getAppUrl()}/settings/connected-accounts?${input.platform}=connected`,
      input.native,
    );
  }

  const url = new URL(safeReturnTo, getAppUrl());

  if (input.intent === "publish") {
    url.searchParams.set(`${input.platform}_scope`, "granted");
  } else {
    url.searchParams.set(input.platform, "connected");
  }

  return finalizePlatformOAuthRedirect(url.toString(), input.native);
}

export function buildOAuthErrorRedirect(input: {
  platform: "instagram" | "tiktok" | "youtube";
  reason: string;
  returnTo?: string;
  native?: boolean;
}): string {
  const safeReturnTo = resolveSafeReturnPath(input.returnTo);

  if (!safeReturnTo) {
    return finalizePlatformOAuthRedirect(
      `${getAppUrl()}/settings/connected-accounts?${input.platform}=error&reason=${encodeURIComponent(input.reason)}`,
      input.native,
    );
  }

  const url = new URL(safeReturnTo, getAppUrl());
  url.searchParams.set(`${input.platform}_error`, input.reason);
  return finalizePlatformOAuthRedirect(url.toString(), input.native);
}

export function platformOAuthRedirectContext(
  oauthState: { returnTo?: string; native?: boolean } | null | undefined,
) {
  return {
    returnTo: oauthState?.returnTo,
    native: oauthState?.native,
  };
}

export function buildPlatformAuthorizeUrl(
  authorizePath: string,
  returnTo: string,
): string {
  return `${authorizePath}?returnTo=${encodeURIComponent(returnTo)}`;
}

export function respondPlatformOAuthStart(
  authUrl: string,
  native: boolean,
): NextResponse {
  if (native) {
    return NextResponse.json({ url: authUrl });
  }

  return NextResponse.redirect(authUrl);
}

export function respondPlatformOAuthStartError(
  redirectUrl: string,
  native: boolean,
): NextResponse {
  if (native) {
    return NextResponse.json({
      url: finalizePlatformOAuthRedirect(redirectUrl, true),
    });
  }

  return NextResponse.redirect(redirectUrl);
}

export function respondPlatformOAuthUnauthorized(native: boolean): NextResponse {
  if (native) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  return NextResponse.redirect(
    new URL("/login?next=/settings/connected-accounts", getAppUrl()),
  );
}
