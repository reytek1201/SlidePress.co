export const VOICEOVER_REWRITE_CHIPS = [
  {
    id: "match_headline",
    label: "Match headline",
    description: "Align speech with your on-slide text",
    prompt:
      "Rewrite so the spoken script clearly delivers the same core message as the on-slide headline, expanded naturally for speech. Do not copy the headline word-for-word.",
  },
  {
    id: "shorter",
    label: "Shorter",
    description: "One tight spoken sentence",
    prompt:
      "Make the script tighter and shorter while keeping the main point. Aim for one crisp spoken sentence.",
  },
  {
    id: "more_casual",
    label: "More casual",
    description: "Friendly, everyday language",
    prompt:
      "Use a friendlier, conversational tone with contractions and simple everyday words.",
  },
  {
    id: "more_punchy",
    label: "More punchy",
    description: "Bold hook, higher energy",
    prompt:
      "Use a bolder, higher-energy hook that grabs attention in the first few words.",
  },
  {
    id: "more_professional",
    label: "More professional",
    description: "Calm, expert tone",
    prompt:
      "Use a calmer, authoritative tone suited to coaching, B2B, or expert content.",
  },
] as const;

export type VoiceoverRewriteChipId =
  (typeof VOICEOVER_REWRITE_CHIPS)[number]["id"];

export const VOICEOVER_REWRITE_CHIP_IDS = VOICEOVER_REWRITE_CHIPS.map(
  (chip) => chip.id,
) as [VoiceoverRewriteChipId, ...VoiceoverRewriteChipId[]];

const chipPromptById = Object.fromEntries(
  VOICEOVER_REWRITE_CHIPS.map((chip) => [chip.id, chip.prompt]),
) as Record<VoiceoverRewriteChipId, string>;

export function voiceoverRewritePromptForChip(
  chipId: VoiceoverRewriteChipId,
): string {
  return chipPromptById[chipId];
}
