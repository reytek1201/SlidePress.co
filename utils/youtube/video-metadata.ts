import type { PlatformCaption } from "@/types/captions";
import { normalizeHashtag } from "@/types/captions";

export interface YouTubeVideoMetadata {
  title: string;
  description: string;
  categoryId: string;
}

const YOUTUBE_TITLE_MAX = 100;
const YOUTUBE_DESCRIPTION_MAX = 5000;

export function buildYouTubeVideoMetadata(
  caption: PlatformCaption,
): YouTubeVideoMetadata {
  const title = (caption.title ?? caption.hook ?? "Short").trim();
  const hashtags = caption.hashtags.map(normalizeHashtag).join(" ");
  const description = [caption.caption.trim(), hashtags]
    .filter(Boolean)
    .join("\n\n");

  return {
    title: title.slice(0, YOUTUBE_TITLE_MAX),
    description: description.slice(0, YOUTUBE_DESCRIPTION_MAX),
    categoryId: "22",
  };
}

export function getYouTubePublishPrivacyStatus(): "public" | "unlisted" | "private" {
  const value = process.env.YOUTUBE_PUBLISH_PRIVACY?.toLowerCase();

  if (value === "public" || value === "private" || value === "unlisted") {
    return value;
  }

  return "unlisted";
}

export function buildYouTubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function buildYouTubeShortsUrl(videoId: string): string {
  return `https://www.youtube.com/shorts/${videoId}`;
}
