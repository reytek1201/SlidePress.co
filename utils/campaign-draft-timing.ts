export function formatDraftDurationHint(slideCount: number): string {
  if (slideCount <= 3) {
    return "This usually takes 1.5–3 minutes.";
  }

  if (slideCount <= 5) {
    return "This usually takes 2–4 minutes.";
  }

  return "This usually takes 2.5–5 minutes.";
}

export function formatDraftDurationShort(slideCount: number): string {
  if (slideCount <= 3) {
    return "~2 min total";
  }

  if (slideCount <= 5) {
    return "~3 min total";
  }

  return "~4 min total";
}

export function formatDraftCopyStepHint(slideCount: number): string {
  return `Step 1 of 2: writing slide copy (15–30 seconds). Images and captions follow — ${formatDraftDurationShort(slideCount).replace(" total", "")} for the full draft.`;
}
