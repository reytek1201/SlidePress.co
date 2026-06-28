import { GoogleGenAI } from "@google/genai";
import {
  aspectRatioContext,
  parseCampaignGeneration,
  type CampaignGeneration,
} from "@/utils/campaign-generation";
import type { CampaignReferences } from "@/types/references";
import {
  slideNarrativeStructuresPromptBlock,
  type SlideCount,
} from "@/types/slides";
import {
  isRetryableGeminiError,
  mapGeminiError,
} from "@/utils/map-gemini-error";
import { safeFetch } from "@/utils/safe-fetch";

const DEFAULT_MODEL = "gemini-2.5-flash";
const GEMINI_MAX_ATTEMPTS = 3;
const GEMINI_RETRY_DELAY_MS = 600;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  return new GoogleGenAI({ apiKey });
}

async function fetchImageInlinePart(url: string) {
  const response = await safeFetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch reference image: ${url}`);
  }

  const mimeType = response.headers.get("content-type") ?? "image/png";
  const buffer = Buffer.from(await response.arrayBuffer());

  return {
    inlineData: {
      mimeType,
      data: buffer.toString("base64"),
    },
  };
}

function buildReferencePrompt(references: CampaignReferences): string[] {
  const lines: string[] = [];

  if (references.product) {
    lines.push(
      "Product reference (first image): feature this product prominently in slide concepts and image prompts."
    );
  }

  if (references.style) {
    lines.push(
      "Style reference: match palette, composition energy, and mood. Never copy text from the style reference."
    );
  }

  if (references.logo) {
    lines.push(
      "Logo reference: preserve brand identity in visual direction. Do not put logo words into text_overlay headlines."
    );
  }

  if (lines.length === 0) {
    lines.push(
      "No brand reference images were provided. Ground each image_prompt in the topic itself — relevant setting, action, objects, or subject matter — rather than generic person-with-emotion stock imagery."
    );
  }

  return lines;
}

function buildNarrativeGuidanceBlock(slideCount: SlideCount): string {
  return [
    "Content style classification (required):",
    "Before writing slides, classify this topic as exactly one content_style:",
    "pain_point (genuine frustration/struggle), announcement (launches/news/new offerings),",
    "educational (how-to/explainer/fact-based), entertainment (fun/lighthearted/novelty),",
    "or aspirational (identity/lifestyle, not pain-driven).",
    "Let that classification genuinely shape slide copy and image_prompts — not just the label.",
    "",
    `Narrative structure — pick the ONE row below that matches your content_style for this ${slideCount}-slide campaign:`,
    slideNarrativeStructuresPromptBlock(slideCount),
    "",
    "Narrative and image_prompt rules:",
    "- Only content_style pain_point may use a \"problem\" or struggle beat.",
    "- Each image_prompt must illustrate that slide's specific narrative beat.",
    "- Do not use distressed-person or head-in-hands imagery unless content_style is pain_point AND the beat is explicitly problem/struggle.",
    "- For all other beats and content_styles, avoid inherited pain-point visual bias — show setting, action, objects, or subject matter tied to the topic.",
  ].join("\n");
}

export async function generateCampaignContent(
  topic: string,
  aspectRatio: "4:5" | "9:16",
  slideCount: SlideCount,
  references: CampaignReferences = {}
): Promise<CampaignGeneration> {
  const ai = getClient();
  const model = process.env.GEMINI_MODEL ?? DEFAULT_MODEL;
  const maxIndex = slideCount - 1;

  const userParts: Array<
    Awaited<ReturnType<typeof fetchImageInlinePart>> | { text: string }
  > = [];

  if (references.product) {
    userParts.push(await fetchImageInlinePart(references.product));
  }

  if (references.style) {
    userParts.push(await fetchImageInlinePart(references.style));
  }

  if (references.logo) {
    userParts.push(await fetchImageInlinePart(references.logo));
  }

  userParts.push({
    text: [
      "You are a senior performance marketing copywriter and visual prompt engineer.",
      `Generate a ${slideCount}-slide social campaign optimized for Nano Banana 2 image generation on Fal.ai.`,
      `Each slide needs: slide_index (0-${maxIndex} exactly once each), text_overlay (max 12 words),`,
      "voiceover_script (one or two short spoken sentences for text-to-speech), image_prompt",
      "(visual scene/style direction WITHOUT repeating the overlay text — backgrounds, mood, composition, colors;",
      "the scene must contain no text, typography, or words), and text_region",
      "(object with position: one of upper_left, upper_center, upper_right; and background_tone: light, dark, or mixed).",
      "Image prompts must match the requested aspect ratio framing.",
      "",
      "text_region rules (headline overlay uses upper third only — keeps room for video captions below):",
      "- After writing each slide's image_prompt, choose text_region.position in the upper third only",
      "  (upper_left, upper_center, or upper_right) where that scene has calm space for headline text.",
      "- Prefer upper_center unless the scene's focal point clearly favors left or right alignment.",
      "- Set background_tone to light (prefer light/white overlay text), dark (prefer dark overlay text),",
      "  or mixed (busy upper area — overlay uses stronger shadow).",
      "- Base both fields on the same scene description you wrote for image_prompt.",
      "",
      "Voiceover rules (optimized for AI text-to-speech):",
      "- Write how people talk: contractions, simple words, natural rhythm.",
      "- Keep each voiceover_script under 25 words — one or two sentences max.",
      "- No emoji, markdown, slashes, hashtags, or ALL CAPS.",
      "- Use speakable numbers (\"3 steps\", \"50 percent\" — not \"50%\").",
      "- No URLs; say \"link in bio\" if a CTA needs a link.",
      "- Avoid abbreviations (use \"for example\" not \"e.g.\", \"versus\" not \"vs.\").",
      "- Do not copy text_overlay verbatim; expand the idea for spoken delivery.",
      "",
      buildNarrativeGuidanceBlock(slideCount),
      ...buildReferencePrompt(references),
      "",
      `Topic: ${topic}`,
      `Target format: ${aspectRatioContext(aspectRatio)}`,
      "",
      "Return valid JSON with keys: title, target_audience, content_style, slides.",
    ].join("\n"),
  });

  let lastError: unknown;

  for (let attempt = 0; attempt < GEMINI_MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: userParts,
        config: {
          responseMimeType: "application/json",
        },
      });

      const rawText = response.text;

      if (!rawText) {
        throw new Error("Gemini returned an empty response");
      }

      const parsedJson = JSON.parse(rawText) as unknown;
      return parseCampaignGeneration(parsedJson, slideCount);
    } catch (error) {
      lastError = error;

      if (
        attempt < GEMINI_MAX_ATTEMPTS - 1 &&
        isRetryableGeminiError(error)
      ) {
        await sleep(GEMINI_RETRY_DELAY_MS * (attempt + 1));
        continue;
      }

      throw new Error(mapGeminiError(error));
    }
  }

  throw new Error(mapGeminiError(lastError));
}
