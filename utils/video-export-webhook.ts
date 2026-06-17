import { createAdminClient } from "@/utils/supabase/admin";
import { buildFalWebhookUrl } from "@/utils/fal";
import {
  extractVideoUrlFromWebhook,
  parseVideoExportMetadata,
  submitMergeAudioVideoQueue,
  type FalVideoWebhookPayload,
  type VideoExportMetadata,
} from "@/utils/fal-video";

export async function handleVideoExportWebhook(
  body: FalVideoWebhookPayload,
  appBaseUrl: string,
): Promise<{ handled: string; status: number }> {
  const supabase = createAdminClient();

  const { data: exportRow, error: exportError } = await supabase
    .from("exports")
    .select("id, status, metadata, output_url")
    .eq("fal_request_id", body.request_id)
    .eq("export_type", "video")
    .maybeSingle();

  if (exportError || !exportRow) {
    return { handled: "export_not_found", status: 404 };
  }

  if (exportRow.status === "completed" && exportRow.output_url) {
    return { handled: "duplicate", status: 200 };
  }

  const metadata = parseVideoExportMetadata(exportRow.metadata);

  if (!metadata) {
    await supabase
      .from("exports")
      .update({
        status: "failed",
        error_message: "Invalid video export metadata",
      })
      .eq("id", exportRow.id);

    return { handled: "invalid_metadata", status: 422 };
  }

  if (body.status === "ERROR") {
    await supabase
      .from("exports")
      .update({
        status: "failed",
        error_message: body.error ?? "Fal video export failed",
      })
      .eq("id", exportRow.id);

    return { handled: "error", status: 200 };
  }

  const videoUrl = extractVideoUrlFromWebhook(body);

  if (!videoUrl) {
    await supabase
      .from("exports")
      .update({
        status: "failed",
        error_message: "Fal webhook did not include a video URL",
      })
      .eq("id", exportRow.id);

    return { handled: "missing_video_url", status: 422 };
  }

  if (metadata.stage === "images_to_video") {
    if (!metadata.audioUrl) {
      await supabase
        .from("exports")
        .update({
          status: "failed",
          error_message: "Missing narration audio URL for video merge",
        })
        .eq("id", exportRow.id);

      return { handled: "missing_audio_url", status: 422 };
    }

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
      .update({
        fal_request_id: mergeRequestId,
        metadata: nextMetadata,
      })
      .eq("id", exportRow.id);

    return { handled: "merge_queued", status: 200 };
  }

  if (metadata.stage === "merge_audio") {
    await supabase
      .from("exports")
      .update({
        status: "completed",
        output_url: videoUrl,
        error_message: null,
      })
      .eq("id", exportRow.id);

    return { handled: "completed", status: 200 };
  }

  return { handled: "ignored", status: 200 };
}
