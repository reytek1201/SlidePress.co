import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
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

    const { data: exportRow, error: exportError } = await supabase
      .from("exports")
      .select(
        "id, campaign_id, export_type, status, output_url, error_message, created_at, updated_at",
      )
      .eq("id", id)
      .single();

    if (exportError || !exportRow) {
      return NextResponse.json(
        { success: false, error: "Export not found" },
        { status: 404 },
      );
    }

    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select("user_id")
      .eq("id", exportRow.campaign_id)
      .single();

    if (campaignError || !campaign || campaign.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    return NextResponse.json({
      success: true,
      export: {
        id: exportRow.id,
        campaignId: exportRow.campaign_id,
        exportType: exportRow.export_type,
        status: exportRow.status,
        outputUrl: exportRow.output_url,
        errorMessage: exportRow.error_message,
        createdAt: exportRow.created_at,
        updatedAt: exportRow.updated_at,
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
