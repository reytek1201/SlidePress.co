export function getInstagramPublishErrorMessage(error: string): string {
  const normalized = error.toLowerCase();

  if (
    normalized.includes("publishing permission") ||
    normalized.includes("instagram_content_publish")
  ) {
    return "Instagram publishing permission required. Grant access to post Reels.";
  }

  if (
    normalized.includes("90 seconds") ||
    normalized.includes("video is too long")
  ) {
    return "Instagram Reels must be 90 seconds or shorter. Export a shorter video.";
  }

  if (normalized.includes("no completed 9:16 video export")) {
    return "Export a 9:16 Quick Reel video first, then post to Instagram.";
  }

  if (normalized.includes("connect instagram")) {
    return "Connect Instagram in Settings before posting.";
  }

  if (
    normalized.includes("token") &&
    (normalized.includes("expired") || normalized.includes("invalid"))
  ) {
    return "Instagram connection expired. Disconnect and reconnect in Settings.";
  }

  if (normalized.includes("already being published")) {
    return "This export is already being published to Instagram.";
  }

  if (normalized.includes("timed out waiting for instagram")) {
    return "Instagram is still processing your video. Check your profile in a few minutes.";
  }

  if (normalized.includes("could not fetch") && normalized.includes("video")) {
    return "Instagram could not download your video. Try exporting again, then retry.";
  }

  return error;
}
