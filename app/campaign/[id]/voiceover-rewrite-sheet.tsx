"use client";

import {
  VOICEOVER_REWRITE_CHIPS,
  type VoiceoverRewriteChipId,
} from "@/types/voiceover-rewrite";
import { useCallback, useEffect, useState } from "react";

type RewriteStep = "tone" | "options";

interface VoiceoverRewriteSheetProps {
  open: boolean;
  onClose: () => void;
  slideId: string;
  headline: string;
  currentScript: string;
  initialTone?: VoiceoverRewriteChipId;
  onSaved: (voiceoverScript: string) => void;
  onError: (message: string) => void;
}

async function saveVoiceoverScript(
  slideId: string,
  voiceoverScript: string,
): Promise<string> {
  const response = await fetch(`/api/slides/${slideId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ voiceover_script: voiceoverScript }),
  });

  const data = (await response.json()) as {
    success: boolean;
    error?: string;
    slide?: { voiceover_script: string | null };
  };

  if (!response.ok || !data.success) {
    throw new Error(data.error ?? "Failed to save voiceover");
  }

  return data.slide?.voiceover_script?.trim() ?? voiceoverScript;
}

async function fetchRewriteOptions(
  slideId: string,
  tone: VoiceoverRewriteChipId,
): Promise<string[]> {
  const response = await fetch("/api/rewrite-voiceover", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slideId, tone }),
  });

  const data = (await response.json()) as {
    success: boolean;
    error?: string;
    options?: string[];
  };

  if (!response.ok || !data.success || !data.options?.length) {
    throw new Error(data.error ?? "Failed to rewrite voiceover");
  }

  return data.options;
}

export default function VoiceoverRewriteSheet({
  open,
  onClose,
  slideId,
  headline,
  currentScript,
  initialTone,
  onSaved,
  onError,
}: VoiceoverRewriteSheetProps) {
  const [step, setStep] = useState<RewriteStep>("tone");
  const [activeTone, setActiveTone] = useState<VoiceoverRewriteChipId | null>(
    null,
  );
  const [options, setOptions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const reset = useCallback(() => {
    setStep("tone");
    setActiveTone(null);
    setOptions([]);
    setIsLoading(false);
    setIsSaving(false);
  }, []);

  const runRewrite = useCallback(
    async (tone: VoiceoverRewriteChipId) => {
      setActiveTone(tone);
      setOptions([]);
      setIsLoading(true);
      setStep("options");

      try {
        const nextOptions = await fetchRewriteOptions(slideId, tone);
        setOptions(nextOptions);
      } catch (error) {
        onError(
          error instanceof Error ? error.message : "Failed to rewrite voiceover",
        );
        setStep("tone");
        setActiveTone(null);
      } finally {
        setIsLoading(false);
      }
    },
    [slideId, onError],
  );

  useEffect(() => {
    if (!open) {
      reset();
      return;
    }

    if (initialTone) {
      void runRewrite(initialTone);
      return;
    }

    setStep("tone");
    setActiveTone(null);
    setOptions([]);
    setIsLoading(false);
  }, [open, initialTone, reset, runRewrite]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSaving && !isLoading) {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose, isSaving, isLoading]);

  async function handleUseOption(option: string) {
    setIsSaving(true);

    try {
      const saved = await saveVoiceoverScript(slideId, option);
      onSaved(saved);
      onClose();
    } catch (error) {
      onError(
        error instanceof Error ? error.message : "Failed to save voiceover",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (!open) {
    return null;
  }

  const activeChip = VOICEOVER_REWRITE_CHIPS.find(
    (chip) => chip.id === activeTone,
  );

  return (
    <div
      className="fixed inset-0 z-[70] md:flex md:items-center md:justify-center md:p-8"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close rewrite"
        onClick={onClose}
        disabled={isSaving || isLoading}
        className="absolute inset-0 bg-black/60 md:bg-black/70"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="voiceover-rewrite-title"
        className="absolute inset-x-0 bottom-0 flex max-h-[min(90dvh,640px)] flex-col rounded-t-2xl border-t border-border bg-card shadow-2xl md:relative md:max-h-[min(85vh,560px)] md:w-full md:max-w-md md:rounded-2xl md:border"
      >
        <div className="shrink-0 px-5 pb-3 pt-4 md:px-6 md:pt-5">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border md:hidden" />
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2
                id="voiceover-rewrite-title"
                className="text-base font-semibold text-foreground"
              >
                Rewrite voiceover
              </h2>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                New spoken lines only — your slide image stays the same.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving || isLoading}
              className="rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground transition hover:bg-secondary/60 hover:text-foreground disabled:opacity-60"
            >
              Close
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] md:px-6 md:pb-6">
          {step === "tone" ? (
            <ul className="space-y-2">
              {VOICEOVER_REWRITE_CHIPS.map((chip) => {
                const chipDisabled =
                  isLoading || (chip.id === "match_headline" && !headline.trim());

                return (
                  <li key={chip.id}>
                    <button
                      type="button"
                      disabled={chipDisabled}
                      onClick={() => void runRewrite(chip.id)}
                      className="w-full rounded-xl border border-border bg-background/60 px-4 py-3 text-left transition hover:border-ring/60 hover:bg-card/60 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span className="block text-sm font-semibold text-foreground">
                        {chip.label}
                      </span>
                      <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                        {chip.description}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div>
              <button
                type="button"
                disabled={isLoading || isSaving}
                onClick={() => {
                  setStep("tone");
                  setActiveTone(null);
                  setOptions([]);
                }}
                className="text-xs font-medium text-muted-foreground transition hover:text-foreground disabled:opacity-60"
              >
                ← Choose a different tone
              </button>

              <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {activeChip?.label ?? "Options"}
              </p>

              {isLoading ? (
                <div className="mt-6 flex flex-col items-center gap-3 py-8 text-center">
                  <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <p className="text-sm text-muted-foreground">
                    Writing new scripts…
                  </p>
                </div>
              ) : (
                <ul className="mt-3 space-y-2">
                  {options.map((option) => (
                    <li
                      key={option}
                      className="rounded-xl border border-border bg-card/40 p-4"
                    >
                      <p className="text-sm leading-6 text-secondary-foreground">
                        {option}
                      </p>
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => void handleUseOption(option)}
                        className="btn-primary mt-3 w-full py-2 text-xs"
                      >
                        {isSaving ? "Saving…" : "Use this script"}
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {!isLoading && options.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  No options yet. Go back and pick a tone.
                </p>
              ) : null}
            </div>
          )}
        </div>

        {step === "tone" ? (
          <div className="shrink-0 border-t border-border px-5 py-3 md:px-6">
            <p className="text-center text-[11px] leading-5 text-muted-foreground">
              Current script:{" "}
              <span className="text-secondary-foreground">
                {currentScript.trim() || "—"}
              </span>
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
