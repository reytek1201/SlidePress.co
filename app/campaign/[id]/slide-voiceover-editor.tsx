"use client";

import VoiceoverRewriteSheet from "@/app/campaign/[id]/voiceover-rewrite-sheet";
import type { VoiceoverRewriteChipId } from "@/types/voiceover-rewrite";
import {
  countWords,
  validateVoiceoverScript,
  VOICEOVER_MAX_WORDS,
} from "@/utils/voiceover-script-validation";
import { useEffect, useState } from "react";

interface SlideVoiceoverEditorProps {
  slideId: string;
  value: string;
  headline: string;
  disabled?: boolean;
  suggestMatchHeadline?: boolean;
  onSaved: (voiceoverScript: string) => void;
  onDismissMatchSuggestion?: () => void;
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

export default function SlideVoiceoverEditor({
  slideId,
  value,
  headline,
  disabled = false,
  suggestMatchHeadline = false,
  onSaved,
  onDismissMatchSuggestion,
  onError,
}: SlideVoiceoverEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [rewriteOpen, setRewriteOpen] = useState(false);
  const [rewriteInitialTone, setRewriteInitialTone] = useState<
    VoiceoverRewriteChipId | undefined
  >();

  useEffect(() => {
    if (!isEditing) {
      setDraft(value);
    }
  }, [value, isEditing]);

  const wordCount = countWords(draft);
  const validationError = validateVoiceoverScript(draft);
  const isValid = validationError === null;
  const hasChanges = draft.trim() !== value.trim();

  function openRewriteSheet(tone?: VoiceoverRewriteChipId) {
    setRewriteInitialTone(tone);
    setRewriteOpen(true);
    onDismissMatchSuggestion?.();
  }

  function closeRewriteSheet() {
    setRewriteOpen(false);
    setRewriteInitialTone(undefined);
  }

  async function handleSave() {
    const nextDraft = draft.trim();
    const error = validateVoiceoverScript(nextDraft);

    if (error) {
      onError(error);
      return;
    }

    setIsSaving(true);

    try {
      const saved = await saveVoiceoverScript(slideId, nextDraft);
      onSaved(saved);
      setDraft(saved);
      setIsEditing(false);
      onDismissMatchSuggestion?.();
    } catch (saveError) {
      onError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to save voiceover",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCopy() {
    if (!value.trim()) return;

    try {
      await navigator.clipboard.writeText(value);
      setIsCopied(true);
      window.setTimeout(() => setIsCopied(false), 2000);
    } catch {
      onError("Could not copy to clipboard");
    }
  }

  const controlsDisabled = disabled || isSaving;

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Voiceover script
        </p>
        <div className="flex items-center gap-3">
          {value.trim() ? (
            <button
              type="button"
              disabled={controlsDisabled}
              onClick={() => void handleCopy()}
              className="text-xs font-medium text-muted-foreground transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCopied ? "Copied" : "Copy"}
            </button>
          ) : null}
          {value.trim() ? (
            <button
              type="button"
              disabled={controlsDisabled}
              onClick={() => openRewriteSheet()}
              className="text-xs font-medium text-primary transition hover:underline disabled:cursor-not-allowed disabled:opacity-60"
            >
              Rewrite with AI…
            </button>
          ) : null}
          {!isEditing ? (
            <button
              type="button"
              disabled={controlsDisabled || !value.trim()}
              onClick={() => setIsEditing(true)}
              className="text-xs font-medium text-muted-foreground transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
            >
              Edit script
            </button>
          ) : (
            <button
              type="button"
              disabled={controlsDisabled}
              onClick={() => {
                setDraft(value);
                setIsEditing(false);
              }}
              className="text-xs font-medium text-muted-foreground transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {suggestMatchHeadline && headline.trim() && value.trim() ? (
        <div className="mt-3 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2.5">
          <p className="text-xs leading-5 text-secondary-foreground">
            Headline changed — update the voiceover to match?
          </p>
          <button
            type="button"
            disabled={controlsDisabled}
            onClick={() => openRewriteSheet("match_headline")}
            className="mt-2 text-xs font-semibold text-primary underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
          >
            Match headline
          </button>
        </div>
      ) : null}

      {isEditing ? (
        <div className="mt-2">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            disabled={controlsDisabled}
            rows={3}
            className="w-full resize-y rounded-xl border border-border bg-background px-3 py-2.5 text-sm leading-6 text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60"
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <p
              className={`text-xs ${
                wordCount > VOICEOVER_MAX_WORDS
                  ? "text-red-300"
                  : "text-muted-foreground"
              }`}
            >
              {wordCount}/{VOICEOVER_MAX_WORDS} words
            </p>
            <button
              type="button"
              disabled={controlsDisabled || !isValid || !hasChanges}
              onClick={() => void handleSave()}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-secondary-foreground transition hover:border-ring/60 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Saving…" : "Save script"}
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-1.5 text-sm leading-6 text-secondary-foreground md:mt-2 md:leading-7">
          {value || "—"}
        </p>
      )}

      <VoiceoverRewriteSheet
        open={rewriteOpen}
        onClose={closeRewriteSheet}
        slideId={slideId}
        headline={headline}
        currentScript={value}
        initialTone={rewriteInitialTone}
        onSaved={onSaved}
        onError={onError}
      />
    </div>
  );
}
