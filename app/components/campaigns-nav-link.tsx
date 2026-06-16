"use client";

import { useActiveBrandOptional } from "@/app/components/active-brand-provider";
import { campaignsHref } from "@/utils/campaigns-href";
import Link from "next/link";
import type { ReactNode } from "react";

interface CampaignsNavLinkProps {
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}

export default function CampaignsNavLink({
  className,
  children,
  onClick,
}: CampaignsNavLinkProps) {
  const context = useActiveBrandOptional();
  const href = campaignsHref(context?.activeBrand?.id);

  return (
    <Link href={href} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}
