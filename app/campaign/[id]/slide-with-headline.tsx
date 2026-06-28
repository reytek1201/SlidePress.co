"use client";

import type { AspectRatio, Slide } from "@/types/campaign";
import { getHeadlineOverlayCssVars } from "@/utils/slide-headline-overlay/build-overlay-svg";
import { shouldRenderHeadlineOverlay } from "@/utils/slide-headline-overlay/composite-client";

interface SlideWithHeadlineProps {
  imageUrl: string;
  headline: string | null;
  textRegion: Slide["text_region"];
  aspectRatio: AspectRatio;
  alt: string;
  className?: string;
  imageClassName?: string;
  onClick?: () => void;
  buttonClassName?: string;
  showExpandHint?: boolean;
}

export default function SlideWithHeadline({
  imageUrl,
  headline,
  textRegion,
  aspectRatio: _aspectRatio,
  alt,
  className,
  imageClassName,
  onClick,
  buttonClassName,
  showExpandHint = false,
}: SlideWithHeadlineProps) {
  const showOverlay = shouldRenderHeadlineOverlay({ text_overlay: headline });
  const cssVars = showOverlay
    ? getHeadlineOverlayCssVars(textRegion)
    : undefined;

  const content = (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={imageClassName}
      />
      {showOverlay && headline?.trim() ? (
        <div
          className="headline-overlay-root pointer-events-none absolute inset-0"
          style={cssVars as React.CSSProperties}
        >
          <div className="headline-overlay-shell">
            <div className="headline-overlay-scrim" aria-hidden />
            <p className="headline-overlay-text">{headline.trim()}</p>
          </div>
        </div>
      ) : null}
      {showExpandHint ? (
        <span className="pointer-events-none absolute inset-0 hidden items-center justify-center rounded-lg bg-black/45 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 md:flex">
          <span className="rounded-full border border-border bg-background/95 px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm">
            Expand
          </span>
        </span>
      ) : null}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={
          buttonClassName ??
          `group relative max-h-full max-w-full cursor-zoom-in ${className ?? ""}`
        }
        aria-label={alt}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={`relative ${className ?? ""}`}>
      {content}
    </div>
  );
}
