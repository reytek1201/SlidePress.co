import type {
  PushNotificationPreferences,
  PushNotificationPreferencesRow,
  PushNotificationType,
} from "@/types/push-notification-preferences";
import {
  DEFAULT_PUSH_NOTIFICATION_PREFERENCES,
  isPushNotificationTypeEnabled,
  toPushNotificationPreferences,
} from "@/types/push-notification-preferences";
import { createAdminClient } from "@/utils/supabase/admin";

function preferencesToRow(
  userId: string,
  preferences: PushNotificationPreferences,
) {
  return {
    user_id: userId,
    notify_images_ready: preferences.notifyImagesReady,
    notify_video_export_ready: preferences.notifyVideoExportReady,
    notify_platform_publish: preferences.notifyPlatformPublish,
  };
}

export async function getUserPushNotificationPreferences(
  userId: string,
): Promise<PushNotificationPreferences> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("user_notification_preferences")
    .select(
      "user_id, notify_images_ready, notify_video_export_ready, notify_platform_publish, created_at, updated_at",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Failed to load push notification preferences:", error.message);
    return { ...DEFAULT_PUSH_NOTIFICATION_PREFERENCES };
  }

  return toPushNotificationPreferences(
    data as PushNotificationPreferencesRow | null,
  );
}

export async function userWantsPushNotification(
  userId: string,
  type: PushNotificationType,
): Promise<boolean> {
  const preferences = await getUserPushNotificationPreferences(userId);
  return isPushNotificationTypeEnabled(preferences, type);
}

export async function ensureUserPushNotificationPreferences(
  userId: string,
  preferences: PushNotificationPreferences = DEFAULT_PUSH_NOTIFICATION_PREFERENCES,
): Promise<PushNotificationPreferences> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("user_notification_preferences")
    .upsert(preferencesToRow(userId, preferences), { onConflict: "user_id" })
    .select(
      "user_id, notify_images_ready, notify_video_export_ready, notify_platform_publish, created_at, updated_at",
    )
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to save notification preferences");
  }

  return toPushNotificationPreferences(data as PushNotificationPreferencesRow);
}

export async function updateUserPushNotificationPreferences(
  userId: string,
  patch: Partial<PushNotificationPreferences>,
): Promise<PushNotificationPreferences> {
  const current = await getUserPushNotificationPreferences(userId);

  return ensureUserPushNotificationPreferences(userId, {
    notifyImagesReady: patch.notifyImagesReady ?? current.notifyImagesReady,
    notifyVideoExportReady:
      patch.notifyVideoExportReady ?? current.notifyVideoExportReady,
    notifyPlatformPublish:
      patch.notifyPlatformPublish ?? current.notifyPlatformPublish,
  });
}
