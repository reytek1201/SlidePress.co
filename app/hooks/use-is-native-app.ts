"use client";

import { isNativeAppRuntime } from "@/utils/is-native-app";
import { useEffect, useState } from "react";

export function useIsNativeApp(): boolean {
  const [isNativeApp, setIsNativeApp] = useState(false);

  useEffect(() => {
    function syncNativeState() {
      setIsNativeApp(isNativeAppRuntime());
    }

    syncNativeState();

    const frameId = window.requestAnimationFrame(syncNativeState);
    const timeoutId = window.setTimeout(syncNativeState, 50);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
    };
  }, []);

  return isNativeApp;
}
