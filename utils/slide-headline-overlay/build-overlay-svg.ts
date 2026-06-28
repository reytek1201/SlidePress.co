import type { TextRegionBackgroundTone } from "@/types/campaign";
import {
  getHeadlineFontSize,
  getHeadlineOverlayBox,
  HEADLINE_OVERLAY_STYLE_V1,
  resolveTextRegion,
  wrapHeadlineLines,
  estimateMaxCharsPerLine,
  type HeadlineOverlayBox,
} from "@/utils/slide-headline-overlay/layout";
import type { TextRegion } from "@/types/campaign";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function scrimRect(
  box: HeadlineOverlayBox,
  lineCount: number,
  fontSize: number,
  tone: TextRegionBackgroundTone,
): { x: number; y: number; width: number; height: number } {
  const lineHeight = fontSize * HEADLINE_OVERLAY_STYLE_V1.lineHeight;
  const height = Math.round(lineCount * lineHeight + fontSize * 0.55);
  const width = box.width;
  const style = HEADLINE_OVERLAY_STYLE_V1.scrim[tone];

  let x = box.x;
  if (box.textAnchor === "middle") {
    x = box.x - width / 2;
  } else if (box.textAnchor === "end") {
    x = box.x - width;
  }

  let y = box.y - Math.round(fontSize * 0.15);
  if (box.dominantBaseline === "middle") {
    y = box.y - height / 2;
  }

  return {
    x: Math.max(0, Math.round(x)),
    y: Math.max(0, Math.round(y)),
    width,
    height,
  };
}

export interface BuildHeadlineOverlaySvgInput {
  width: number;
  height: number;
  headline: string;
  textRegion: TextRegion | null | undefined;
  fontBase64?: string;
}

export function buildHeadlineOverlaySvg(
  input: BuildHeadlineOverlaySvgInput,
): string | null {
  const headline = input.headline.trim();
  if (!headline) {
    return null;
  }

  const region = resolveTextRegion(input.textRegion);
  const box = getHeadlineOverlayBox(
    input.width,
    input.height,
    region.position,
  );
  const fontSize = getHeadlineFontSize(input.width);
  const maxChars = estimateMaxCharsPerLine(box.width, fontSize);
  const lines = wrapHeadlineLines(headline, maxChars, box.maxLines);

  if (lines.length === 0) {
    return null;
  }

  const tone = region.background_tone;
  const textStyle = HEADLINE_OVERLAY_STYLE_V1.text[tone];
  const scrimStyle = HEADLINE_OVERLAY_STYLE_V1.scrim[tone];
  const scrim = scrimRect(box, lines.length, fontSize, tone);
  const lineHeight = fontSize * HEADLINE_OVERLAY_STYLE_V1.lineHeight;

  const fontFace = input.fontBase64
    ? `@font-face{font-family:'Inter';font-weight:700;src:url(data:font/ttf;base64,${input.fontBase64}) format('truetype');}`
    : "";

  const tspans = lines
    .map((line, index) => {
      const dy = index === 0 ? 0 : lineHeight;
      return `<tspan x="${box.x}" dy="${index === 0 ? 0 : dy}">${escapeXml(line)}</tspan>`;
    })
    .join("");

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${input.width}" height="${input.height}">`,
    `<defs><style>${fontFace}</style></defs>`,
    `<rect x="${scrim.x}" y="${scrim.y}" width="${scrim.width}" height="${scrim.height}" rx="${scrimStyle.radius}" fill="${scrimStyle.fill}" />`,
    `<text x="${box.x}" y="${box.y + fontSize}" font-family="'Inter', sans-serif" font-size="${fontSize}" font-weight="700"`,
    `fill="${textStyle.fill}" stroke="${textStyle.stroke}" stroke-width="${textStyle.strokeWidth}"`,
    `paint-order="stroke fill" text-anchor="${box.textAnchor}">${tspans}</text>`,
    `</svg>`,
  ].join("");
}

export function getHeadlineOverlayCssVars(
  textRegion: TextRegion | null | undefined,
): Record<string, string> {
  const region = resolveTextRegion(textRegion);
  const box = getHeadlineOverlayBox(1080, 1920, region.position);
  const tone = region.background_tone;
  const textStyle = HEADLINE_OVERLAY_STYLE_V1.text[tone];
  const scrimStyle = HEADLINE_OVERLAY_STYLE_V1.scrim[tone];

  const insetPercent = Math.round(
    HEADLINE_OVERLAY_STYLE_V1.horizontalInsetRatio * 100,
  );
  const verticalPercent =
    box.verticalBand === "upper"
      ? Math.round(100 * HEADLINE_OVERLAY_STYLE_V1.verticalAnchorRatio.upper)
      : box.verticalBand === "lower"
        ? Math.round(100 * HEADLINE_OVERLAY_STYLE_V1.verticalAnchorRatio.lower)
        : Math.round(100 * HEADLINE_OVERLAY_STYLE_V1.verticalAnchorRatio.center);

  const translateX =
    box.align === "center"
      ? "-50%"
      : box.align === "right"
        ? "-100%"
        : "0%";
  const translateY =
    box.verticalBand === "center" ? "-50%" : "0%";

  return {
    "--headline-overlay-left":
      box.align === "left"
        ? `${insetPercent}%`
        : box.align === "center"
          ? "50%"
          : "auto",
    "--headline-overlay-right":
      box.align === "right" ? `${insetPercent}%` : "auto",
    "--headline-overlay-top": `${verticalPercent}%`,
    "--headline-overlay-translate-x": translateX,
    "--headline-overlay-translate-y": translateY,
    "--headline-overlay-align": box.align,
    "--headline-overlay-max-width": `${Math.round(HEADLINE_OVERLAY_STYLE_V1.maxWidthRatio * 100)}%`,
    "--headline-overlay-font-size": `${HEADLINE_OVERLAY_STYLE_V1.fontSizeRatio * 100}cqw`,
    "--headline-overlay-line-height": String(HEADLINE_OVERLAY_STYLE_V1.lineHeight),
    "--headline-overlay-color": textStyle.fill,
    "--headline-overlay-stroke": textStyle.stroke,
    "--headline-overlay-stroke-width": `${textStyle.strokeWidth}px`,
    "--headline-overlay-scrim": scrimStyle.fill,
    "--headline-overlay-scrim-radius": `${scrimStyle.radius}px`,
  };
}
