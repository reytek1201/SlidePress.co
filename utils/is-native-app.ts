import { Capacitor } from "@capacitor/core";

const NATIVE_APP_UA_TOKEN = "SlidePressApp/";

type NativeWindow = Window & {
  androidBridge?: unknown;
  webkit?: {
    messageHandlers?: {
      bridge?: unknown;
    };
  };
};

export function isNativeAppRuntime(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  if (navigator.userAgent.includes(NATIVE_APP_UA_TOKEN)) {
    return true;
  }

  const win = window as NativeWindow;

  if (win.androidBridge || win.webkit?.messageHandlers?.bridge) {
    return true;
  }

  try {
    const platform = Capacitor.getPlatform();
    return platform === "ios" || platform === "android";
  } catch {
    return false;
  }
}
