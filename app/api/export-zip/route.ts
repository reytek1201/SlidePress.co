import {
  buildCampaignZip,
  buildDualAspectCampaignZip,
  getCampaignZipFilename,
} from "@/utils/build-campaign-zip";
import { createClient } from "@/utils/supabase/server";
import type { Campaign, Slide } from "@/types/campaign";
import type { PlatformCaption } from "@/types/captions";
import {
  aspectRatioFolderName,
  indexSlideImages,
  mergeSlidesWithAspect,
  slidesCompleteForAspect,
} from "@/utils/slide-aspect-images";
import { loadSlideImagesForCampaign } from "@/utils/slide-image-persistence";
import { NextResponse } from "next/server";
import { z } from "zod";

const RequestSchema = z.object({
  campaignId: z.string().uuid(),
});

export async function POST(request: Request) {
  let exportId: string | null = null;

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
    const slideImages = await loadSlideImagesForCampaign(supabase, campaignId);
    const imageIndex = indexSlideImages(slideImages as never);

    const primaryComplete = slidesCompleteForAspect(
      typedSlides,
      typedCampaign.aspect_ratio,
      typedCampaign,
      imageIndex,
    );

    if (!primaryComplete) {
      return NextResponse.json(
        {
          success: false,
          error: "Generate all slide images before exporting",
        },
        { status: 422 },
      );
    }

    const secondaryAspect = typedCampaign.secondary_aspect_ratio;
    const secondaryComplete =
      secondaryAspect &&
      slidesCompleteForAspect(
        typedSlides,
        secondaryAspect,
        typedCampaign,
        imageIndex,
      );

    const { data: exportRow, error: exportInsertError } = await supabase
      .from("exports")
      .insert({
        campaign_id: campaignId,
        export_type: "zip",
        status: "processing",
      })
      .select("id")
      .single();

    if (exportInsertError || !exportRow) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create export record",
          details: exportInsertError?.message,
        },
        { status: 500 },
      );
    }

    exportId = exportRow.id;

    const { data: captions } = await supabase
      .from("platform_captions")
      .select("*")
      .eq("campaign_id", campaignId);

    const typedCaptions = (captions ?? []) as PlatformCaption[];

    let zipBytes: Uint8Array;

    if (secondaryComplete && secondaryAspect) {
      const primarySlides = mergeSlidesWithAspect(
        typedSlides,
        typedCampaign.aspect_ratio,
        typedCampaign,
        imageIndex,
      );
      const secondarySlides = mergeSlidesWithAspect(
        typedSlides,
        secondaryAspect,
        typedCampaign,
        imageIndex,
      );

      zipBytes = await buildDualAspectCampaignZip(
        primarySlides,
        secondarySlides,
        typedCaptions,
        aspectRatioFolderName(typedCampaign.aspect_ratio),
        aspectRatioFolderName(secondaryAspect),
      );
    } else {
      const primarySlides = mergeSlidesWithAspect(
        typedSlides,
        typedCampaign.aspect_ratio,
        typedCampaign,
        imageIndex,
      );

      zipBytes = await buildCampaignZip(primarySlides, typedCaptions);
    }

    const filename = getCampaignZipFilename(typedCampaign);

    await supabase
      .from("exports")
      .update({
        status: "completed",
        error_message: null,
      })
      .eq("id", exportId);

    return new NextResponse(Buffer.from(zipBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (exportId) {
      const supabase = await createClient();
      const message =
        error instanceof Error ? error.message : "Zip export failed";

      await supabase
        .from("exports")
        .update({
          status: "failed",
          error_message: message,
        })
        .eq("id", exportId);
    }

    const message =
      error instanceof Error ? error.message : "Unexpected server error";

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
