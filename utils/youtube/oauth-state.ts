import { createHmac, randomBytes } from "crypto";
import {
  resolveSafeReturnPath,
  type PlatformOAuthIntent,
} from "@/utils/platforms/oauth-return";
import { getYouTubeOAuthConfig } from "@/utils/youtube/oauth";

const STATE_TTL_MS = 10 * 60 * 1000;

export interface YouTubeOAuthStatePayload {
  userId: string;
  exp: number;
  nonce: string;
  returnTo?: string;
  intent: PlatformOAuthIntent;
  native?: boolean;
}

function signPayload(payloadB64: string): string {
  const { clientSecret } = getYouTubeOAuthConfig();
  return createHmac("sha256", clientSecret).update(payloadB64).digest("base64url");
}

export function createYouTubeOAuthState(
  userId: string,
  options?: {
    returnTo?: string | null;
    intent?: PlatformOAuthIntent;
    native?: boolean;
  },
): string {
  const payload: YouTubeOAuthStatePayload = {
    userId,
    exp: Date.now() + STATE_TTL_MS,
    nonce: randomBytes(16).toString("hex"),
    intent: options?.intent ?? "connect",
  };

  const safeReturnTo = resolveSafeReturnPath(options?.returnTo ?? undefined);

  if (safeReturnTo) {
    payload.returnTo = safeReturnTo;
  }

  if (options?.native) {
    payload.native = true;
  }

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${payloadB64}.${signPayload(payloadB64)}`;
}

export function verifyYouTubeOAuthState(state: string): YouTubeOAuthStatePayload {
  const [payloadB64, sig] = state.split(".");

  if (!payloadB64 || !sig) {
    throw new Error("Invalid OAuth state");
  }

  if (sig !== signPayload(payloadB64)) {
    throw new Error("Invalid OAuth state signature");
  }

  const payload = JSON.parse(
    Buffer.from(payloadB64, "base64url").toString("utf8"),
  ) as Partial<YouTubeOAuthStatePayload>;

  if (!payload.userId || typeof payload.exp !== "number") {
    throw new Error("Invalid OAuth state payload");
  }

  if (Date.now() > payload.exp) {
    throw new Error("OAuth state expired");
  }

  return {
    userId: payload.userId,
    exp: payload.exp,
    nonce: payload.nonce ?? "",
    returnTo: resolveSafeReturnPath(payload.returnTo),
    intent: payload.intent === "publish" ? "publish" : "connect",
    native: payload.native === true,
  };
}
