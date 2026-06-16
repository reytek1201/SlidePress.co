"use client";

import { useIsNativeApp } from "@/app/hooks/use-is-native-app";
import { useCallback, useEffect, useRef, useState } from "react";

const HEALTH_CHECK_TIMEOUT_MS = 8_000;
const HEALTH_RECHECK_MS = 30_000;

async function checkServerReachable(): Promise<boolean> {
  if (typeof window === "undefined") {
    return true;
  }

  if (!navigator.onLine) {
    return false;
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(
    () => controller.abort(),
    HEALTH_CHECK_TIMEOUT_MS,
  );

  try {
    const response = await fetch("/api/health", {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });

    return response.ok;
  } catch {
    return false;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export default function NativeConnectivity() {
  const isNativeApp = useIsNativeApp();
  const [offline, setOffline] = useState(false);
  const [checking, setChecking] = useState(false);
  const recheckTimerRef = useRef<number | null>(null);

  const runCheck = useCallback(async () => {
    setChecking(true);
    const reachable = await checkServerReachable();
    setOffline(!reachable);
    setChecking(false);
    return reachable;
  }, []);

  useEffect(() => {
    if (isNativeApp !== true) {
      return;
    }

    function clearRecheckTimer() {
      if (recheckTimerRef.current !== null) {
        window.clearInterval(recheckTimerRef.current);
        recheckTimerRef.current = null;
      }
    }

    function scheduleRecheck() {
      clearRecheckTimer();
      recheckTimerRef.current = window.setInterval(() => {
        void runCheck();
      }, HEALTH_RECHECK_MS);
    }

    function handleOnline() {
      void runCheck().then((reachable) => {
        if (reachable) {
          scheduleRecheck();
        }
      });
    }

    function handleOffline() {
      setOffline(true);
      clearRecheckTimer();
    }

    void runCheck().then(() => scheduleRecheck());

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      clearRecheckTimer();
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [isNativeApp, runCheck]);

  if (isNativeApp !== true || !offline) {
    return null;
  }

  return (
    <div
      role="alertdialog"
      aria-labelledby="native-connectivity-title"
      aria-describedby="native-connectivity-description"
      className="fixed inset-0 z-90 flex items-center justify-center bg-[#09090b] px-6"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="w-full max-w-sm text-center">
        <p
          id="native-connectivity-title"
          className="text-xl font-semibold tracking-tight text-zinc-100"
        >
          Can&apos;t reach SlidePress
        </p>
        <p
          id="native-connectivity-description"
          className="mt-3 text-sm leading-6 text-zinc-400"
        >
          Check your internet connection. SlidePress needs network access to load
          your campaigns and generate slides.
        </p>

        <button
          type="button"
          disabled={checking}
          onClick={() => {
            void runCheck().then((reachable) => {
              if (reachable) {
                window.location.reload();
              }
            });
          }}
          className="btn-primary mt-8 w-full py-2.5 text-sm disabled:opacity-60"
        >
          {checking ? "Checking…" : "Try again"}
        </button>
      </div>
    </div>
  );
}
