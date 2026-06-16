"use client";

import {
  authenticate,
  checkBiometry,
  biometryLabel,
  biometryErrorMessage,
  isBiometricSupported,
  BiometryType,
  BiometryErrorType,
} from "@/utils/biometric-auth";
import {
  isBiometricLockEnabled,
  enableBiometricLock,
  disableBiometricLock,
} from "@/utils/biometric-session";
import { createClient } from "@/utils/supabase/client";
import { useIsNativeApp } from "@/app/hooks/use-is-native-app";
import { useCallback, useEffect, useState } from "react";

interface BiometryState {
  available: boolean;
  type: BiometryType;
  checked: boolean;
}

export default function BiometricSettings() {
  const isNativeApp = useIsNativeApp();
  const supabase = createClient();

  const [biometry, setBiometry] = useState<BiometryState>({
    available: false,
    type: BiometryType.none,
    checked: false,
  });
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const checkAndSetBiometry = useCallback(async () => {
    if (!isBiometricSupported()) {
      return;
    }

    const result = await checkBiometry();
    setBiometry({
      available: result.isAvailable,
      type: result.biometryType,
      checked: true,
    });
  }, []);

  useEffect(() => {
    if (isNativeApp !== true) {
      return;
    }

    setEnabled(isBiometricLockEnabled());
    void checkAndSetBiometry();
  }, [isNativeApp, checkAndSetBiometry]);

  if (isNativeApp !== true) {
    return null;
  }

  if (!biometry.checked) {
    return null;
  }

  if (!biometry.available) {
    return null;
  }

  const label = biometryLabel(biometry.type);

  async function handleToggle() {
    if (busy) {
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setBusy(true);

    // --- DISABLING ---
    if (enabled) {
      const { error: disableError } = await disableBiometricLock(supabase);
      setBusy(false);

      if (disableError) {
        setError(disableError);
        return;
      }

      setEnabled(false);
      setSuccessMessage(`${label} unlock disabled.`);
      return;
    }

    // --- ENABLING ---
    // Step 1: run a live biometric challenge to confirm the user can pass it.
    const { success, errorCode } = await authenticate({
      reason: `Confirm your identity to enable ${label} unlock for SlidePress.`,
      cancelTitle: "Cancel",
      allowDeviceCredential: false,
    });

    if (!success) {
      setBusy(false);

      if (errorCode !== BiometryErrorType.userCancel) {
        setError(biometryErrorMessage(errorCode ?? BiometryErrorType.none));
      }

      return;
    }

    // Step 2: save the refresh token to the Keychain.
    const { error: enableError } = await enableBiometricLock(supabase);
    setBusy(false);

    if (enableError) {
      setError(enableError);
      return;
    }

    setEnabled(true);
    setSuccessMessage(
      `${label} unlock enabled. The app will require ${label} each time you open it.`,
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {label} unlock
          </p>
          <p className="mt-0.5 text-sm leading-5 text-muted-foreground">
            {enabled
              ? `The app will require ${label} when you open it.`
              : `Use ${label} to unlock the app on open.`}
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label={`${enabled ? "Disable" : "Enable"} ${label} unlock`}
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
