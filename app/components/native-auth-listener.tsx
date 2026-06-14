"use client";

import {
  isNativeOAuthCallbackUrl,
  nativeDeepLinkToWebCallback,
} from "@/utils/native-oauth";
import { isNativeAppRuntime } from "@/utils/is-native-app";
import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { useEffect } from "react";

async function handleNativeAuthUrl(url: string) {
  if (!isNativeOAuthCallbackUrl(url)) {
    return;
  }

  try {
    await Browser.close();
  } catch {
    // Browser may already be closed.
  }

  const webCallbackUrl = nativeDeepLinkToWebCallback(url, window.location.origin);
  if (webCallbackUrl) {
    window.location.href = webCallbackUrl;
  }
}

export default function NativeAuthListener() {
  useEffect(() => {
    if (!isNativeAppRuntime()) {
      return;
    }

    let launchHandled = false;

    const appUrlListener = App.addListener("appUrlOpen", ({ url }) => {
      void handleNativeAuthUrl(url);
    });

    App.getLaunchUrl()
      .then((launch) => {
        if (launch?.url && !launchHandled) {
          launchHandled = true;
          void handleNativeAuthUrl(launch.url);
        }
      })
      .catch(() => {});

    return () => {
      void appUrlListener.then((listener) => listener.remove());
    };
  }, []);

  return null;
}
