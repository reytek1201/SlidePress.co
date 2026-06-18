import { finalizeVideoExport } from "@/utils/finalize-video-export";
import {
  presetBurnsCaptions,
  presetIncludesNarration,
} from "@/utils/video-export-presets";
import type { VideoExportMetadata } from "@/utils/fal-video";

export function shouldBurnVideoCaptions(metadata: VideoExportMetadata): boolean {
  const preset = metadata.preset ?? "quick_reel";
  const includeCaptions = metadata.includeCaptions ?? false;
  return presetBurnsCaptions(preset, includeCaptions);
}

export function includesVideoNarration(metadata: VideoExportMetadata): boolean {
  const preset = metadata.preset ?? "quick_reel";
  return presetIncludesNarration(preset);
}

export async function completeVideoExportWithCaptions(
  metadata: VideoExportMetadata,
  videoUrl: string,
): Promise<string> {
  const preset = metadata.preset ?? "quick_reel";
  const includeCaptions = metadata.includeCaptions ?? false;
  const shouldBurnCaptions = shouldBurnVideoCaptions(metadata);

  if (!shouldBurnCaptions) {
    return videoUrl;
  }

  if (!metadata.captionSegments?.length) {
    throw new Error("Caption burn-in was requested but caption timing is missing");
  }

  return finalizeVideoExport({
    videoUrl,
    preset,
    includeCaptions,
    captionSegments: metadata.captionSegments,
  });
}
