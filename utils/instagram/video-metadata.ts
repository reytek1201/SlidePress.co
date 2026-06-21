import type { PlatformCaption } from "@/types/captions";
import {
  formatHashtagsOnlyForCopy,
  formatPostCaptionForCopy,
} from "@/types/captions";

const INSTAGRAM_CAPTION_MAX = 2200;
export const INSTAGRAM_REEL_MAX_DURATION_SEC = 90;

export function buildInstagramCaption(caption: PlatformCaption): string {
  const parts = [
    formatPostCaptionForCopy(caption),
    formatHashtagsOnlyForCopy(caption),
  ].filter(Boolean);

  return parts.join("\n\n").slice(0, INSTAGRAM_CAPTION_MAX);
}

export const buildInstagramReelCaption = buildInstagramCaption;
