interface ApnsConfig {
  keyId: string;
  teamId: string;
  bundleId: string;
  privateKey: string;
  useSandbox: boolean;
}

export function getApnsConfig(): ApnsConfig | null {
  const keyId = process.env.APNS_KEY_ID?.trim();
  const teamId = process.env.APNS_TEAM_ID?.trim();
  const bundleId =
    process.env.APNS_BUNDLE_ID?.trim() || "co.slidepress.app";
  const privateKey = process.env.APNS_PRIVATE_KEY?.trim()?.replace(
    /\\n/g,
    "\n",
  );

  if (!keyId || !teamId || !privateKey) {
    return null;
  }

  const useSandbox = process.env.APNS_USE_SANDBOX?.trim() === "true";

  return {
    keyId,
    teamId,
    bundleId,
    privateKey,
    useSandbox,
  };
}

export function isApnsConfigured(): boolean {
  return getApnsConfig() !== null;
}
