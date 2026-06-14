"use client";

import {
  getCampaignProgressSteps,
  scrollToCampaignSection,
  type CampaignProgressStep,
} from "@/utils/campaign-progress";

interface CampaignProgressStripProps {
  slideCount: number;
  imagesReadyCount: number;
  imagesComplete: boolean;
  isGeneratingImages: boolean;
  captionsCount: number;
}

function StepIndicator({ step, index }: { step: CampaignProgressStep; index: number }) {
  return (
    <>
      {index > 0 && (
        <div
          aria-hidden
          className={`hidden h-px flex-1 sm:block ${
            step.complete ? "bg-emerald-700/60" : "bg-border"
          }`}
        />
      )}
      <button
        type="button"
        onClick={() => scrollToCampaignSection(step.scrollTargetId)}
        className={`flex shrink-0 flex-col items-center gap-1.5 rounded-xl px-2 py-2 text-center transition hover:bg-card/60 sm:min-w-18 ${
          step.current ? "bg-card/50" : ""
        }`}
      >
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold ${
            step.complete
              ? "border-emerald-700/60 bg-emerald-950/40 text-emerald-300"
              : step.current
                ? "border-primary/60 bg-primary/10 text-primary"
                : "border-border bg-background text-muted-foreground"
          }`}
        >
          {step.complete ? "✓" : index + 1}
        </span>
        <span
          className={`text-[11px] font-semibold uppercase tracking-wide ${
            step.current ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          {step.label}
        </span>
        {step.detail && (
          <span className="hidden text-[10px] text-muted-foreground sm:block">
            {step.detail}
          </span>
        )}
      </button>
    </>
  );
}

export default function CampaignProgressStrip({
  slideCount,
  imagesReadyCount,
  imagesComplete,
  isGeneratingImages,
  captionsCount,
}: CampaignProgressStripProps) {
  const steps = getCampaignProgressSteps({
    slideCount,
    imagesReadyCount,
    imagesComplete,
    isGeneratingImages,
    captionsCount,
  });

  return (
    <div className="mt-8 rounded-2xl border border-border bg-card/30 p-4 sm:p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Campaign progress
      </p>
      <div className="mt-4 flex items-center justify-between gap-2 overflow-x-auto pb-1">
        {steps.map((step, index) => (
          <StepIndicator key={step.id} step={step} index={index} />
        ))}
      </div>
    </div>
  );
}
