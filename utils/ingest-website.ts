import type {
  WebsiteIngestResult,
  WebsiteIngestTopicSuggestion,
  WebsiteTopicAngle,
  WebsiteTopicFormat,
} from "@/types/website-ingest";
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
      items: {
        type: "object",
        properties: {
          topic: { type: "string" },
          angle: {
            type: "string",
            enum: ["pain_point", "curiosity", "contrarian"],
          },
          rationale: { type: "string" },
          recommendedFormat: {
            type: "string",
            enum: ["4:5", "9:16"],
          },
        },
        required: ["topic", "angle", "rationale", "recommendedFormat"],
      },
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

function extractSiteIconUrl(html: string, baseUrl: string): string | null {
  const linkTags = html.match(/<link\s+[^>]*>/gi) ?? [];
  const candidates: { href: string; priority: number }[] = [];

  for (const tag of linkTags) {
    const rel = tag.match(/rel=["']([^"']+)["']/i)?.[1]?.toLowerCase() ?? "";
    const href = tag.match(/href=["']([^"']+)["']/i)?.[1];

    if (!href) {
      continue;
    }

    if (rel.includes("apple-touch-icon")) {
      candidates.push({ href, priority: 1 });
      continue;
    }

    if (rel.includes("icon")) {
      candidates.push({
        href,
        priority: rel.includes("shortcut") ? 3 : 2,
      });
    }
  }

  candidates.sort((left, right) => left.priority - right.priority);

  if (candidates[0]) {
    return resolveAbsoluteUrl(candidates[0].href, baseUrl);
  }

  return resolveAbsoluteUrl("/favicon.ico", baseUrl);
}

function normalizeAngle(value: unknown): WebsiteTopicAngle {
  if (value === "curiosity" || value === "contrarian") {
    return value;
  }

  return "pain_point";
}

function normalizeFormat(value: unknown): WebsiteTopicFormat {
  return value === "9:16" ? "9:16" : "4:5";
}

function normalizeTopicSuggestions(
  topics: unknown,
): WebsiteIngestTopicSuggestion[] {
  if (!Array.isArray(topics)) {
    return [];
  }

  const seen = new Set<string>();
  const normalized: WebsiteIngestTopicSuggestion[] = [];

  for (const entry of topics) {
    if (typeof entry === "string") {
      const trimmed = entry.trim().replace(/\s+/g, " ");

      if (trimmed.length < 8 || trimmed.length > 140) {
        continue;
      }

      const key = trimmed.toLowerCase();

      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      normalized.push({
        topic: trimmed,
        angle: "pain_point",
        rationale: "Grounded in your website messaging.",
        recommendedFormat: "4:5",
      });
    } else if (typeof entry === "object" && entry !== null) {
      const record = entry as Record<string, unknown>;
      const topic =
        typeof record.topic === "string"
          ? record.topic.trim().replace(/\s+/g, " ")
          : "";

      if (topic.length < 8 || topic.length > 140) {
        continue;
      }

      const key = topic.toLowerCase();

      if (seen.has(key)) {
        continue;
      }

      const rationale =
        typeof record.rationale === "string" && record.rationale.trim()
          ? record.rationale.trim().slice(0, 180)
          : "Grounded in your website messaging.";

      seen.add(key);
      normalized.push({
        topic,
        angle: normalizeAngle(record.angle),
        rationale,
        recommendedFormat: normalizeFormat(record.recommendedFormat),
      });
    } else {
      continue;
    }

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
  const logoImageUrl = extractSiteIconUrl(html, finalUrl);

  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: [
      {
        text: [
          "You are a performance marketing strategist for Instagram and TikTok carousel campaigns.",
          "Analyse the website content and return JSON only.",
          "Write exactly 3 distinct campaign topic suggestions.",
          "Each topic must be a pain-point, curiosity, or contrarian hook (5–12 words).",
          "Each topic needs angle (pain_point, curiosity, or contrarian), a one-sentence rationale explaining why it fits this business, and recommendedFormat (4:5 for feed carousels or 9:16 for Reels/TikTok).",
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

  const topics = normalizeTopicSuggestions(parsed.topics);

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
    logoImageUrl,
    sourceUrl: finalUrl,
  };
}
