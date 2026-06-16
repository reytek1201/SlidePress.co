/**
 * Keychain / Android Keystore token vault.
 *
 * On iOS:  data is stored in the app's Keychain (hardware-backed AES-256
 *          encryption, protected by the Secure Enclave on modern devices).
 * On Android: data is stored in EncryptedSharedPreferences, backed by the
 *          Android Keystore.
 * On web:  falls back to localStorage (dev-only; never reached in production
 *          because all callers guard on isBiometricSupported()).
 *
 * The vault holds one value: the Supabase refresh token. When biometric lock
 * is enabled this is the only durable copy of the token. The session cookies /
 * localStorage are cleared on each background-lock event so that the tokens
 * are not accessible without biometric unlock.
 */

import { SecureStoragePlugin } from "capacitor-secure-storage-plugin";
import { isBiometricSupported } from "@/utils/biometric-auth";

const REFRESH_TOKEN_KEY = "slidepress_refresh_token";

export async function storeRefreshToken(token: string): Promise<void> {
  if (!isBiometricSupported()) {
    return;
  }

  await SecureStoragePlugin.set({ key: REFRESH_TOKEN_KEY, value: token });
}

export async function readRefreshToken(): Promise<string | null> {
  if (!isBiometricSupported()) {
    return null;
  }

  try {
    const { value } = await SecureStoragePlugin.get({ key: REFRESH_TOKEN_KEY });
    return value ?? null;
  } catch {
    // Key not found — returns a rejected promise on some platforms.
    return null;
  }
}

export async function clearStoredTokens(): Promise<void> {
  if (!isBiometricSupported()) {
    return;
  }

  try {
    await SecureStoragePlugin.remove({ key: REFRESH_TOKEN_KEY });
  } catch {
    // Already gone.
  }
}
