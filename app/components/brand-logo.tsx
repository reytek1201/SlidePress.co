"use client";

import { brandLogoSrc, siteName } from "@/utils/site-metadata";
import { useActiveBrandOptional } from "@/app/components/active-brand-provider";
import { campaignsHref } from "@/utils/campaigns-href";
import Image from "next/image";
import Link from "next/link";

interface BrandLogoProps {
  href?: string;
  preserveActiveBrand?: boolean;
  showWordmark?: boolean;
  className?: string;
  imageClassName?: string;
}

export default function BrandLogo({
  href = "/",
  preserveActiveBrand = false,
  showWordmark = true,
  className = "flex items-center gap-2 transition hover:opacity-90",
  imageClassName = "h-7 w-7 object-contain",
}: BrandLogoProps) {
  const context = useActiveBrandOptional();
  const resolvedHref = preserveActiveBrand
    ? campaignsHref(context?.activeBrand?.id)
    : href;

  return (
    <Link href={resolvedHref} className={className}>
      <Image
        src={brandLogoSrc}
        alt={siteName}
        width={28}
        height={28}
        className={imageClassName}
        priority
      />
      {showWordmark ? (
        <span className="text-xl font-semibold leading-none tracking-tight text-foreground">
          {siteName}
        </span>
      ) : null}
    </Link>
  );
}
