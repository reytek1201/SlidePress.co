import { createClient } from "@/utils/supabase/server";
import type { Campaign } from "@/types/campaign";
import { runCampaignTextGeneration } from "@/utils/run-campaign-text-generation";
import { NextResponse } from "next/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, context: RouteContext) {
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
        { status: 401 }
      );
    }

    const { data: campaign, error: fetchError } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !campaign) {
      return NextResponse.json(
        { success: false, error: "Campaign not found" },
        { status: 404 }
      );
    }

    if (campaign.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const typedCampaign = campaign as Campaign;

    if (
      typedCampaign.status !== "generating_text" &&
      typedCampaign.status !== "failed"
    ) {
      const { data: slides } = await supabase
        .from("slides")
        .select("id")
        .eq("campaign_id", id)
        .limit(1);

      if (slides && slides.length > 0) {
        return NextResponse.json({ success: true }, { status: 200 });
      }

      return NextResponse.json(
        { success: false, error: "Campaign is not awaiting text generation" },
        { status: 409 }
      );
    }

    const result = await runCampaignTextGeneration(supabase, typedCampaign);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          creditRefunded: result.creditRefunded,
          campaignDeleted: result.campaignDeleted,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error";

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
