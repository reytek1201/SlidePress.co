import type { Campaign } from "@/types/campaign";
import type { SupabaseClient } from "@supabase/supabase-js";
import { referencesFromCampaign } from "@/utils/campaign-generation";
import { generateCampaignContent } from "@/utils/gemini";
import { mapGeminiError } from "@/utils/map-gemini-error";
import type { SlideCount } from "@/types/slides";
import { refundCampaignCreationOnFailure } from "@/utils/usage-limits";

export function formatTextGenerationError(error: unknown): string {
  return mapGeminiError(error);
}

export type TextGenerationResult =
  | { success: true }
  | {
      success: false;
      error: string;
      creditRefunded: boolean;
      campaignDeleted: boolean;
    };

export async function runCampaignTextGeneration(
  supabase: SupabaseClient,
  campaign: Campaign
): Promise<TextGenerationResult> {
  const { data: existingSlides, error: slidesCheckError } = await supabase
    .from("slides")
    .select("id")
    .eq("campaign_id", campaign.id)
    .limit(1);

  if (slidesCheckError) {
    return {
      success: false,
      error: "Failed to check campaign slides",
      creditRefunded: false,
      campaignDeleted: false,
    };
  }

  if (existingSlides && existingSlides.length > 0) {
    if (campaign.status !== "idle") {
      await supabase
        .from("campaigns")
        .update({ status: "idle", error_message: null })
        .eq("id", campaign.id);
    }

    return { success: true };
  }

  await supabase
    .from("campaigns")
    .update({ status: "generating_text", error_message: null })
    .eq("id", campaign.id);

  try {
    const slideCount = campaign.slide_count as SlideCount;
    const references = referencesFromCampaign(campaign);

    const generated = await generateCampaignContent(
      campaign.topic,
      campaign.aspect_ratio,
      slideCount,
      references
    );

    const slidesPayload = generated.slides.map((slide) => ({
      campaign_id: campaign.id,
      slide_index: slide.slide_index,
      text_overlay: slide.text_overlay,
      voiceover_script: slide.voiceover_script,
      image_prompt: slide.image_prompt,
    }));

    const { error: slidesError } = await supabase
      .from("slides")
      .insert(slidesPayload);

    if (slidesError) {
      throw new Error(slidesError.message);
    }

    const { error: updateError } = await supabase
      .from("campaigns")
      .update({
        title: generated.title,
        target_audience: generated.target_audience,
        content_style: generated.content_style,
        status: "idle",
        error_message: null,
      })
      .eq("id", campaign.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return { success: true };
  } catch (error) {
    const message = formatTextGenerationError(error);

    let creditRefunded = false;

    try {
      creditRefunded = await refundCampaignCreationOnFailure(
        campaign.user_id,
        campaign.id,
      );
    } catch (refundError) {
      console.error("Failed to refund campaign credit:", refundError);
    }

    const { error: deleteError } = await supabase
      .from("campaigns")
      .delete()
      .eq("id", campaign.id);

    if (!deleteError) {
      return {
        success: false,
        error: message,
        creditRefunded,
        campaignDeleted: true,
      };
    }

    await supabase
      .from("campaigns")
      .update({
        status: "failed",
        error_message: message,
        creation_credit_refunded: creditRefunded,
      })
      .eq("id", campaign.id);

    return {
      success: false,
      error: message,
      creditRefunded,
      campaignDeleted: false,
    };
  }
}
