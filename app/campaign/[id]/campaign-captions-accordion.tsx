"use client";

import type { PlatformCaption } from "@/types/captions";
import {
  formatHashtagsForDisplay,
  PLATFORM_LABELS,
} from "@/types/captions";
import { useState } from "react";

interface CampaignCaptionsAccordionProps {
  captions: PlatformCaption[];
  copiedPlatform: string | null;
  onCopyCaption: (platformCaption: PlatformCaption) => void;
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      fill="currentColor"
      className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
        open ? "rotate-180" : ""
      }`}
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function CampaignCaptionsAccordion({
  captions,
  copiedPlatform,
  onCopyCaption,
}: CampaignCaptionsAccordionProps) {
  const [sectionOpen, setSectionOpen] = useState(false);
  const [openPlatform, setOpenPlatform] = useState<string | null>(null);

  function togglePlatform(platform: string) {
    setOpenPlatform((current) => (current === platform ? null : platform));
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card/50 sm:rounded-xl">
      <button
        type="button"
        onClick={() => setSectionOpen((open) => !open)}
        className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left sm:px-5 sm:py-4"
        aria-expanded={sectionOpen}
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">Post copy</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {captions.length} platforms · expand to review hooks and hashtags
          </p>
        </div>
        <ChevronIcon open={sectionOpen} />
      </button>

      {sectionOpen && (
        <div className="border-t border-border">
          {captions.map((platformCaption, index) => {
            const isOpen = openPlatform === platformCaption.platform;

            return (
              <section
                key={platformCaption.id}
                className={index > 0 ? "border-t border-border" : undefined}
              >
                <div className="flex items-center gap-2 px-3 py-2 sm:px-5 sm:py-3">
                  <button
                    type="button"
                    onClick={() => togglePlatform(platformCaption.platform)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    aria-expanded={isOpen}
                  >
                    <ChevronIcon open={isOpen} />
                    <span className="truncate text-sm font-semibold text-secondary-foreground">
                      {PLATFORM_LABELS[platformCaption.platform]}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onCopyCaption(platformCaption)}
                    className="shrink-0 rounded-lg border border-border px-2.5 py-1 text-[11px] font-medium text-secondary-foreground transition hover:border-ring/60 hover:text-foreground sm:px-3 sm:py-1.5 sm:text-xs"
                  >
                    {copiedPlatform === platformCaption.platform
                      ? "Copied"
                      : "Copy"}
                  </button>
                </div>

                {isOpen && (
                  <div className="space-y-3 border-t border-border/60 px-3 pb-4 pt-3 sm:space-y-4 sm:px-5 sm:pb-5 sm:pt-4 md:px-6">
                    {platformCaption.platform === "youtube_shorts" &&
                      platformCaption.title && (
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Title
                          </p>
                          <p className="mt-2 text-sm font-semibold text-foreground">
                            {platformCaption.title}
                          </p>
                        </div>
                      )}

                    {platformCaption.hook && (
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Hook
                        </p>
                        <p className="mt-1.5 text-sm leading-6 text-secondary-foreground">
                          {platformCaption.hook}
                        </p>
                      </div>
                    )}

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Caption
                      </p>
                      <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-secondary-foreground sm:leading-7">
                        {platformCaption.caption}
                      </p>
                    </div>

                    {platformCaption.hashtags.length > 0 && (
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Hashtags
                        </p>
                        <p className="mt-2 text-sm leading-6 text-sky-300">
                          {formatHashtagsForDisplay(platformCaption.hashtags)}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
