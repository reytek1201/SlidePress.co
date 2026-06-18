import type { CaptionSegment } from "@/utils/build-caption-srt";
import { burnCaptionsOnVideo, fetchVideoBuffer } from "@/utils/burn-video-captions";
import { uploadFalMedia } from "@/utils/fal-video";
import { presetBurnsCaptions } from "@/utils/video-export-presets";
import type { VideoExportPreset } from "@/utils/video-export-presets";

export interface FinalizeVideoExportInput {
  videoUrl: string;
  preset: VideoExportPreset;
  includeCaptions: boolean;
  captionSegments?: CaptionSegment[];
}

export async function finalizeVideoExport(
  input: FinalizeVideoExportInput,
): Promise<string> {
  const shouldBurnCaptions = presetBurnsCaptions(
    input.preset,
    input.includeCaptions,
  );

  if (!shouldBurnCaptions) {
    return input.videoUrl;
  }

  if (!input.captionSegments?.length) {
    throw new Error(
      "Caption burn-in was requested but no caption segments were provided",
    );
  }

  const videoBuffer = await fetchVideoBuffer(input.videoUrl);
  const captionedBuffer = await burnCaptionsOnVideo(
    videoBuffer,
    input.captionSegments,
  );

  return uploadFalMedia(
    captionedBuffer,
    "video/mp4",
    "campaign-video-captioned.mp4",
  );
}
