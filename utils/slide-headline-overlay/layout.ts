import type { TextRegion, TextRegionBackgroundTone, TextRegionPosition } from "@/types/campaign";

export const HEADLINE_OVERLAY_STYLE_V1 = {
  version: "v1",
  fontFamily: "Inter",
  fontWeight: 700,
  /** Headline size relative to frame width. */
  fontSizeRatio: 0.072,
  maxWidthRatio: 0.86,
  horizontalInsetRatio: 0.07,
  lineHeight: 1.12,
  /** Region anchor as fraction of frame height (top / middle / bottom bands). */
  verticalAnchorRatio: {
    upper: 0.1,
    center: 0.44,
    lower: 0.68,
  } as const,
  scrim: {
    light: { fill: "rgba(0,0,0,0.42)", radius: 12 },
    dark: { fill: "rgba(255,255,255,0.52)", radius: 12 },
    mixed: { fill: "rgba(0,0,0,0.48)", radius: 14 },
  },
  text: {
    light: { fill: "#FFFFFF", stroke: "rgba(0,0,0,0.85)", strokeWidth: 3 },
    dark: { fill: "#141414", stroke: "rgba(255,255,255,0.9)", strokeWidth: 3 },
    mixed: { fill: "#FFFFFF", stroke: "rgba(0,0,0,0.9)", strokeWidth: 4 },
  },
} as const;

export const DEFAULT_TEXT_REGION: TextRegion = {
  position: "upper_center",
  background_tone: "mixed",
};

export interface HeadlineOverlayBox {
  x: number;
  y: number;
  width: number;
  maxLines: number;
  textAnchor: "start" | "middle" | "end";
  dominantBaseline: "hanging" | "middle" | "auto";
  align: "left" | "center" | "right";
  verticalBand: "upper" | "center" | "lower";
}

export function resolveTextRegion(
  textRegion: TextRegion | null | undefined,
): TextRegion {
  if (
    textRegion?.position &&
    textRegion?.background_tone &&
    isTextRegionPosition(textRegion.position) &&
    isTextRegionBackgroundTone(textRegion.background_tone)
  ) {
    return textRegion;
  }

  return DEFAULT_TEXT_REGION;
}

function isTextRegionPosition(value: string): value is TextRegionPosition {
  return [
    "upper_left",
    "upper_center",
    "upper_right",
    "center_left",
    "center",
    "center_right",
    "lower_left",
    "lower_center",
    "lower_right",
  ].includes(value);
}

function isTextRegionBackgroundTone(
  value: string,
): value is TextRegionBackgroundTone {
  return value === "light" || value === "dark" || value === "mixed";
}

export function getHeadlineOverlayBox(
  width: number,
  height: number,
  position: TextRegionPosition,
): HeadlineOverlayBox {
  const style = HEADLINE_OVERLAY_STYLE_V1;
  const boxWidth = Math.round(width * style.maxWidthRatio);
  const inset = Math.round(width * style.horizontalInsetRatio);

  const verticalBand = position.startsWith("upper")
    ? "upper"
    : position.startsWith("lower")
      ? "lower"
      : "center";

  const y = Math.round(height * style.verticalAnchorRatio[verticalBand]);

  let x = inset;
  let textAnchor: HeadlineOverlayBox["textAnchor"] = "start";
  let align: HeadlineOverlayBox["align"] = "left";

  if (position.endsWith("_center")) {
    x = Math.round(width / 2);
    textAnchor = "middle";
    align = "center";
  } else if (position.endsWith("_right")) {
    x = width - inset;
    textAnchor = "end";
    align = "right";
  }

  const dominantBaseline: HeadlineOverlayBox["dominantBaseline"] =
    verticalBand === "center" ? "middle" : "hanging";

  return {
    x,
    y,
    width: boxWidth,
    maxLines: 3,
    textAnchor,
    dominantBaseline,
    align,
    verticalBand,
  };
}

export function getHeadlineFontSize(width: number): number {
  return Math.max(
    18,
    Math.round(width * HEADLINE_OVERLAY_STYLE_V1.fontSizeRatio),
  );
}

export function wrapHeadlineLines(
  headline: string,
  maxCharsPerLine: number,
  maxLines: number,
): string[] {
  const words = headline.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return [];
  }

  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;

    if (candidate.length <= maxCharsPerLine) {
      current = candidate;
      continue;
    }

    if (current) {
      lines.push(current);
      current = word;
    } else {
      lines.push(word.slice(0, maxCharsPerLine));
      current = word.slice(maxCharsPerLine);
    }

    if (lines.length >= maxLines) {
      break;
    }
  }

  if (lines.length < maxLines && current) {
    lines.push(current);
  }

  return lines.slice(0, maxLines);
}

export function estimateMaxCharsPerLine(
  boxWidth: number,
  fontSize: number,
): number {
  const averageCharWidth = fontSize * 0.52;
  return Math.max(8, Math.floor(boxWidth / averageCharWidth));
}
