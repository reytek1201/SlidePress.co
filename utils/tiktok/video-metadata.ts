import type { PlatformCaption } from "@/types/captions";
import {
  formatHashtagsOnlyForCopy,
  formatPostCaptionForCopy,
} from "@/types/captions";

const TIKTOK_TITLE_MAX = 2200;

export function buildTikTokPostTitle(caption: PlatformCaption): string {
  const parts = [
    formatPostCaptionForCopy(caption),
    formatHashtagsOnlyForCopy(caption),
  ].filter(Boolean);

  return parts.join("\n\n").slice(0, TIKTOK_TITLE_MAX);
}

export function buildTikTokProfileUrl(username: string): string {
  const handle = username.replace(/^@/, "").trim();
  return `https://www.tiktok.com/@${encodeURIComponent(handle)}`;
}

export function buildTikTokVideoUrl(postId: string): string {
  return `https://www.tiktok.com/video/${postId}`;
}

export function getTikTokPublishPrivacyPreference():
  | "PUBLIC_TO_EVERYONE"
  | "MUTUAL_FOLLOW_FRIENDS"
  | "FOLLOWER_OF_CREATOR"
  | "SELF_ONLY" {
  const value = process.env.TIKTOK_PUBLISH_PRIVACY?.toUpperCase();

  if (
    value === "PUBLIC_TO_EVERYONE" ||
    value === "MUTUAL_FOLLOW_FRIENDS" ||
    value === "FOLLOWER_OF_CREATOR" ||
    value === "SELF_ONLY"
  ) {
    return value;
  }

  return "SELF_ONLY";
}
