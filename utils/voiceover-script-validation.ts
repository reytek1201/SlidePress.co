export const VOICEOVER_MAX_WORDS = 25;

export function countWords(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

export function validateVoiceoverScript(value: string): string | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return "Voiceover script cannot be empty";
  }

  const words = countWords(trimmed);

  if (words > VOICEOVER_MAX_WORDS) {
    return `Voiceover script must be at most ${VOICEOVER_MAX_WORDS} words`;
  }

  return null;
}

export const VOICEOVER_TTS_RULES = [
  "Write how people talk: contractions, simple words, natural rhythm.",
  `Keep each script under ${VOICEOVER_MAX_WORDS} words — one or two sentences max.`,
  "No emoji, markdown, slashes, hashtags, or ALL CAPS.",
  'Use speakable numbers ("3 steps", "50 percent" — not "50%").',
  'No URLs; say "link in bio" if a CTA needs a link.',
  'Avoid abbreviations (use "for example" not "e.g.", "versus" not "vs.").',
] as const;
