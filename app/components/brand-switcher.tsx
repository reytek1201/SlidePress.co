"use client";

import { useActiveBrandOptional } from "@/app/components/active-brand-provider";
import type { Brand } from "@/types/brand";
import { useEffect, useState } from "react";

function ChevronDownIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 shrink-0 text-muted-foreground"
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 text-primary"
      aria-hidden
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

interface BrandPickerSheetProps {
  open: boolean;
  brands: Brand[];
  activeBrandId: string | null;
  onClose: () => void;
  onSelect: (brandId: string) => void;
}

function BrandPickerSheet({
  open,
  brands,
  activeBrandId,
  onClose,
  onSelect,
}: BrandPickerSheetProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70]" role="presentation">
      <button
        type="button"
        aria-label="Close brand picker"
        onClick={onClose}
        className="absolute inset-0 bg-black/60"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="brand-picker-title"
        className="absolute inset-x-0 bottom-0 max-h-[min(70vh,28rem)] overflow-y-auto rounded-t-2xl border-t border-border bg-card px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] pt-4 shadow-2xl"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" aria-hidden />

        <h2
          id="brand-picker-title"
          className="text-base font-semibold text-foreground"
        >
          Switch brand
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Campaigns and references are scoped to the brand you choose.
        </p>

        <ul className="mt-4 space-y-2">
          {brands.map((brand) => {
            const isActive = brand.id === activeBrandId;

            return (
              <li key={brand.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(brand.id);
                    onClose();
                  }}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition ${
                    isActive
                      ? "border-primary/40 bg-primary/10"
                      : "border-border bg-background hover:border-ring/60"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {brand.name}
                    </span>
                    {brand.is_default ? (
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        Primary brand
                      </span>
                    ) : null}
                  </span>
                  {isActive ? <CheckIcon /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export default function BrandSwitcher({
  className = "",
}: {
  className?: string;
}) {
  const context = useActiveBrandOptional();
  const [open, setOpen] = useState(false);

  if (!context || context.loading || context.brands.length <= 1) {
    return null;
  }

  const { brands, activeBrand, setActiveBrandId } = context;

  return (
    <>
      <div className={className}>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Brand
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
          className="mt-2 flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-card/60 px-4 py-3 text-left transition hover:border-ring/60 active:opacity-90"
        >
          <span className="min-w-0 truncate text-sm font-medium text-foreground">
            {activeBrand?.name ?? "Select brand"}
          </span>
          <ChevronDownIcon />
        </button>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Tap to switch which brand you&apos;re working in.
        </p>
      </div>

      <BrandPickerSheet
        open={open}
        brands={brands}
        activeBrandId={activeBrand?.id ?? null}
        onClose={() => setOpen(false)}
        onSelect={setActiveBrandId}
      />
    </>
  );
}
