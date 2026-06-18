import type { AspectRatio } from "@/types/campaign";

export interface VideoDimensions {
  width: number;
  height: number;
}

export function getVideoDimensions(aspectRatio: AspectRatio): VideoDimensions {
  return aspectRatio === "9:16"
    ? { width: 1080, height: 1920 }
    : { width: 1080, height: 1350 };
}
