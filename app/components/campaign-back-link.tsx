"use client";

import { useActiveBrandOptional } from "@/app/components/active-brand-provider";
import { campaignsHref } from "@/utils/campaigns-href";
import Link from "next/link";

interface CampaignBackLinkProps {
  className?: string;
  brandId?: string | null;
  brandName?: string | null;
}

export default function CampaignBackLink({
  className = "",
  brandId,
  brandName,
}: CampaignBackLinkProps) {
  const context = useActiveBrandOptional();
  const resolvedBrandId = brandId ?? context?.activeBrand?.id ?? null;
  const href = campaignsHref(resolvedBrandId);
  const label = brandName ? `${brandName} campaigns` : "All campaigns";

  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground ${className}`}
    >
      <span aria-hidden>←</span>
      {label}
    </Link>
  );
}
