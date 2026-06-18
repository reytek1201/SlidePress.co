import type { AspectRatio, Campaign } from "@/types/campaign";
import type { SupabaseClient } from "@supabase/supabase-js";

type SupabaseServerClient = SupabaseClient;

export async function upsertSlideImageRecord(
  supabase: SupabaseServerClient,
  options: {
    slideId: string;
    aspectRatio: AspectRatio;
    imageUrl?: string | null;
    falRequestId?: string | null;
    campaign: Pick<Campaign, "aspect_ratio">;
  },
): Promise<void> {
  const { slideId, aspectRatio, imageUrl, falRequestId, campaign } = options;

  const payload: Record<string, unknown> = {
    slide_id: slideId,
    aspect_ratio: aspectRatio,
    updated_at: new Date().toISOString(),
  };

  if (imageUrl !== undefined) {
    payload.image_url = imageUrl;
  }

  if (falRequestId !== undefined) {
    payload.fal_request_id = falRequestId;
  }

  const { error } = await supabase
    .from("slide_images")
    .upsert(payload, { onConflict: "slide_id,aspect_ratio" });

  if (error) {
    throw new Error(error.message);
  }

  if (aspectRatio === campaign.aspect_ratio) {
    const slideUpdate: Record<string, string | null> = {};

    if (imageUrl !== undefined) {
      slideUpdate.image_url = imageUrl;
    }

    if (falRequestId !== undefined) {
      slideUpdate.fal_request_id = falRequestId;
    }

    if (Object.keys(slideUpdate).length > 0) {
      const { error: slideError } = await supabase
        .from("slides")
        .update(slideUpdate)
        .eq("id", slideId);

      if (slideError) {
        throw new Error(slideError.message);
      }
    }
  }
}

export async function loadSlideImagesForCampaign(
  supabase: SupabaseServerClient,
  campaignId: string,
) {
  const { data: slides, error: slidesError } = await supabase
    .from("slides")
    .select("id")
    .eq("campaign_id", campaignId);

  if (slidesError) {
    throw new Error(slidesError.message);
  }

  const slideIds = (slides ?? []).map((slide) => slide.id);

  if (slideIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("slide_images")
    .select("*")
    .in("slide_id", slideIds);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}
