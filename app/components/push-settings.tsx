"use client";

import { useIsNativeApp } from "@/app/hooks/use-is-native-app";
import {
  dispatchPushPreferenceChanged,
  getStoredPushDeviceToken,
  isPushNotificationsEnabled,
  PUSH_REGISTRATION_FAILED_EVENT,
  setPushNotificationsEnabled,
  setStoredPushDeviceToken,
} from "@/utils/push-preferences";
import { useEffect, useState } from "react";

async function unregisterPushToken(token: string) {
  await fetch("/api/push/register", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
}

export default function PushSettings() {
  const isNativeApp = useIsNativeApp();
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isNativeApp !== true) {
      return;
    }

    setEnabled(isPushNotificationsEnabled());
  }, [isNativeApp]);

  useEffect(() => {
    if (isNativeApp !== true) {
      return;
    }

    function handleRegistrationFailed(event: Event) {
      const detail = (event as CustomEvent<{ reason?: string }>).detail;
      setBusy(false);
      setEnabled(false);
      setPushNotificationsEnabled(false);

      if (detail?.reason === "denied") {
        setError(
          "Notification permission was denied. Enable notifications for SlidePress in system settings to try again.",
        );
        return;
      }

      setError("Could not register for push notifications. Try again later.");
    }

    window.addEventListener(
      PUSH_REGISTRATION_FAILED_EVENT,
      handleRegistrationFailed,
    );

    return () => {
      window.removeEventListener(
        PUSH_REGISTRATION_FAILED_EVENT,
        handleRegistrationFailed,
      );
    };
  }, [isNativeApp]);

  if (isNativeApp !== true) {
    return (
      <p className="text-sm leading-6 text-muted-foreground">
        Push notifications are only available in the SlidePress mobile app.
      </p>
    );
  }

  async function handleToggle() {
    if (busy) {
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setBusy(true);

    if (enabled) {
      const token = getStoredPushDeviceToken();

      if (token) {
        await unregisterPushToken(token);
      }

      setStoredPushDeviceToken(null);
      setPushNotificationsEnabled(false);
      setEnabled(false);
      dispatchPushPreferenceChanged();
      setSuccessMessage("Push notifications turned off.");
      setBusy(false);
      return;
    }

    setPushNotificationsEnabled(true);
    setEnabled(true);
    dispatchPushPreferenceChanged();
    setSuccessMessage(
      "Requesting permission… If prompted, allow notifications to finish setup.",
    );
    setBusy(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            Campaign ready alerts
          </p>
          <p className="mt-0.5 text-sm leading-5 text-muted-foreground">
            {enabled
              ? "You will get a notification when all slide images finish generating."
              : "Get notified when every slide image in a campaign is ready."}
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label={`${enabled ? "Disable" : "Enable"} push notifications`}
          disabled={busy}
          onClick={() => void handleToggle()}
          className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
            enabled ? "bg-primary" : "bg-border"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ${
              enabled ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-200"
        >
          {error}
        </div>
      )}

      {successMessage && (
        <p className="mt-3 text-sm text-emerald-400">{successMessage}</p>
      )}
    </div>
  );
}
