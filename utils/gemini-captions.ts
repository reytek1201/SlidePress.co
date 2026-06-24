import { GoogleGenAI } from "@google/genai";
import {
  buildCaptionsPrompt,
  parseCaptionsGeneration,
  type CaptionsGeneration,
} from "@/utils/caption-generation";
import {
  GeminiServiceError,
  isRetryableGeminiError,
} from "@/utils/map-gemini-error";
import type { Campaign, Slide } from "@/types/campaign";

const DEFAULT_MODEL = "gemini-2.5-flash";
const GEMINI_MAX_ATTEMPTS = 3;
const GEMINI_RETRY_DELAY_MS = 600;

const CAPTIONS_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    platforms: {
      type: "array",
      items: {
        type: "object",
        properties: {
          platform: {
            type: "string",
            enum: ["tiktok", "instagram", "youtube_shorts"],
          },
          hook: { type: "string" },
          caption: { type: "string" },
          hashtags: {
            type: "array",
            items: { type: "string" },
          },
          title: { type: "string" },
        },
        required: ["platform", "caption", "hashtags"],
      },
    },
  },
  required: ["platforms"],
} as const;

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  return new GoogleGenAI({ apiKey });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function generatePlatformCaptions(
  campaign: Campaign,
  slides: Slide[],
): Promise<CaptionsGeneration> {
  const ai = getClient();
  const model = process.env.GEMINI_MODEL ?? DEFAULT_MODEL;
  const promptText = buildCaptionsPrompt(campaign, slides);

  let lastError: unknown;

  for (let attempt = 0; attempt < GEMINI_MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ text: promptText }],
        config: {
          responseMimeType: "application/json",
          responseSchema: CAPTIONS_RESPONSE_SCHEMA,
          maxOutputTokens: 4096,
        },
      });

      const rawText = response.text;

      if (!rawText) {
        throw new Error("Gemini returned an empty response");
      }

      const parsedJson = JSON.parse(rawText) as unknown;
      return parseCaptionsGeneration(parsedJson);
    } catch (error) {
      lastError = error;

      if (
        attempt < GEMINI_MAX_ATTEMPTS - 1 &&
        isRetryableGeminiError(error)
      ) {
        await sleep(GEMINI_RETRY_DELAY_MS * (attempt + 1));
        continue;
      }

      throw new GeminiServiceError(error);
    }
  }

  throw new GeminiServiceError(lastError);
}
