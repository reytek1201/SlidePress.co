import { GoogleGenAI } from "@google/genai";
import type { VoiceoverRewriteChipId } from "@/types/voiceover-rewrite";
import { voiceoverRewritePromptForChip } from "@/types/voiceover-rewrite";
import {
  countWords,
  VOICEOVER_MAX_WORDS,
  VOICEOVER_TTS_RULES,
} from "@/utils/voiceover-script-validation";
import { z } from "zod";

const DEFAULT_MODEL = "gemini-2.5-flash";

const RewriteResponseSchema = z.object({
  options: z.array(z.string().min(1)).min(1).max(3),
});

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  return new GoogleGenAI({ apiKey });
}

function isValidOption(script: string): boolean {
  const words = countWords(script);
  return words > 0 && words <= VOICEOVER_MAX_WORDS;
}

export interface RewriteVoiceoverInput {
  tone: VoiceoverRewriteChipId;
  headline: string;
  currentScript: string;
  campaignTopic?: string | null;
}

export async function rewriteVoiceoverScripts(
  input: RewriteVoiceoverInput,
): Promise<string[]> {
  const ai = getClient();
  const toneInstruction = voiceoverRewritePromptForChip(input.tone);

  const response = await ai.models.generateContent({
    model: DEFAULT_MODEL,
    contents: [
      {
        text: [
          "You are a performance marketing copywriter optimizing slide voiceover scripts for AI text-to-speech.",
          "",
          "Voiceover rules:",
          ...VOICEOVER_TTS_RULES.map((rule) => `- ${rule}`),
          "",
          `Rewrite task: ${toneInstruction}`,
          "",
          `On-slide headline: ${input.headline.trim() || "(none)"}`,
          `Current voiceover script: ${input.currentScript.trim()}`,
          input.campaignTopic
            ? `Campaign topic: ${input.campaignTopic.trim()}`
            : "",
          "",
          "Return exactly 3 distinct rewrite options as JSON:",
          '{ "options": ["...", "...", "..."] }',
          "Only return valid JSON. No markdown. No commentary.",
        ]
          .filter(Boolean)
          .join("\n"),
      },
    ],
    config: {
      responseMimeType: "application/json",
    },
  });

  const rawText = response.text;

  if (!rawText) {
    throw new Error("No response from AI");
  }

  const parsed = RewriteResponseSchema.safeParse(JSON.parse(rawText));

  if (!parsed.success) {
    throw new Error("Unexpected AI response format");
  }

  const options = parsed.data.options
    .map((option) => option.trim())
    .filter(isValidOption)
    .slice(0, 3);

  if (options.length === 0) {
    throw new Error("AI returned no valid voiceover options");
  }

  return options;
}
