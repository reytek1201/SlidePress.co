import type { AspectRatio, Campaign, Slide, SlideImage } from "@/types/campaign";
import {
  indexSlideImages,
  resolveSlideImage,
  slidesCompleteForAspect,
} from "@/utils/slide-aspect-images";
import type { createClient } from "@/utils/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const CAROUSEL_ASPECT_RATIO: AspectRatio = "4:5";

export interface ResolvedCarouselSlides {
  aspectRatio: AspectRatio;
  imageUrls: string[];
  slideCount: number;
}

export async function resolveCarouselSlidesForCampaign(
  supabase: SupabaseServerClient,
  campaignId: string,
): Promise<ResolvedCarouselSlides> {
  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select("id, aspect_ratio, secondary_aspect_ratio")
    .eq("id", campaignId)
    .single();

  if (campaignError || !campaign) {
    throw new Error("Campaign not found");
  }

  const { data: slides, error: slidesError } = await supabase
    .from("slides")
    .select("id, slide_index, image_url, fal_request_id")
    .eq("campaign_id", campaignId)
    .order("slide_index", { ascending: true });

  if (slidesError || !slides) {
    throw new Error("Could not load campaign slides");
  }

  const { data: slideImages, error: slideImagesError } = await supabase
    .from("slide_images")
    .select("slide_id, aspect_ratio, image_url, fal_request_id")
    .in(
      "slide_id",
      slides.map((slide) => slide.id),
    );

  if (slideImagesError) {
    throw new Error("Could not load slide images");
  }

  const imageIndex = indexSlideImages((slideImages ?? []) as SlideImage[]);
  const campaignPick = campaign as Pick<
    Campaign,
    "aspect_ratio" | "secondary_aspect_ratio"
  >;

  if (
    !slidesCompleteForAspect(
      slides as Slide[],
      CAROUSEL_ASPECT_RATIO,
      campaignPick,
      imageIndex,
    )
  ) {
    throw new Error("4:5 slide images are not ready yet");
  }

  const imageUrls = (slides as Slide[])
    .map(
      (slide) =>
        resolveSlideImage(
          slide,
          CAROUSEL_ASPECT_RATIO,
          campaignPick,
          imageIndex,
        ).image_url,
    )
    .filter((url): url is string => Boolean(url));

  return {
    aspectRatio: CAROUSEL_ASPECT_RATIO,
    imageUrls,
    slideCount: imageUrls.length,
  };
}
