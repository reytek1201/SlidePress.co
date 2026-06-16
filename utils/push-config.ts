import { isApnsConfigured } from "@/utils/apns-config";
import { isFcmConfigured } from "@/utils/fcm-config";

export function isPushConfigured(): boolean {
  return isFcmConfigured() || isApnsConfigured();
}

export function isAndroidPushConfigured(): boolean {
  return isFcmConfigured();
}

export function isIosPushConfigured(): boolean {
  return isApnsConfigured();
}
