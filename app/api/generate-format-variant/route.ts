import {
  markCampaignFailed,
  primaryImagesComplete,
  refreshCampaignImageStatus,
} from "@/utils/campaign-image-status";
import { referencesFromCampaign } from "@/utils/campaign-generation";
import {
  filterSlidesMissingAspectImage,
  queueSlideImagesForAspect,
} from "@/utils/queue-slide-images";
import { assertAiRateLimit, isRateLimitError } from "@/utils/rate-limit";
import { otherAspectRatio } from "@/utils/slide-aspect-images";
import { createClient } from "@/utils/supabase/server";
import { getReferenceImageUrls } from "@/types/references";
import type { Campaign, Slide } from "@/types/campaign";
import { NextResponse } from "next/server";
import { z } from "zod";

export const maxDuration = 300;

const RequestSchema = z.object({
  campaignId: z.string().uuid(),
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

    assertAiRateLimit(user.id, "generate-format-variant");

    const body = await request.json();
    const parsedInput = RequestSchema.safeParse(body);

    if (!parsedInput.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request payload",
          details: parsedInput.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { campaignId } = parsedInput.data;

    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", campaignId)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { success: false, error: "Campaign not found" },
        { status: 404 },
      );
    }

    const typedCampaign = campaign as Campaign;

    if (typedCampaign.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    if (typedCampaign.status === "generating_images") {
      return NextResponse.json(
        { success: false, error: "Image generation already in progress" },
        { status: 409 },
      );
    }

    const primaryReady = await primaryImagesComplete(supabase, typedCampaign);

    if (!primaryReady) {
      return NextResponse.json(
        {
          success: false,
          error: "Generate all primary slide images before adding another format",
        },
        { status: 422 },
      );
    }

    const secondaryAspect = otherAspectRatio(typedCampaign.aspect_ratio);

    const { data: slides, error: slidesError } = await supabase
      .from("slides")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("slide_index", { ascending: true });

    if (slidesError || !slides || slides.length === 0) {
      return NextResponse.json(
        { success: false, error: "No slides found for campaign" },
        { status: 404 },
      );
    }

    const typedSlides = slides as Slide[];
    const slidesToGenerate = await filterSlidesMissingAspectImage(
      supabase,
      typedSlides,
      secondaryAspect,
      typedCampaign,
    );

    if (slidesToGenerate.length === 0) {
      return NextResponse.json(
        {
          success: true,
          message: `${secondaryAspect} images already exist`,
          aspectRatio: secondaryAspect,
        },
        { status: 200 },
      );
    }

    const { error: campaignUpdateError } = await supabase
      .from("campaigns")
      .update({ secondary_aspect_ratio: secondaryAspect })
      .eq("id", campaignId);

    if (campaignUpdateError) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to enable secondary format",
          details: campaignUpdateError.message,
        },
        { status: 500 },
      );
    }

    const referenceUrls = getReferenceImageUrls(
      referencesFromCampaign(typedCampaign),
    );

    const result = await queueSlideImagesForAspect({
      supabase,
      campaign: { ...typedCampaign, secondary_aspect_ratio: secondaryAspect },
      slidesToGenerate,
      aspectRatio: secondaryAspect,
      referenceUrls,
      request,
    });

    return NextResponse.json(
      {
        success: true,
        aspectRatio: secondaryAspect,
        mode: result.mode,
        queued: result.queued ?? slidesToGenerate.length,
        message:
          result.mode === "sync"
            ? `${secondaryAspect} images generated`
            : `${secondaryAspect} image generation queued`,
      },
      { status: result.mode === "sync" ? 200 : 202 },
    );
  } catch (error) {
    if (isRateLimitError(error)) {
      return NextResponse.json(
        { success: false, error: error.message, code: error.code },
        { status: 429 },
      );
    }

    if (error instanceof Error && error.message === "Slide missing required content") {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 422 },
      );
    }

    const message =
      error instanceof Error ? error.message : "Unexpected server error";

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
