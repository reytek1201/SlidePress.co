import type { PlatformPostPublic } from "@/types/platform-post";
import type { SuggestedPostTimePlatform } from "@/utils/platforms/suggested-post-times";

export interface SchedulePlatformPostInput {
  campaignId: string;
  platform: "youtube" | "tiktok" | "instagram";
  publishKind?: "video" | "carousel";
  exportId?: string | null;
  scheduledFor: string;
  publishSettings?: Record<string, unknown> | null;
}

export async function cancelScheduledPlatformPostClient(
  postId: string,
): Promise<void> {
  const response = await fetch(`/api/platforms/schedule/${postId}`, {
    method: "DELETE",
    credentials: "include",
  });

  const data = (await response.json()) as {
    success: boolean;
    error?: string;
  };

  if (!response.ok || !data.success) {
    throw new Error(data.error ?? "Failed to cancel scheduled post");
  }
}

export async function schedulePlatformPostClient(
  input: SchedulePlatformPostInput,
): Promise<PlatformPostPublic> {
  const body: Record<string, unknown> = {
    campaignId: input.campaignId,
    platform: input.platform,
    publishKind: input.publishKind ?? "video",
    scheduledFor: input.scheduledFor,
  };

  if (input.exportId) {
    body.exportId = input.exportId;
  }

  if (input.platform === "tiktok" && input.publishSettings) {
    body.publishSettings = input.publishSettings;
  }

  const response = await fetch("/api/platforms/schedule", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });

  const data = (await response.json()) as {
    success: boolean;
    post?: PlatformPostPublic;
    error?: string;
  };

  if (!response.ok || !data.success || !data.post) {
    throw new Error(data.error ?? "Failed to schedule post");
  }

  return data.post;
}

/** Pending rows must be cancelled before a new schedule time is written. */
export async function reschedulePendingPlatformPostClient(
  postId: string,
  input: SchedulePlatformPostInput,
): Promise<PlatformPostPublic> {
  await cancelScheduledPlatformPostClient(postId);
  return schedulePlatformPostClient(input);
}

export function platformKeyForScheduledPost(
  post: Pick<PlatformPostPublic, "platform" | "exportId">,
): SuggestedPostTimePlatform {
  if (post.platform === "youtube") {
    return "youtube";
  }

  if (post.platform === "tiktok") {
    return "tiktok";
  }

  return post.exportId ? "instagram_reel" : "instagram_carousel";
}

export function publishKindForScheduledPost(
  post: Pick<PlatformPostPublic, "platform" | "exportId">,
): "video" | "carousel" {
  return post.platform === "instagram" && !post.exportId ? "carousel" : "video";
}

export function scheduledPostPlatformLabel(
  post: Pick<PlatformPostPublic, "platform" | "exportId">,
): string {
  if (post.platform === "youtube") {
    return "YouTube Shorts";
  }

  if (post.platform === "tiktok") {
    return "TikTok";
  }

  return post.exportId ? "Instagram Reel" : "Instagram carousel";
}

export function buildScheduleInputFromPost(
  post: PlatformPostPublic,
  scheduledFor: string,
): SchedulePlatformPostInput {
  return {
    campaignId: post.campaignId,
    platform: post.platform,
    publishKind: publishKindForScheduledPost(post),
    exportId: post.exportId,
    scheduledFor,
    publishSettings: post.publishSettings,
  };
}
