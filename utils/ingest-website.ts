import type { WebsiteIngestResult } from "@/types/website-ingest";
import { fetchPublicWebsiteHtml } from "@/utils/fetch-public-url";
import { GoogleGenAI } from "@google/genai";

const GEMINI_MODEL = "gemini-2.5-flash";
const MAX_PROMPT_CHARS = 24_000;

const INGEST_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    businessName: { type: "string" },
    description: { type: "string" },
    audience: { type: "string" },
    topics: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: ["businessName", "description", "audience", "topics"],
} as const;

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  return new GoogleGenAI({ apiKey });
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&nbsp;/gi, " ");
}

function extractMetaContent(html: string, property: string): string | null {
  const patterns = [
    new RegExp(
      `<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${property}["']`,
      "i",
    ),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return decodeHtmlEntities(match[1].trim());
    }
  }

  return null;
}

function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match?.[1] ? decodeHtmlEntities(match[1].trim()) : null;
}

function htmlToReadableText(html: string): string {
  const withoutScripts = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");

  const text = withoutScripts
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return text.slice(0, MAX_PROMPT_CHARS);
}

function resolveAbsoluteUrl(
  value: string | null,
  baseUrl: string,
): string | null {
  if (!value) {
    return null;
  }

  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return null;
  }
}

function normalizeTopics(topics: unknown): string[] {
  if (!Array.isArray(topics)) {
    return [];
  }

  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const topic of topics) {
    if (typeof topic !== "string") {
      continue;
    }

    const trimmed = topic.trim().replace(/\s+/g, " ");

    if (trimmed.length < 8 || trimmed.length > 140) {
      continue;
    }

    const key = trimmed.toLowerCase();

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    normalized.push(trimmed);

    if (normalized.length >= 3) {
      break;
    }
  }

  return normalized;
}

export async function ingestWebsiteForCampaign(
  rawUrl: string,
): Promise<WebsiteIngestResult> {
  const { html, finalUrl } = await fetchPublicWebsiteHtml(rawUrl);
  const pageText = htmlToReadableText(html);

  if (pageText.length < 120) {
    throw new Error(
      "This page did not include enough readable text. Try your homepage or enter a topic manually.",
    );
  }

  const title = extractTitle(html);
  const metaDescription =
    extractMetaContent(html, "description") ??
    extractMetaContent(html, "og:description");
  const ogTitle = extractMetaContent(html, "og:title");
  const productImageUrl = resolveAbsoluteUrl(
    extractMetaContent(html, "og:image"),
    finalUrl,
  );

  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: [
      {
        text: [
          "You are a performance marketing strategist for Instagram and TikTok carousel campaigns.",
          "Analyse the website content and return JSON only.",
          "Write exactly 3 distinct campaign topic suggestions as pain-point or curiosity hooks (5–12 words each).",
          "Topics must be specific to this business, not generic social media advice.",
          `Website URL: ${finalUrl}`,
          title ? `Page title: ${title}` : "",
          ogTitle ? `Open Graph title: ${ogTitle}` : "",
          metaDescription ? `Meta description: ${metaDescription}` : "",
          "",
          "Website text excerpt:",
          pageText,
        ]
          .filter(Boolean)
          .join("\n"),
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: INGEST_RESPONSE_SCHEMA,
    },
  });

  const rawText = response.text;

  if (!rawText) {
    throw new Error("No response from AI");
  }

  const parsed = JSON.parse(rawText) as {
    businessName?: unknown;
    description?: unknown;
    audience?: unknown;
    topics?: unknown;
  };

  const topics = normalizeTopics(parsed.topics);

  if (topics.length === 0) {
    throw new Error("Could not generate campaign topic suggestions");
  }

  const businessName =
    typeof parsed.businessName === "string" && parsed.businessName.trim()
      ? parsed.businessName.trim()
      : ogTitle ?? title ?? "Your business";

  const description =
    typeof parsed.description === "string" && parsed.description.trim()
      ? parsed.description.trim()
      : metaDescription ?? pageText.slice(0, 220);

  const audience =
    typeof parsed.audience === "string" && parsed.audience.trim()
      ? parsed.audience.trim()
      : "People interested in this business";

  return {
    businessName,
    description,
    audience,
    topics,
    productImageUrl,
    sourceUrl: finalUrl,
  };
}
