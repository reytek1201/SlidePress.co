import type { Campaign } from "@/types/campaign";

export function formatAspectRatio(ratio: Campaign["aspect_ratio"]): string {
  return ratio === "4:5" ? "4:5 Portrait" : "9:16 Vertical";
}

export function formatCampaignDate(isoDate: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(isoDate));
}

export function getCampaignPreviewImage(
  slides: Array<{ slide_index: number; image_url: string | null }> | null
): string | null {
  if (!slides || slides.length === 0) {
    return null;
  }

  const sortedSlides = [...slides].sort(
    (left, right) => left.slide_index - right.slide_index
  );

  return (
    sortedSlides.find((slide) => slide.image_url)?.image_url ??
    sortedSlides[0]?.image_url ??
    null
  );
}
