import type { Slide } from "@/types/campaign";
import { compositeHeadlineOntoImageBlob } from "@/utils/slide-headline-overlay/composite-client";
import { shouldRenderHeadlineOverlay } from "@/utils/slide-headline-overlay/composite-client";

export async function fetchExportableSlideBlob(
  slide: Pick<Slide, "image_url" | "text_overlay" | "text_region">,
): Promise<Blob> {
  const imageUrl = slide.image_url;
  if (!imageUrl) {
    throw new Error("Slide has no image");
  }

  if (shouldRenderHeadlineOverlay(slide)) {
    return compositeHeadlineOntoImageBlob(imageUrl, slide);
  }

  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error("Failed to fetch slide image");
  }

  return response.blob();
}

export async function downloadSlideImage(
  slide: Pick<Slide, "image_url" | "text_overlay" | "text_region" | "slide_index">,
  filename?: string,
): Promise<void> {
  const resolvedFilename =
    filename ?? slideImageFilename(slide.slide_index);

  try {
    const blob = await fetchExportableSlideBlob(slide);
    const { compressImageBlob } = await import("@/utils/compress-image");
    const compressed = await compressImageBlob(blob);
    const jpgFilename = resolvedFilename.replace(/\.[^.]+$/, ".jpg");
    triggerBlobDownload(compressed, jpgFilename);
  } catch {
    if (!slide.image_url) {
      throw new Error("Slide has no image");
    }

    const anchor = document.createElement("a");
    anchor.href = slide.image_url;
    anchor.download = resolvedFilename;
    anchor.rel = "noopener";
    anchor.target = "_blank";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function slideImageFilename(slideIndex: number): string {
  return `slide-${String(slideIndex + 1).padStart(2, "0")}.jpg`;
}

/** @deprecated Pass the full slide object so headline overlays can be composited. */
export async function downloadSlideImageFromUrl(
  imageUrl: string,
  filename: string,
): Promise<void> {
  try {
    const response = await fetch(imageUrl);

    if (!response.ok) {
      throw new Error("Download failed");
    }

    const blob = await response.blob();
    const { compressImageBlob } = await import("@/utils/compress-image");
    const compressed = await compressImageBlob(blob);
    const jpgFilename = filename.replace(/\.[^.]+$/, ".jpg");
    triggerBlobDownload(compressed, jpgFilename);
  } catch {
    const anchor = document.createElement("a");
    anchor.href = imageUrl;
    anchor.download = filename;
    anchor.rel = "noopener";
    anchor.target = "_blank";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }
}
