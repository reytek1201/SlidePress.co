import {
  BiometricAuth,
  BiometryType,
  BiometryErrorType,
  type CheckBiometryResult,
  type AuthenticateOptions,
} from "@aparajita/capacitor-biometric-auth";
import { Capacitor } from "@capacitor/core";

export { BiometryType, BiometryErrorType };
export type { CheckBiometryResult };

export function isBiometricSupported(): boolean {
  return Capacitor.isNativePlatform();
}

export async function checkBiometry(): Promise<CheckBiometryResult> {
  return BiometricAuth.checkBiometry();
}

export async function authenticate(
  options?: AuthenticateOptions,
): Promise<{ success: boolean; errorCode: BiometryErrorType | null }> {
  try {
    await BiometricAuth.authenticate(options);
    return { success: true, errorCode: null };
  } catch (err) {
    const code =
      err instanceof Error && "code" in err
        ? (err as { code: BiometryErrorType }).code
        : BiometryErrorType.none;

    return { success: false, errorCode: code };
  }
}

export function biometryLabel(biometryType: BiometryType): string {
  switch (biometryType) {
    case BiometryType.faceId:
      return "Face ID";
    case BiometryType.touchId:
      return "Touch ID";
    case BiometryType.fingerprintAuthentication:
      return "Fingerprint";
    case BiometryType.faceAuthentication:
      return "Face unlock";
    case BiometryType.irisAuthentication:
      return "Iris scan";
    default:
      return "Biometrics";
  }
}

export function biometryErrorMessage(code: BiometryErrorType): string {
  switch (code) {
    case BiometryErrorType.biometryNotEnrolled:
      return "No biometrics enrolled on this device. Set up Face ID, Touch ID, or fingerprint in Settings.";
    case BiometryErrorType.biometryNotAvailable:
      return "Biometrics are not available on this device.";
    case BiometryErrorType.passcodeNotSet:
      return "A device passcode is required to use biometric unlock.";
    case BiometryErrorType.userCancel:
    case BiometryErrorType.systemCancel:
    case BiometryErrorType.appCancel:
      return "Authentication was cancelled.";
    case BiometryErrorType.biometryLockout:
      return "Biometrics are locked out due to too many failed attempts. Unlock your device first.";
    case BiometryErrorType.authenticationFailed:
      return "Authentication failed. Please try again.";
    default:
      return "Biometric authentication failed.";
  }
}
