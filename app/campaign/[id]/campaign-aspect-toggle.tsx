"use client";

import { formatAspectRatio } from "@/utils/campaign-display";
import type { AspectRatio } from "@/types/campaign";

interface CampaignAspectToggleProps {
  primaryAspectRatio: AspectRatio;
  secondaryAspectRatio: AspectRatio;
  activeAspectRatio: AspectRatio;
  onChange: (aspectRatio: AspectRatio) => void;
  disabled?: boolean;
}

export default function CampaignAspectToggle({
  primaryAspectRatio,
  secondaryAspectRatio,
  activeAspectRatio,
  onChange,
  disabled = false,
}: CampaignAspectToggleProps) {
  const options = [primaryAspectRatio, secondaryAspectRatio];

  return (
    <div
      className="inline-flex rounded-xl border border-border bg-background/40 p-1"
      role="tablist"
      aria-label="Slide format"
    >
      {options.map((aspectRatio) => {
        const isActive = aspectRatio === activeAspectRatio;

        return (
          <button
            key={aspectRatio}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={disabled}
            onClick={() => onChange(aspectRatio)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 sm:px-4 sm:py-2 sm:text-sm ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-secondary-foreground hover:text-foreground"
            }`}
          >
            {formatAspectRatio(aspectRatio)}
          </button>
        );
      })}
    </div>
  );
}
