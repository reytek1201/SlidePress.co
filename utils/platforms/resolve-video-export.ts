import type { AspectRatio } from "@/types/campaign";
import { parseVideoExportMetadata } from "@/utils/fal-video";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface ResolvedVideoExport {
  id: string;
  outputUrl: string;
  aspectRatio: AspectRatio | null;
}

interface ExportRow {
  id: string;
  output_url: string | null;
  status: string;
  export_type: string;
  metadata: unknown;
  created_at: string;
}

export async function resolveVerticalVideoExport(
  supabase: SupabaseClient,
  campaignId: string,
  exportId?: string,
): Promise<ResolvedVideoExport> {
  if (exportId) {
    const { data, error } = await supabase
      .from("exports")
      .select("id, output_url, status, export_type, metadata")
      .eq("id", exportId)
      .eq("campaign_id", campaignId)
      .maybeSingle();

    if (error || !data) {
      throw new Error("Video export not found");
    }

    return validateExportRow(data as ExportRow);
  }

  const { data, error } = await supabase
    .from("exports")
    .select("id, output_url, status, export_type, metadata, created_at")
    .eq("campaign_id", campaignId)
    .eq("export_type", "video")
    .eq("status", "completed")
    .not("output_url", "is", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as ExportRow[];

  for (const row of rows) {
    const metadata = parseVideoExportMetadata(row.metadata);

    if (metadata?.aspectRatio === "9:16") {
      return validateExportRow(row);
    }
  }

  throw new Error(
    "No completed 9:16 video export found. Export a vertical Quick Reel first.",
  );
}

function validateExportRow(row: ExportRow): ResolvedVideoExport {
  if (row.export_type !== "video") {
    throw new Error("Export is not a video");
  }

  if (row.status !== "completed" || !row.output_url) {
    throw new Error("Video export is not ready");
  }

  const metadata = parseVideoExportMetadata(row.metadata);

  return {
    id: row.id,
    outputUrl: row.output_url,
    aspectRatio: metadata?.aspectRatio ?? null,
  };
}
