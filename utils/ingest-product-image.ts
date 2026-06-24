import { uploadIngestedReferenceImage } from "@/utils/ingest-reference-image";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function uploadIngestedProductImage(
  supabase: SupabaseClient,
  userId: string,
  imageUrl: string,
): Promise<string | null> {
  return uploadIngestedReferenceImage(
    supabase,
    userId,
    imageUrl,
    "product-ingest",
  );
}

export async function uploadIngestedLogoImage(
  supabase: SupabaseClient,
  userId: string,
  imageUrl: string,
): Promise<string | null> {
  return uploadIngestedReferenceImage(
    supabase,
    userId,
    imageUrl,
    "logo-ingest",
  );
}
