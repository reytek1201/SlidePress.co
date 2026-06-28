export const SLIDE_COUNT_PRESETS = [3, 5, 7] as const;

export type SlideCount = (typeof SLIDE_COUNT_PRESETS)[number];

export const DEFAULT_SLIDE_COUNT: SlideCount = 5;

export const MIN_SLIDE_COUNT = 3;

export const MAX_SLIDE_COUNT = 7;

export const CONTENT_STYLES = [
  "pain_point",
  "announcement",
  "educational",
  "entertainment",
  "aspirational",
] as const;

export type ContentStyle = (typeof CONTENT_STYLES)[number];

export const NARRATIVE_STRUCTURES: Record<
  SlideCount,
  Record<ContentStyle, string>
> = {
  3: {
    pain_point:
      "hook (problem) → core value (solution) → CTA",
    announcement:
      "hook (what's new) → core value (why it matters) → CTA",
    educational:
      "hook (question/fact) → core value (the answer/insight) → CTA",
    entertainment:
      "hook (surprise/novelty) → core value (the payoff) → CTA",
    aspirational:
      "hook (identity/vision) → core value (how to get there) → CTA",
  },
  5: {
    pain_point:
      "problem → insight → solution → proof → CTA",
    announcement:
      "context → what's new → why it matters → proof/detail → CTA",
    educational:
      "hook/question → key insight 1 → key insight 2 → tie-together → CTA",
    entertainment:
      "hook → build → twist/payoff → reaction/detail → CTA",
    aspirational:
      "vision → why it matters → how to get there → proof → CTA",
  },
  7: {
    pain_point:
      "hook → problem → insight → solution → proof → social proof → CTA",
    announcement:
      "hook → context → what's new → why it matters → detail → proof → CTA",
    educational:
      "hook → question → insight 1 → insight 2 → insight 3 → tie-together → CTA",
    entertainment:
      "hook → setup → build → twist → payoff → reaction → CTA",
    aspirational:
      "hook → vision → why it matters → path → proof → social proof → CTA",
  },
};

export function isSlideCount(value: number): value is SlideCount {
  return (SLIDE_COUNT_PRESETS as readonly number[]).includes(value);
}

export function isContentStyle(value: string): value is ContentStyle {
  return (CONTENT_STYLES as readonly string[]).includes(value);
}

/**
 * Returns slide counts the user is allowed to create.
 * Hook for future subscription tiers — filter presets by plan max.
 */
export function getAllowedSlideCounts(_userId?: string): readonly SlideCount[] {
  void _userId;
  return SLIDE_COUNT_PRESETS;
}

export function getMaxSlideCountForUser(_userId?: string): number {
  void _userId;
  return MAX_SLIDE_COUNT;
}

function resolveSlideCountKey(slideCount: number): SlideCount {
  if (slideCount <= 3) {
    return 3;
  }

  if (slideCount <= 5) {
    return 5;
  }

  return 7;
}

export function slideNarrativeGuidance(
  slideCount: number,
  contentStyle: ContentStyle = "pain_point",
): string {
  const key = resolveSlideCountKey(slideCount);
  const structure = NARRATIVE_STRUCTURES[key][contentStyle];
  return `Structure slides as: ${structure}`;
}

export function slideNarrativeStructuresPromptBlock(slideCount: SlideCount): string {
  const structures = NARRATIVE_STRUCTURES[slideCount];

  return CONTENT_STYLES.map(
    (style) => `- ${style}: ${structures[style]}`,
  ).join("\n");
}
