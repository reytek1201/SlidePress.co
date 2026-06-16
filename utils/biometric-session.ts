/**
 * Biometric session utilities — Phase 1
 *
 * Stores whether biometric app-unlock is enabled in localStorage.
 * The Supabase session tokens remain in their existing localStorage key
 * (`slidepress-native-auth`). Phase 3 will migrate the refresh token
 * to the device Keychain / Android Keystore so it's only readable after
 * a biometric unlock.
 */

const BIOMETRIC_ENABLED_KEY = "slidepress-biometric-enabled";

/**
 * Returns true if the user has opted in to biometric unlock on this device.
 * Only meaningful inside the native app.
 */
export function isBiometricLockEnabled(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(BIOMETRIC_ENABLED_KEY) === "true";
}

/**
 * Persist the user's biometric preference.
 */
export function setBiometricLockEnabled(enabled: boolean): void {
  if (typeof window === "undefined") {
    return;
  }

  if (enabled) {
    window.localStorage.setItem(BIOMETRIC_ENABLED_KEY, "true");
  } else {
    window.localStorage.removeItem(BIOMETRIC_ENABLED_KEY);
  }
}

/**
 * Clear biometric preference. Call on sign-out and account deletion.
 */
export function clearBiometricSession(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(BIOMETRIC_ENABLED_KEY);
}
