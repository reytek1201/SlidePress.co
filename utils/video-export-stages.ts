/** Client-side stages shown in the video export overlay. */
export type VideoExportUiStage =
  | "preparing"
  | "images_to_video"
  | "merge_audio"
  | "downloading";

export const VIDEO_EXPORT_UI_STAGES: VideoExportUiStage[] = [
  "preparing",
  "images_to_video",
  "merge_audio",
  "downloading",
];

export const VIDEO_EXPORT_STAGE_LABELS: Record<VideoExportUiStage, string> = {
  preparing: "Preparing narration",
  images_to_video: "Stitching slides",
  merge_audio: "Adding voiceover",
  downloading: "Downloading video",
};

export const VIDEO_EXPORT_STAGE_DESCRIPTIONS: Record<
  VideoExportUiStage,
  string
> = {
  preparing: "Synthesizing voiceover and queuing your video render…",
  images_to_video: "Building a silent video from your slide images…",
  merge_audio: "Merging AI narration into your video…",
  downloading: "Saving your MP4 — almost done…",
};

export const VIDEO_EXPORT_POLL_TIMEOUT_MS = 10 * 60_000;

export function mapPipelineStageToUiStage(
  stage: string | null | undefined,
): VideoExportUiStage {
  if (stage === "merge_audio") {
    return "merge_audio";
  }

  if (stage === "images_to_video") {
    return "images_to_video";
  }

  return "preparing";
}

export function getVideoExportStageIndex(stage: VideoExportUiStage): number {
  return VIDEO_EXPORT_UI_STAGES.indexOf(stage);
}

export type VideoExportStepState = "done" | "active" | "pending";

export function getVideoExportStepState(
  step: VideoExportUiStage,
  currentStage: VideoExportUiStage,
): VideoExportStepState {
  const stepIndex = getVideoExportStageIndex(step);
  const currentIndex = getVideoExportStageIndex(currentStage);

  if (stepIndex < currentIndex) {
    return "done";
  }

  if (stepIndex === currentIndex) {
    return "active";
  }

  return "pending";
}
