import { createAdminClient } from "@/utils/supabase/admin";
import { buildFalWebhookUrl } from "@/utils/fal";
import {
  FAL_IMAGES_TO_VIDEO_MODEL,
  FAL_MERGE_AUDIO_VIDEO_MODEL,
  fetchFalVideoUrl,
  isFalQueueCompleted,
  parseVideoExportMetadata,
  submitMergeAudioVideoQueue,
  type VideoExportMetadata,
} from "@/utils/fal-video";

interface ProcessingExportRow {
  id: string;
  fal_request_id: string | null;
  metadata: unknown;
  status: string;
  export_type: string;
}

/**
 * Checks whether the current Fal job for a video export has finished and, if
 * so, advances the pipeline without relying on webhook delivery:
 *
 *   images_to_video COMPLETED → queue merge-audio-video
 *   merge_audio COMPLETED     → mark export completed
 *
 * This is called on every GET /api/exports/:id poll so the client eventually
 * sees "completed" even when Fal webhooks don't reach the app.
 */
export async function advanceVideoExportIfReady(
  exportRow: ProcessingExportRow,
  appBaseUrl: string,
): Promise<void> {
  if (exportRow.status !== "processing") return;
  if (exportRow.export_type !== "video") return;
  if (!exportRow.fal_request_id) return;

  const metadata = parseVideoExportMetadata(exportRow.metadata);
  if (!metadata) return;

  const model =
    metadata.stage === "images_to_video"
      ? FAL_IMAGES_TO_VIDEO_MODEL
      : FAL_MERGE_AUDIO_VIDEO_MODEL;

  const completed = await isFalQueueCompleted(model, exportRow.fal_request_id);
  if (!completed) return;

  const videoUrl = await fetchFalVideoUrl(model, exportRow.fal_request_id);
  if (!videoUrl) return;

  const supabase = createAdminClient();

  if (metadata.stage === "images_to_video") {
    if (!metadata.audioUrl) return;

    const webhookUrl = buildFalWebhookUrl(appBaseUrl);
    const mergeRequestId = await submitMergeAudioVideoQueue(
      videoUrl,
      metadata.audioUrl,
      webhookUrl,
    );

    const nextMetadata: VideoExportMetadata = {
      ...metadata,
      stage: "merge_audio",
      silentVideoUrl: videoUrl,
    };

    await supabase
      .from("exports")
      .update({ fal_request_id: mergeRequestId, metadata: nextMetadata })
      .eq("id", exportRow.id);
  } else if (metadata.stage === "merge_audio") {
    await supabase
      .from("exports")
      .update({
        status: "completed",
        output_url: videoUrl,
        error_message: null,
      })
      .eq("id", exportRow.id);
  }
}
