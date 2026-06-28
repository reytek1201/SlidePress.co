import {
  listPendingScheduledPostsForBrand,
  type ScheduledPostQueueItem,
} from "@/utils/platform-post-store";
import { getCanSchedulePublish } from "@/utils/usage-limits";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get("brandId");

    if (!brandId) {
      return NextResponse.json(
        { success: false, error: "brandId is required" },
        { status: 400 },
      );
    }

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

    const canSchedulePublish = await getCanSchedulePublish(supabase, user.id);

    if (!canSchedulePublish) {
      return NextResponse.json(
        { success: false, error: "Scheduled publishing requires a paid plan." },
        { status: 403 },
      );
    }

    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .select("id")
      .eq("id", brandId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (brandError || !brand) {
      return NextResponse.json(
        { success: false, error: "Brand not found" },
        { status: 404 },
      );
    }

    const posts: ScheduledPostQueueItem[] =
      await listPendingScheduledPostsForBrand(user.id, brandId);

    return NextResponse.json({
      success: true,
      posts,
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
