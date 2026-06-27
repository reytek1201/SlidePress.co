import { createAdminClient } from "@/utils/supabase/admin";
import { parseVideoExportMetadata } from "@/utils/fal-video";

/** Mark processing video exports older than this as failed. */
export const VIDEO_EXPORT_STALE_MS = 15 * 60_000;

/** Legacy local-compose exports stuck mid-encode after this age. */
export const VIDEO_EXPORT_COMPOSE_STUCK_MS = 6 * 60_000;

export function isExportOlderThan(
  updatedAt: string | null | undefined,
  maxAgeMs: number,
): boolean {
  if (!updatedAt) {
    return false;
  }

  const updatedMs = Date.parse(updatedAt);
  if (Number.isNaN(updatedMs)) {
    return false;
  }

  return Date.now() - updatedMs > maxAgeMs;
}

export async function failStaleVideoExportsForCampaign(
  campaignId: string,
): Promise<number> {
  const admin = createAdminClient();
  const staleBefore = new Date(Date.now() - VIDEO_EXPORT_STALE_MS).toISOString();

  const { data: processingExports } = await admin
    .from("exports")
    .select("id, metadata, updated_at")
    .eq("campaign_id", campaignId)
    .eq("export_type", "video")
    .eq("status", "processing");

  if (!processingExports?.length) {
    return 0;
  }

  const failedIds: string[] = [];

  for (const row of processingExports) {
    const globallyStale = row.updated_at != null && row.updated_at < staleBefore;
    const composeStuck =
      isLegacyComposeStuck(row.metadata) &&
      isExportOlderThan(row.updated_at, VIDEO_EXPORT_COMPOSE_STUCK_MS);

    if (globallyStale || composeStuck) {
      failedIds.push(row.id);
    }
  }

  if (failedIds.length === 0) {
    return 0;
  }

  await admin
    .from("exports")
    .update({
      status: "failed",
      error_message:
        "Video export timed out. Please try again — your narration cache may speed up the next attempt.",
    })
    .in("id", failedIds);

  return failedIds.length;
}

export function isLegacyComposeStuck(metadata: unknown): boolean {
  const parsed = parseVideoExportMetadata(metadata);
  if (!parsed || parsed.stage !== "compose_slides") {
    return false;
  }

  return Boolean(parsed.composeStarted && !parsed.silentVideoUrl);
}
