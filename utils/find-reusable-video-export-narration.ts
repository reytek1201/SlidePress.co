import type { SupabaseClient } from "@supabase/supabase-js";
import type { AspectRatio } from "@/types/campaign";
import { parseVideoExportMetadata } from "@/utils/fal-video";
import type { VideoExportPreset } from "@/utils/video-export-presets";
import {
  isImageOnlyVideoUpdate,
  narrationFingerprintsMatch,
  type SlideExportFingerprint,
} from "@/utils/video-export-fingerprint";

export interface ReusableVideoExportNarration {
  audioUrl: string;
  imageOnlyUpdate: boolean;
}

export async function findReusableVideoExportNarration(
  supabase: SupabaseClient,
  input: {
    campaignId: string;
    aspectRatio: AspectRatio;
    preset: VideoExportPreset;
    persona: string;
    narrationFingerprint: string;
    slideFingerprints: SlideExportFingerprint[];
  },
): Promise<ReusableVideoExportNarration | null> {
  const { data: rows } = await supabase
    .from("exports")
    .select("metadata")
    .eq("campaign_id", input.campaignId)
    .eq("export_type", "video")
    .eq("status", "completed")
    .order("updated_at", { ascending: false })
    .limit(10);

  for (const row of rows ?? []) {
    const metadata = parseVideoExportMetadata(row.metadata);
    if (!metadata?.audioUrl) {
      continue;
    }
    if (metadata.aspectRatio !== input.aspectRatio) {
      continue;
    }
    if (metadata.preset !== input.preset) {
      continue;
    }
    if (metadata.persona !== input.persona) {
      continue;
    }
    if (
      !narrationFingerprintsMatch(
        metadata.narrationFingerprint,
        input.narrationFingerprint,
      )
    ) {
      continue;
    }

    return {
      audioUrl: metadata.audioUrl,
      imageOnlyUpdate: isImageOnlyVideoUpdate(
        metadata.slideFingerprints,
        input.slideFingerprints,
      ),
    };
  }

  return null;
}
