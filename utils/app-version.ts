import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

export interface AppVersionInfo {
  version: string;
  build: string;
  source: "native" | "web";
}

const WEB_VERSION =
  process.env.NEXT_PUBLIC_APP_VERSION?.trim() || "1.0.0";

export function getWebAppVersion(): string {
  return WEB_VERSION;
}

export async function getAppVersionInfo(): Promise<AppVersionInfo> {
  if (!Capacitor.isNativePlatform()) {
    return {
      version: WEB_VERSION,
      build: WEB_VERSION,
      source: "web",
    };
  }

  try {
    const info = await App.getInfo();
    return {
      version: info.version,
      build: info.build,
      source: "native",
    };
  } catch {
    return {
      version: WEB_VERSION,
      build: WEB_VERSION,
      source: "native",
    };
  }
}
