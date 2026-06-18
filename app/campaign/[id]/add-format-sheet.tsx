"use client";

import { formatAspectRatio } from "@/utils/campaign-display";
import type { AspectRatio } from "@/types/campaign";
import { useEffect } from "react";

interface AddFormatSheetProps {
  open: boolean;
  onClose: () => void;
  secondaryAspectRatio: AspectRatio;
  slideCount: number;
  isGenerating: boolean;
  onConfirm: () => void;
}

function formatUseCase(aspectRatio: AspectRatio): string {
  return aspectRatio === "9:16"
    ? "Reels, Stories, and TikTok"
    : "Instagram feed and Facebook posts";
}

export default function AddFormatSheet({
  open,
  onClose,
  secondaryAspectRatio,
  slideCount,
  isGenerating,
  onConfirm,
}: AddFormatSheetProps) {
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isGenerating) {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, isGenerating, onClose]);

  if (!open) {
    return null;
  }

  const aspectLabel = formatAspectRatio(secondaryAspectRatio);

  return (
    <div
      className="fixed inset-0 z-[70] md:flex md:items-center md:justify-center md:p-8"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close add format"
        onClick={onClose}
        disabled={isGenerating}
        className="absolute inset-0 bg-black/60 md:bg-black/70"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-format-title"
        className="absolute inset-x-0 bottom-0 flex max-h-[min(90dvh,520px)] flex-col rounded-t-2xl border-t border-border bg-card shadow-2xl md:relative md:max-h-none md:w-full md:max-w-md md:rounded-2xl md:border"
      >
        <div className="shrink-0 px-5 pb-3 pt-4 md:px-6 md:pt-5">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border md:hidden" />
          <h2
            id="add-format-title"
            className="text-base font-semibold text-foreground"
          >
            Add {aspectLabel}?
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            We&apos;ll re-generate {slideCount} slide image
            {slideCount === 1 ? "" : "s"} in {aspectLabel} for{" "}
            {formatUseCase(secondaryAspectRatio)}. Your headlines, voiceover
            scripts, and captions stay the same.
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] md:px-6 md:pb-6">
          <div className="rounded-xl border border-border bg-background/40 px-4 py-3 text-sm leading-6 text-secondary-foreground">
            You can preview and export each format separately. Video exports
            count one credit per format.
          </div>
        </div>

        <div className="shrink-0 flex flex-col gap-2 border-t border-border px-5 py-4 md:flex-row md:justify-end md:px-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-secondary-foreground transition hover:border-ring/60 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            Not now
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isGenerating}
            className="btn-primary py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isGenerating ? "Starting…" : `Generate ${aspectLabel} images`}
          </button>
        </div>
      </div>
    </div>
  );
}
