"use client";

import type { BrandLibrary } from "@/types/brand-library";
import { brandLibraryToReferences, hasBrandLibrary } from "@/types/brand-library";
import Link from "next/link";

interface BrandLibraryPanelProps {
  library: BrandLibrary | null;
  useSavedBrand: boolean;
  onUseSavedBrandChange: (value: boolean) => void;
  isSaving: boolean;
}

export default function BrandLibraryPanel({
  library,
  useSavedBrand,
  onUseSavedBrandChange,
  isSaving,
}: BrandLibraryPanelProps) {
  const hasSaved = library && hasBrandLibrary(library);
  const references = hasSaved ? brandLibraryToReferences(library) : {};

  return (
    <div className="rounded-xl border border-border bg-card/40 px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-secondary-foreground">
            Brand library
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {hasSaved
              ? "Reuse your saved product, style, and logo references."
              : "Save references once in Settings and reuse them on every campaign."}
          </p>
        </div>
        <Link
          href="/settings"
          className="text-xs font-medium text-primary underline-offset-2 hover:underline"
        >
          Manage in settings
        </Link>
      </div>

      {hasSaved && (
        <>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {references.product && (
              <div className="rounded-lg border border-border bg-background p-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Product
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={references.product}
                  alt="Saved product reference"
                  className="mt-2 max-h-16 w-full object-contain"
                />
              </div>
            )}
            {references.style && (
              <div className="rounded-lg border border-border bg-background p-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Style
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={references.style}
                  alt="Saved style reference"
                  className="mt-2 max-h-16 w-full object-contain"
                />
              </div>
            )}
            {references.logo && (
              <div className="rounded-lg border border-border bg-background p-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Logo
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={references.logo}
                  alt="Saved logo reference"
                  className="mt-2 max-h-16 w-full object-contain"
                />
              </div>
            )}
          </div>

          <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-background px-3 py-3">
            <input
              type="checkbox"
              checked={useSavedBrand}
              onChange={(event) => onUseSavedBrandChange(event.target.checked)}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            <span className="text-sm text-secondary-foreground">
              Use saved brand references for this campaign
            </span>
          </label>
        </>
      )}

      {isSaving && (
        <p className="mt-2 text-xs text-muted-foreground">
          Saving brand library…
        </p>
      )}
    </div>
  );
}
