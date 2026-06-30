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
  /** Size constraints for the slide frame (max height, width, etc.). */
  className?: string;
  /** Optional classes on the image (e.g. hover opacity). */
  imageClassName?: string;
  onClick?: () => void;
  buttonClassName?: string;
  showExpandHint?: boolean;
}

function aspectRatioClass(aspectRatio: AspectRatio): string {
  return aspectRatio === "4:5" ? "aspect-[4/5]" : "aspect-[9/16]";
}

export default function SlideWithHeadline({
  imageUrl,
  headline,
  textRegion,
  aspectRatio,
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

  const frame = (
    <div
      className={`relative ${aspectRatioClass(aspectRatio)} overflow-hidden ${className ?? ""}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={`block size-full object-cover ${imageClassName ?? ""}`}
      />
      {showOverlay && headline?.trim() ? (
        <div
          className="headline-overlay-root pointer-events-none absolute inset-0"
          style={cssVars as React.CSSProperties}
        >
          <div className="headline-overlay-shell">
            <p className="headline-overlay-text">{headline.trim()}</p>
          </div>
        </div>
      ) : null}
      {showExpandHint ? (
        <span className="pointer-events-none absolute inset-0 hidden items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 md:flex">
          <span className="rounded-full border border-border bg-background/95 px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm">
            Expand
          </span>
        </span>
      ) : null}
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={
          buttonClassName ??
          "group block max-w-full min-w-0 cursor-zoom-in"
        }
        aria-label={alt}
      >
        {frame}
      </button>
    );
  }

  return <div className="block max-w-full min-w-0">{frame}</div>;
}
