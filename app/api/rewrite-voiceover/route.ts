import { assertAiRateLimit, isRateLimitError } from "@/utils/rate-limit";
import { rewriteVoiceoverScripts } from "@/utils/rewrite-voiceover";
import { createClient } from "@/utils/supabase/server";
import { VOICEOVER_REWRITE_CHIP_IDS } from "@/types/voiceover-rewrite";
import { NextResponse } from "next/server";
import { z } from "zod";

const RequestSchema = z.object({
  slideId: z.string().uuid(),
  tone: z.enum(VOICEOVER_REWRITE_CHIP_IDS),
});

export async function POST(request: Request) {
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

    assertAiRateLimit(user.id, "rewrite-voiceover");

    const body = await request.json();
    const parsed = RequestSchema.safeParse(body);

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

    const { slideId, tone } = parsed.data;

    const { data: slide, error: slideError } = await supabase
      .from("slides")
      .select("id, campaign_id, text_overlay, voiceover_script")
      .eq("id", slideId)
      .single();

    if (slideError || !slide) {
      return NextResponse.json(
        { success: false, error: "Slide not found" },
        { status: 404 },
      );
    }

    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select("user_id, topic")
      .eq("id", slide.campaign_id)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { success: false, error: "Campaign not found" },
        { status: 404 },
      );
    }

    if (campaign.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 },
      );
    }

    const headline = slide.text_overlay?.trim() ?? "";
    const currentScript = slide.voiceover_script?.trim() ?? "";

    if (!currentScript) {
      return NextResponse.json(
        { success: false, error: "This slide has no voiceover script yet" },
        { status: 400 },
      );
    }

    if (tone === "match_headline" && !headline) {
      return NextResponse.json(
        {
          success: false,
          error: "Add a headline first before matching the voiceover",
        },
        { status: 400 },
      );
    }

    const options = await rewriteVoiceoverScripts({
      tone,
      headline,
      currentScript,
      campaignTopic: campaign.topic,
    });

    return NextResponse.json({ success: true, options });
  } catch (error) {
    if (isRateLimitError(error)) {
      return NextResponse.json(
        { success: false, error: error.message, code: error.code },
        { status: 429 },
      );
    }

    const message =
      error instanceof Error ? error.message : "Unexpected server error";

    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
