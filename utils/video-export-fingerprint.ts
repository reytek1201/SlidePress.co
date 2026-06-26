import { createHash } from "node:crypto";
import type { Slide } from "@/types/campaign";
import { normalizeVoiceoverScript } from "@/utils/tts/normalize-script";
import { ELEVEN_FLASH_MODEL } from "@/utils/tts/types";
import type { VoicePersona } from "@/utils/tts/voice-catalog";
import type { VideoExportPreset } from "@/utils/video-export-presets";
import { presetIncludesNarration } from "@/utils/video-export-presets";

function hashValue(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export interface SlideExportFingerprint {
  slideId: string;
  slideIndex: number;
  imageFingerprint: string;
  scriptFingerprint: string;
}

export interface VideoExportFingerprints {
  narrationFingerprint: string;
  slides: SlideExportFingerprint[];
}

export function buildSlideExportFingerprint(slide: Slide): SlideExportFingerprint {
  const script = normalizeVoiceoverScript(slide.voiceover_script ?? "");

  return {
    slideId: slide.id,
    slideIndex: slide.slide_index,
    imageFingerprint: hashValue(slide.image_url ?? ""),
    scriptFingerprint: hashValue(script),
  };
}

export function buildVideoExportFingerprints(input: {
  slides: Slide[];
  persona: VoicePersona;
  preset: VideoExportPreset;
}): VideoExportFingerprints {
  const sortedSlides = [...input.slides].sort(
    (left, right) => left.slide_index - right.slide_index,
  );

  const slideFingerprints = sortedSlides.map(buildSlideExportFingerprint);

  const narrationParts = presetIncludesNarration(input.preset)
    ? [
        input.persona,
        ELEVEN_FLASH_MODEL,
        ...slideFingerprints.map((slide) => slide.scriptFingerprint),
      ]
    : ["silent", ...slideFingerprints.map((slide) => slide.scriptFingerprint)];

  return {
    narrationFingerprint: hashValue(narrationParts.join("|")),
    slides: slideFingerprints,
  };
}

/** True when narration is unchanged and at least one slide image changed. */
export function isImageOnlyVideoUpdate(
  previous: SlideExportFingerprint[] | undefined,
  current: SlideExportFingerprint[],
): boolean {
  if (!previous?.length || previous.length !== current.length) {
    return false;
  }

  let imageChanged = false;

  for (const curr of current) {
    const prev = previous.find((slide) => slide.slideId === curr.slideId);
    if (!prev) {
      return false;
    }
    if (prev.scriptFingerprint !== curr.scriptFingerprint) {
      return false;
    }
    if (prev.imageFingerprint !== curr.imageFingerprint) {
      imageChanged = true;
    }
  }

  return imageChanged;
}

export function narrationFingerprintsMatch(
  previous: string | undefined,
  current: string,
): boolean {
  return Boolean(previous) && previous === current;
}
