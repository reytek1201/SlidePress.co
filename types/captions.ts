export type PlatformType = "tiktok" | "instagram" | "youtube_shorts";

export interface PlatformCaption {
  id: string;
  campaign_id: string;
  platform: PlatformType;
  hook: string | null;
  caption: string;
  hashtags: string[];
  title: string | null;
  created_at: string;
  updated_at: string;
}

export const PLATFORM_LABELS: Record<PlatformType, string> = {
  tiktok: "TikTok",
  instagram: "Instagram",
  youtube_shorts: "YouTube Shorts",
};

export const PLATFORM_ORDER: PlatformType[] = [
  "tiktok",
  "instagram",
  "youtube_shorts",
];

export const MAX_HASHTAGS = 5;

export type CaptionCopyField = "title" | "description" | "caption" | "hashtags";

export function captionCopyKey(
  platform: PlatformType,
  field: CaptionCopyField
): string {
  return `${platform}:${field}`;
}

export function limitHashtags(hashtags: string[]): string[] {
  return hashtags.slice(0, MAX_HASHTAGS);
}

export function normalizeHashtag(tag: string): string {
  const trimmed = tag.trim();
  if (!trimmed) {
    return trimmed;
  }

  return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
}

export function formatHashtagsForDisplay(hashtags: string[]): string {
  return limitHashtags(hashtags).map(normalizeHashtag).join(" ");
}

function formatHashtagsForCopy(hashtags: string[]): string {
  return limitHashtags(hashtags).map(normalizeHashtag).join(" ");
}

export function formatTitleForCopy(caption: PlatformCaption): string {
  return (caption.title ?? caption.hook ?? "Short").trim();
}

export function formatDescriptionForCopy(caption: PlatformCaption): string {
  const hashtags = formatHashtagsForCopy(caption.hashtags);
  return [caption.caption.trim(), hashtags].filter(Boolean).join("\n\n");
}

export function formatPostCaptionForCopy(caption: PlatformCaption): string {
  const lines = [caption.hook, caption.caption].filter(Boolean);
  return lines.join("\n\n").trim();
}

export function formatHashtagsOnlyForCopy(caption: PlatformCaption): string {
  return formatHashtagsForCopy(caption.hashtags);
}

export function formatCaptionFieldForCopy(
  caption: PlatformCaption,
  field: CaptionCopyField
): string {
  switch (field) {
    case "title":
      return formatTitleForCopy(caption);
    case "description":
      return formatDescriptionForCopy(caption);
    case "caption":
      return formatPostCaptionForCopy(caption);
    case "hashtags":
      return formatHashtagsOnlyForCopy(caption);
  }
}

export function formatCaptionForCopy(caption: PlatformCaption): string {
  if (caption.platform === "youtube_shorts") {
    return [
      `Title:\n${formatTitleForCopy(caption)}`,
      `Description:\n${formatDescriptionForCopy(caption)}`,
    ].join("\n\n");
  }

  return [
    `Caption:\n${formatPostCaptionForCopy(caption)}`,
    `Hashtags:\n${formatHashtagsOnlyForCopy(caption)}`,
  ].join("\n\n");
}

export function sortCaptionsByPlatform(
  captions: PlatformCaption[]
): PlatformCaption[] {
  return [...captions].sort(
    (left, right) =>
      PLATFORM_ORDER.indexOf(left.platform) -
      PLATFORM_ORDER.indexOf(right.platform)
  );
}

export function formatAllCaptionsForCopy(captions: PlatformCaption[]): string {
  return sortCaptionsByPlatform(captions)
    .map((caption) => {
      const header = `=== ${PLATFORM_LABELS[caption.platform]} ===`;
      return `${header}\n\n${formatCaptionForCopy(caption)}`;
    })
    .join("\n\n\n");
}
