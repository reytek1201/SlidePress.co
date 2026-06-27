import { buildFalWebhookUrl } from "@/utils/fal";
import {
  buildFalImageFramesFromSlideClips,
  submitImagesToVideoQueue,
  type VideoExportMetadata,
} from "@/utils/fal-video";
import { createAdminClient } from "@/utils/supabase/admin";

export async function queueFalImagesToVideoStage(
  exportId: string,
  metadata: VideoExportMetadata,
  appBaseUrl: string,
): Promise<void> {
  if (!metadata.slideClips?.length) {
    throw new Error("Video export is missing slide image data");
  }

  const imageFrames = buildFalImageFramesFromSlideClips(metadata.slideClips);
  const webhookUrl = buildFalWebhookUrl(appBaseUrl);
  const requestId = await submitImagesToVideoQueue(imageFrames, webhookUrl);

  const supabase = createAdminClient();
  const nextMetadata: VideoExportMetadata = {
    ...metadata,
    stage: "images_to_video",
  };

  const { error } = await supabase
    .from("exports")
    .update({
      fal_request_id: requestId,
      metadata: nextMetadata,
    })
    .eq("id", exportId);

  if (error) {
    throw new Error("Failed to queue slide video render on Fal");
  }
}

export function buildImagesToVideoStageMetadata(input: {
  preset: VideoExportMetadata["preset"];
  persona: string;
  aspectRatio: VideoExportMetadata["aspectRatio"];
  prepared: {
    audioUrl?: string;
    assStoragePath?: string;
    assContent?: string;
    burnCaptionTimingMs?: {
      alignment?: number;
      assGeneration?: number;
    };
  };
  slideClips: VideoExportMetadata["slideClips"];
  narrationFingerprint: string;
  slideFingerprints: VideoExportMetadata["slideFingerprints"];
  reusedNarration?: boolean;
  burnCaptions?: boolean;
}): VideoExportMetadata {
  return {
    stage: "images_to_video",
    preset: input.preset,
    persona: input.persona,
    aspectRatio: input.aspectRatio,
    audioUrl: input.prepared.audioUrl,
    slideClips: input.slideClips,
    narrationFingerprint: input.narrationFingerprint,
    slideFingerprints: input.slideFingerprints,
    reusedNarration: input.reusedNarration,
    burnCaptions: input.burnCaptions,
    assStoragePath: input.prepared.assStoragePath,
    assContent: input.prepared.assContent,
    timingMs: input.prepared.burnCaptionTimingMs,
  };
}
