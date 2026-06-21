import {
  DEFAULT_PUSH_NOTIFICATION_PREFERENCES,
  toPushNotificationPreferences,
  type PushNotificationPreferencesRow,
} from "@/types/push-notification-preferences";
import {
  ensureUserPushNotificationPreferences,
  updateUserPushNotificationPreferences,
} from "@/utils/push-notification-preferences";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const PatchSchema = z
  .object({
    notifyImagesReady: z.boolean().optional(),
    notifyVideoExportReady: z.boolean().optional(),
    notifyPlatformPublish: z.boolean().optional(),
  })
  .refine(
    (value) =>
      value.notifyImagesReady !== undefined ||
      value.notifyVideoExportReady !== undefined ||
      value.notifyPlatformPublish !== undefined,
    { message: "At least one preference must be provided" },
  );

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { data, error } = await supabase
      .from("user_notification_preferences")
      .select(
        "user_id, notify_images_ready, notify_video_export_ready, notify_platform_publish, created_at, updated_at",
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      preferences: toPushNotificationPreferences(
        (data as PushNotificationPreferencesRow | null) ?? null,
      ),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error";

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const parsed = PatchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request payload",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const preferences = await updateUserPushNotificationPreferences(
      user.id,
      parsed.data,
    );

    return NextResponse.json({
      success: true,
      preferences,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error";

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

export async function PUT() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const preferences = await ensureUserPushNotificationPreferences(
      user.id,
      DEFAULT_PUSH_NOTIFICATION_PREFERENCES,
    );

    return NextResponse.json({
      success: true,
      preferences,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error";

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
