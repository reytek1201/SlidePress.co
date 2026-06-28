import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import type { Slide } from "@/types/campaign";
import { buildHeadlineOverlaySvg } from "@/utils/slide-headline-overlay/build-overlay-svg";
import { isTextOverlayLayerEnabled } from "@/utils/text-overlay-layer";

let cachedFontBase64: string | null = null;

async function loadInterBoldBase64(): Promise<string> {
  if (cachedFontBase64) {
    return cachedFontBase64;
  }

  const fontPath = join(process.cwd(), "app/fonts/inter-700.ttf");
  const buffer = await readFile(fontPath);
  cachedFontBase64 = buffer.toString("base64");
  return cachedFontBase64;
}

export function shouldCompositeHeadlineOverlay(
  slide: Pick<Slide, "text_overlay">,
): boolean {
  return isTextOverlayLayerEnabled() && Boolean(slide.text_overlay?.trim());
}

export async function compositeHeadlineOntoImageBuffer(
  imageBuffer: Buffer,
  slide: Pick<Slide, "text_overlay" | "text_region">,
): Promise<Buffer> {
  if (!shouldCompositeHeadlineOverlay(slide)) {
    return imageBuffer;
  }

  const metadata = await sharp(imageBuffer).metadata();
  const width = metadata.width ?? 1080;
  const height = metadata.height ?? 1350;

  const normalized = await sharp(imageBuffer)
    .rotate()
    .resize(width, height, { fit: "cover" })
    .jpeg({ quality: 95 })
    .toBuffer();

  const svg = buildHeadlineOverlaySvg({
    width,
    height,
    headline: slide.text_overlay!.trim(),
    textRegion: slide.text_region,
    fontBase64: await loadInterBoldBase64(),
  });

  if (!svg) {
    return normalized;
  }

  return sharp(normalized)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .jpeg({ quality: 92 })
    .toBuffer();
}

export async function compositeHeadlineOntoImageUrl(
  imageUrl: string,
  slide: Pick<Slide, "text_overlay" | "text_region">,
): Promise<Buffer> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error("Failed to fetch slide image for headline composite");
  }

  const imageBuffer = Buffer.from(await response.arrayBuffer());
  return compositeHeadlineOntoImageBuffer(imageBuffer, slide);
}
