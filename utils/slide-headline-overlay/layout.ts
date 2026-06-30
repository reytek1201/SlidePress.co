import type { TextRegion, TextRegionBackgroundTone, TextRegionPosition } from "@/types/campaign";

export interface ShouldCompositeHeadlineOptions {
  /** Skip headline when exporting video with burned captions. */
  burnCaptionsVideo?: boolean;
}

/** Carousel headline positions — upper third only (caption-safe). */
export type HeadlineOverlayPosition =
  | "upper_left"
  | "upper_center"
  | "upper_right";

export const HEADLINE_OVERLAY_POSITIONS: HeadlineOverlayPosition[] = [
  "upper_left",
  "upper_center",
  "upper_right",
];

export const HEADLINE_OVERLAY_STYLE = {
  version: "v3",
  fontFamily: "Montserrat",
  fontWeight: 800,
  fontSizeRatio: 0.065,
  maxWidthRatio: 0.84,
  horizontalInsetRatio: 0.08,
  lineHeight: 1.05,
  maxLines: 2,
  letterSpacingEm: -0.03,
  verticalAnchorRatio: 0.11,
  /** Top gradient fade height as fraction of frame height (CSS + SVG). */
  topGradientHeightRatio: 0.42,
  topGradientStops: {
    strong: 0.52,
    mid: 0.22,
    clear: 0,
  },
  text: {
    light: {
      fill: "#FFFFFF",
      shadow: "0 2px 16px rgba(0,0,0,0.55), 0 1px 3px rgba(0,0,0,0.45)",
    },
    dark: {
      fill: "#111111",
      shadow: "0 2px 12px rgba(255,255,255,0.35), 0 1px 3px rgba(0,0,0,0.25)",
    },
    mixed: {
      fill: "#FFFFFF",
      shadow: "0 2px 20px rgba(0,0,0,0.65), 0 1px 4px rgba(0,0,0,0.55)",
    },
  },
} as const;

/** @deprecated alias */
export const HEADLINE_OVERLAY_STYLE_V1 = HEADLINE_OVERLAY_STYLE;

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
  align: "left" | "center" | "right";
}

export function clampToUpperThirdPosition(
  position: TextRegionPosition,
): HeadlineOverlayPosition {
  if (position === "upper_left" || position === "upper_center" || position === "upper_right") {
    return position;
  }

  if (position.endsWith("_left")) {
    return "upper_left";
  }

  if (position.endsWith("_right")) {
    return "upper_right";
  }

  return "upper_center";
}

export function resolveTextRegion(
  textRegion: TextRegion | null | undefined,
): TextRegion & { position: HeadlineOverlayPosition } {
  const tone =
    textRegion?.background_tone &&
    isTextRegionBackgroundTone(textRegion.background_tone)
      ? textRegion.background_tone
      : DEFAULT_TEXT_REGION.background_tone;

  const position = clampToUpperThirdPosition(
    textRegion?.position ?? DEFAULT_TEXT_REGION.position,
  );

  return { position, background_tone: tone };
}

function isTextRegionBackgroundTone(
  value: string,
): value is TextRegionBackgroundTone {
  return value === "light" || value === "dark" || value === "mixed";
}

export function getHeadlineOverlayBox(
  width: number,
  height: number,
  position: HeadlineOverlayPosition,
): HeadlineOverlayBox {
  const style = HEADLINE_OVERLAY_STYLE;
  const boxWidth = Math.round(width * style.maxWidthRatio);
  const inset = Math.round(width * style.horizontalInsetRatio);
  const y = Math.round(height * style.verticalAnchorRatio);

  let x = inset;
  let textAnchor: HeadlineOverlayBox["textAnchor"] = "start";
  let align: HeadlineOverlayBox["align"] = "left";

  if (position === "upper_center") {
    x = Math.round(width / 2);
    textAnchor = "middle";
    align = "center";
  } else if (position === "upper_right") {
    x = width - inset;
    textAnchor = "end";
    align = "right";
  }

  return {
    x,
    y,
    width: boxWidth,
    maxLines: style.maxLines,
    textAnchor,
    align,
  };
}

export function getHeadlineFontSize(width: number): number {
  return Math.max(
    16,
    Math.round(width * HEADLINE_OVERLAY_STYLE.fontSizeRatio),
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
  const averageCharWidth = fontSize * 0.55;
  return Math.max(8, Math.floor(boxWidth / averageCharWidth));
}
