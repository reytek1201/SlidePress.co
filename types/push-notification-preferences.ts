export type PushNotificationType =
  | "images_ready"
  | "video_export_ready"
  | "platform_publish";

export interface PushNotificationPreferences {
  notifyImagesReady: boolean;
  notifyVideoExportReady: boolean;
  notifyPlatformPublish: boolean;
}

export const DEFAULT_PUSH_NOTIFICATION_PREFERENCES: PushNotificationPreferences =
  {
    notifyImagesReady: true,
    notifyVideoExportReady: true,
    notifyPlatformPublish: true,
  };

export interface PushNotificationPreferencesRow {
  user_id: string;
  notify_images_ready: boolean;
  notify_video_export_ready: boolean;
  notify_platform_publish: boolean;
  created_at: string;
  updated_at: string;
}

export function toPushNotificationPreferences(
  row: PushNotificationPreferencesRow | null | undefined,
): PushNotificationPreferences {
  if (!row) {
    return { ...DEFAULT_PUSH_NOTIFICATION_PREFERENCES };
  }

  return {
    notifyImagesReady: row.notify_images_ready,
    notifyVideoExportReady: row.notify_video_export_ready,
    notifyPlatformPublish: row.notify_platform_publish,
  };
}

export function isPushNotificationTypeEnabled(
  preferences: PushNotificationPreferences,
  type: PushNotificationType,
): boolean {
  switch (type) {
    case "images_ready":
      return preferences.notifyImagesReady;
    case "video_export_ready":
      return preferences.notifyVideoExportReady;
    case "platform_publish":
      return preferences.notifyPlatformPublish;
    default:
      return true;
  }
}
