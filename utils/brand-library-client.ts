import type { BrandLibrary } from "@/types/brand-library";

export async function fetchBrandLibrary(): Promise<BrandLibrary | null> {
  const response = await fetch("/api/brand-library");
  const data = (await response.json()) as {
    success: boolean;
    library?: BrandLibrary | null;
  };

  if (!response.ok || !data.success) {
    return null;
  }

  return data.library ?? null;
}

export async function saveBrandLibrary(references: {
  product?: string | null;
  style?: string | null;
  logo?: string | null;
}): Promise<BrandLibrary | null> {
  const response = await fetch("/api/brand-library", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(references),
  });

  const data = (await response.json()) as {
    success: boolean;
    library?: BrandLibrary;
    error?: string;
  };

  if (!response.ok || !data.success || !data.library) {
    throw new Error(data.error ?? "Failed to save brand library");
  }

  return data.library;
}

export async function clearBrandLibrary(): Promise<void> {
  const response = await fetch("/api/brand-library", { method: "DELETE" });

  if (!response.ok) {
    const data = (await response.json()) as { error?: string };
    throw new Error(data.error ?? "Failed to clear brand library");
  }
}
