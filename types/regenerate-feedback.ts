export const REGENERATE_FEEDBACK_CHIPS = [
  {
    id: "fix_headline_text",
    label: "Fix headline text",
    description: "Correct spelling or wording on the image",
    prompt:
      "Re-render every word of the headline from the specification below with correct spelling. Do not copy any text from the reference image — replace all on-image typography.",
  },
  {
    id: "brighter",
    label: "Brighter",
    description: "More light and airy colors",
    prompt:
      "Use a brighter, more airy palette with stronger overall luminosity.",
  },
  {
    id: "minimal",
    label: "Minimal",
    description: "Cleaner layout, less clutter",
    prompt:
      "Use a cleaner, more minimal layout with substantially more negative space and less clutter. Remove visual noise.",
  },
  {
    id: "bold_colors",
    label: "Bold colors",
    description: "Stronger, more saturated palette",
    prompt:
      "Use bolder, more saturated colors and stronger visual contrast.",
  },
  {
    id: "product_larger",
    label: "Product larger",
    description: "Make the product more prominent",
    prompt:
      "Make the hero product or subject significantly larger and more prominent in the frame.",
  },
  {
    id: "different_layout",
    label: "Different layout",
    description: "Try a new composition",
    prompt:
      "Use a substantially different composition: change where the product and headline sit, rearrange visual hierarchy, and do not preserve element positions from the reference image.",
  },
  {
    id: "try_again",
    label: "Try again",
    description: "Fresh variation, same message",
    prompt:
      "Create a clearly different visual variation with new composition, color treatment, and layout while preserving the headline message.",
  },
] as const;

export type RegenerateFeedbackChipId =
  (typeof REGENERATE_FEEDBACK_CHIPS)[number]["id"];

export const REGENERATE_FEEDBACK_CHIP_IDS = REGENERATE_FEEDBACK_CHIPS.map(
  (chip) => chip.id,
) as [RegenerateFeedbackChipId, ...RegenerateFeedbackChipId[]];

const chipPromptById = Object.fromEntries(
  REGENERATE_FEEDBACK_CHIPS.map((chip) => [chip.id, chip.prompt]),
) as Record<RegenerateFeedbackChipId, string>;

/** Chips that should not anchor to the previous slide's layout or scene. */
export const LAYOUT_RESET_CHIP_IDS: RegenerateFeedbackChipId[] = [
  "different_layout",
  "try_again",
  "minimal",
];

export const HEADLINE_TEXT_FIX_CHIP_IDS: RegenerateFeedbackChipId[] = [
  "fix_headline_text",
];

export function regenerationResetsScene(
  chipIds: RegenerateFeedbackChipId[],
  options?: { headlineChanged?: boolean },
): boolean {
  if (options?.headlineChanged) {
    return true;
  }

  return chipIds.some(
    (id) =>
      LAYOUT_RESET_CHIP_IDS.includes(id) ||
      HEADLINE_TEXT_FIX_CHIP_IDS.includes(id),
  );
}

export function regenerationRequiresHeadlineRerender(
  chipIds: RegenerateFeedbackChipId[],
  options?: { headlineChanged?: boolean },
): boolean {
  if (options?.headlineChanged) {
    return true;
  }

  return chipIds.some((id) => HEADLINE_TEXT_FIX_CHIP_IDS.includes(id));
}

export function resolveRegenerationFeedback(
  chipIds: RegenerateFeedbackChipId[],
  customNotes?: string,
): string {
  const prompts = chipIds.map((id) => chipPromptById[id]).filter(Boolean);

  const trimmedNotes = customNotes?.trim();

  if (trimmedNotes) {
    prompts.push(trimmedNotes);
  }

  return prompts.join(" ");
}
