import type { TextRegionBackgroundTone } from "@/types/campaign";
import {
  getHeadlineFontSize,
  getHeadlineOverlayBox,
  HEADLINE_OVERLAY_STYLE,
  resolveTextRegion,
  wrapHeadlineLines,
  estimateMaxCharsPerLine,
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

function buildTopGradientDef(
  width: number,
  height: number,
  tone: TextRegionBackgroundTone,
): string {
  const gradientHeight = Math.round(
    height * HEADLINE_OVERLAY_STYLE.topGradientHeightRatio,
  );
  const stops = HEADLINE_OVERLAY_STYLE.topGradientStops;
  const base =
    tone === "dark"
      ? { r: 255, g: 255, b: 255 }
      : { r: 0, g: 0, b: 0 };

  return [
    `<defs>`,
    `<linearGradient id="headlineTopFade" x1="0" y1="0" x2="0" y2="1">`,
    `<stop offset="0%" stop-color="rgb(${base.r},${base.g},${base.b})" stop-opacity="${stops.strong}"/>`,
    `<stop offset="55%" stop-color="rgb(${base.r},${base.g},${base.b})" stop-opacity="${stops.mid}"/>`,
    `<stop offset="100%" stop-color="rgb(${base.r},${base.g},${base.b})" stop-opacity="${stops.clear}"/>`,
    `</linearGradient>`,
    `</defs>`,
    `<rect x="0" y="0" width="${width}" height="${gradientHeight}" fill="url(#headlineTopFade)"/>`,
  ].join("");
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
  const textStyle = HEADLINE_OVERLAY_STYLE.text[tone];
  const lineHeight = fontSize * HEADLINE_OVERLAY_STYLE.lineHeight;

  const fontFace = input.fontBase64
    ? `@font-face{font-family:'Inter';font-weight:700;src:url(data:font/ttf;base64,${input.fontBase64}) format('truetype');}`
    : "";

  const tspans = lines
    .map((line, index) => {
      const dy = index === 0 ? 0 : lineHeight;
      return `<tspan x="${box.x}" dy="${index === 0 ? 0 : dy}">${escapeXml(line)}</tspan>`;
    })
    .join("");

  const shadowFilter = [
    `<filter id="headlineShadow" x="-20%" y="-20%" width="140%" height="140%">`,
    `<feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.45"/>`,
    `<feDropShadow dx="0" dy="1" stdDeviation="8" flood-color="#000" flood-opacity="0.35"/>`,
    `</filter>`,
  ].join("");

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${input.width}" height="${input.height}">`,
    `<defs><style>${fontFace}</style>${shadowFilter}</defs>`,
    buildTopGradientDef(input.width, input.height, tone),
    `<text x="${box.x}" y="${box.y + fontSize}" font-family="'Inter', sans-serif" font-size="${fontSize}" font-weight="700"`,
    `letter-spacing="${HEADLINE_OVERLAY_STYLE.letterSpacingEm}em"`,
    `fill="${textStyle.fill}" filter="url(#headlineShadow)" text-anchor="${box.textAnchor}">${tspans}</text>`,
    `</svg>`,
  ].join("");
}

export function getHeadlineOverlayCssVars(
  textRegion: TextRegion | null | undefined,
): Record<string, string> {
  const region = resolveTextRegion(textRegion);
  const box = getHeadlineOverlayBox(1080, 1920, region.position);
  const tone = region.background_tone;
  const textStyle = HEADLINE_OVERLAY_STYLE.text[tone];
  const insetPercent = Math.round(
    HEADLINE_OVERLAY_STYLE.horizontalInsetRatio * 100,
  );
  const verticalPercent = Math.round(
    100 * HEADLINE_OVERLAY_STYLE.verticalAnchorRatio,
  );
  const gradientHeightPercent = Math.round(
    100 * HEADLINE_OVERLAY_STYLE.topGradientHeightRatio,
  );

  const translateX =
    box.align === "center"
      ? "-50%"
      : box.align === "right"
        ? "-100%"
        : "0%";

  const gradientBase = tone === "dark" ? "255,255,255" : "0,0,0";
  const stops = HEADLINE_OVERLAY_STYLE.topGradientStops;

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
    "--headline-overlay-align": box.align,
    "--headline-overlay-max-width": `${Math.round(HEADLINE_OVERLAY_STYLE.maxWidthRatio * 100)}%`,
    "--headline-overlay-font-size": `${HEADLINE_OVERLAY_STYLE.fontSizeRatio * 100}cqw`,
    "--headline-overlay-line-height": String(HEADLINE_OVERLAY_STYLE.lineHeight),
    "--headline-overlay-letter-spacing": `${HEADLINE_OVERLAY_STYLE.letterSpacingEm}em`,
    "--headline-overlay-color": textStyle.fill,
    "--headline-overlay-shadow": textStyle.shadow,
    "--headline-overlay-gradient-height": `${gradientHeightPercent}%`,
    "--headline-overlay-gradient-base": gradientBase,
    "--headline-overlay-gradient-strong": String(stops.strong),
    "--headline-overlay-gradient-mid": String(stops.mid),
  };
}
