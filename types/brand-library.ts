import type { CampaignReferences } from "@/types/references";
import { hasReferences } from "@/types/references";

export interface BrandLibrary {
  user_id: string;
  product_reference_url: string | null;
  style_reference_url: string | null;
  logo_reference_url: string | null;
  updated_at: string;
}

export function brandLibraryToReferences(
  library: BrandLibrary | null | undefined
): CampaignReferences {
  if (!library) {
    return {};
  }

  return {
    product: library.product_reference_url,
    style: library.style_reference_url,
    logo: library.logo_reference_url,
  };
}

export function referencesToBrandLibraryPayload(
  references: CampaignReferences
): {
  product?: string;
  style?: string;
  logo?: string;
} {
  const payload: {
    product?: string;
    style?: string;
    logo?: string;
  } = {};

  if (references.product) {
    payload.product = references.product;
  }

  if (references.style) {
    payload.style = references.style;
  }

  if (references.logo) {
    payload.logo = references.logo;
  }

  return payload;
}

export function hasBrandLibrary(library: BrandLibrary | null | undefined): boolean {
  return hasReferences(brandLibraryToReferences(library));
}
