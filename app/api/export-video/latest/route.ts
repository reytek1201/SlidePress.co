import { resolveLatestVideoExportForAspect } from "@/utils/platforms/resolve-video-export";
import { createClient } from "@/utils/supabase/server";
import type { AspectRatio } from "@/types/campaign";
import { NextResponse } from "next/server";

function parseAspectRatio(value: string | null): AspectRatio | null {
  if (value === "4:5" || value === "9:16") {
    return value;
  }

  return null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaignId");
    const aspectRatio = parseAspectRatio(searchParams.get("aspectRatio"));

    if (!campaignId) {
      return NextResponse.json(
        { success: false, error: "campaignId is required" },
        { status: 400 },
      );
    }

    if (!aspectRatio) {
      return NextResponse.json(
        { success: false, error: "aspectRatio must be 4:5 or 9:16" },
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

    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select("user_id")
      .eq("id", campaignId)
      .single();

    if (campaignError || !campaign || campaign.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: "Campaign not found" },
        { status: 404 },
      );
    }

    const exportRow = await resolveLatestVideoExportForAspect(
      supabase,
      campaignId,
      aspectRatio,
    );

    if (!exportRow) {
      return NextResponse.json(
        { success: false, error: "No completed video export found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      export: {
        id: exportRow.id,
        outputUrl: exportRow.outputUrl,
        createdAt: exportRow.createdAt,
        preset: exportRow.preset,
        aspectRatio: exportRow.aspectRatio,
      },
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
