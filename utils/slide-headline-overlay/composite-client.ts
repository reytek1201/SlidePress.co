import type { Slide } from "@/types/campaign";
import { buildHeadlineOverlaySvg } from "@/utils/slide-headline-overlay/build-overlay-svg";
import { isTextOverlayLayerEnabled } from "@/utils/text-overlay-layer";

export function shouldRenderHeadlineOverlay(
  slide: Pick<Slide, "text_overlay">,
): boolean {
  return isTextOverlayLayerEnabled() && Boolean(slide.text_overlay?.trim());
}

async function loadImageBitmap(imageUrl: string): Promise<ImageBitmap> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error("Failed to fetch slide image");
  }

  const blob = await response.blob();
  return createImageBitmap(blob);
}

export async function compositeHeadlineOntoImageBlob(
  imageUrl: string,
  slide: Pick<Slide, "text_overlay" | "text_region">,
): Promise<Blob> {
  if (!shouldRenderHeadlineOverlay(slide)) {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error("Failed to fetch slide image");
    }
    return response.blob();
  }

  const bitmap = await loadImageBitmap(imageUrl);
  const width = bitmap.width;
  const height = bitmap.height;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas is unavailable");
  }

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const svg = buildHeadlineOverlaySvg({
    width,
    height,
    headline: slide.text_overlay!.trim(),
    textRegion: slide.text_region,
  });

  if (svg) {
    const svgBlob = new Blob([svg], { type: "image/svg+xml" });
    const svgUrl = URL.createObjectURL(svgBlob);

    try {
      const overlayImage = await loadImageElement(svgUrl);
      ctx.drawImage(overlayImage, 0, 0, width, height);
    } finally {
      URL.revokeObjectURL(svgUrl);
    }
  }

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (!result) {
          reject(new Error("Failed to encode composited slide"));
          return;
        }
        resolve(result);
      },
      "image/jpeg",
      0.92,
    );
  });

  return blob;
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load overlay SVG"));
    image.src = src;
  });
}
