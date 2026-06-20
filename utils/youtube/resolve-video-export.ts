import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveVerticalVideoExport } from "@/utils/platforms/resolve-video-export";

export type { ResolvedVideoExport } from "@/utils/platforms/resolve-video-export";

export async function resolveYouTubeVideoExport(
  supabase: SupabaseClient,
  campaignId: string,
  exportId?: string,
) {
  return resolveVerticalVideoExport(supabase, campaignId, exportId);
}
