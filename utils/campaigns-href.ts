export function campaignsHref(brandId?: string | null): string {
  if (!brandId) {
    return "/campaigns";
  }

  const params = new URLSearchParams({ brand: brandId });
  return `/campaigns?${params.toString()}`;
}
