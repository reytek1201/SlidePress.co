import type { Slide } from "@/types/campaign";
import {
  framesForAudioDuration,
  uploadFalMedia,
  type FalVideoImageFrame,
} from "@/utils/fal-video";
import { concatMp3Buffers, getMp3DurationSeconds } from "@/utils/merge-mp3-buffers";
import { synthesizeCampaignNarration } from "@/utils/tts/synthesize-campaign-narration";
import type { VoicePersona } from "@/utils/tts/voice-catalog";
import type { TtsUsageContext } from "@/utils/tts/types";

export interface PrepareCampaignVideoInput {
  slides: Slide[];
  persona: VoicePersona;
  usage: TtsUsageContext;
}

export interface PrepareCampaignVideoResult {
  imageFrames: FalVideoImageFrame[];
  audioUrl: string;
  slideCount: number;
  totalChars: number;
}

export function assertVideoExportPreconditions(slides: Slide[]): void {
  const sortedSlides = [...slides].sort(
    (left, right) => left.slide_index - right.slide_index,
  );

  if (sortedSlides.length === 0) {
    throw new Error("No slides found for campaign");
  }

  const missingImages = sortedSlides.filter((slide) => !slide.image_url);
  if (missingImages.length > 0) {
    throw new Error("Generate all slide images before exporting video");
  }

  const missingScripts = sortedSlides.filter(
    (slide) => !slide.voiceover_script?.trim(),
  );
  if (missingScripts.length > 0) {
    throw new Error("Every slide needs a voiceover script before exporting video");
  }
}

export async function prepareCampaignVideo(
  input: PrepareCampaignVideoInput,
): Promise<PrepareCampaignVideoResult> {
  const sortedSlides = [...input.slides].sort(
    (left, right) => left.slide_index - right.slide_index,
  );

  assertVideoExportPreconditions(sortedSlides);

  const narrationSlides = await synthesizeCampaignNarration({
    slides: sortedSlides,
    persona: input.persona,
    usage: input.usage,
  });

  const narrationByIndex = new Map(
    narrationSlides.map((slide) => [slide.slideIndex, slide]),
  );

  const imageFrames: FalVideoImageFrame[] = [];
  const audioBuffers: Buffer[] = [];

  for (const slide of sortedSlides) {
    const narration = narrationByIndex.get(slide.slide_index);

    if (!narration) {
      throw new Error(`Missing narration for slide ${slide.slide_index + 1}`);
    }

    const durationSeconds = await getMp3DurationSeconds(narration.audio);
    imageFrames.push({
      url: slide.image_url!,
      frames: framesForAudioDuration(durationSeconds),
    });
    audioBuffers.push(narration.audio);
  }

  const mergedAudio = await concatMp3Buffers(audioBuffers);
  const audioUrl = await uploadFalMedia(
    mergedAudio,
    "audio/mpeg",
    "campaign-narration.mp3",
  );

  const totalChars = narrationSlides.reduce(
    (sum, slide) => sum + slide.charCount,
    0,
  );

  return {
    imageFrames,
    audioUrl,
    slideCount: sortedSlides.length,
    totalChars,
  };
}

export function getVideoExportFilename(
  campaignTitle: string | null,
  campaignId: string,
): string {
  const base =
    campaignTitle
      ?.trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || `campaign-${campaignId.slice(0, 8)}`;

  return `${base}-video.mp4`;
}
