export class TikTokPublishScopeError extends Error {
  constructor(message = "TikTok posting permission is required") {
    super(message);
    this.name = "TikTokPublishScopeError";
  }
}

interface TikTokApiError {
  code?: string;
  message?: string;
}

interface TikTokApiResponse<T> {
  data?: T;
  error?: TikTokApiError;
}

function assertTikTokApiOk<T>(
  response: Response,
  body: TikTokApiResponse<T> | null,
): asserts body is TikTokApiResponse<T> & { data: T } {
  if (!response.ok || body?.error?.code !== "ok" || !body.data) {
    const code = body?.error?.code;
    const message = body?.error?.message ?? "TikTok API request failed";

    if (code === "scope_not_authorized") {
      throw new TikTokPublishScopeError();
    }

    if (code === "url_ownership_unverified") {
      throw new Error(
        "TikTok must verify your video URL domain before pull-from-URL posting. Add and verify the export host in TikTok Developer Portal → URL properties.",
      );
    }

    if (code === "unaudited_client_can_only_post_to_private_accounts") {
      throw new Error(
        "TikTok sandbox apps can only post privately. Reconnect with posting permission and use a private privacy level.",
      );
    }

    if (code === "spam_risk_too_many_posts") {
      throw new Error("TikTok daily post limit reached. Try again tomorrow.");
    }

    throw new Error(message);
  }
}

export interface TikTokCreatorInfo {
  creatorUsername: string;
  creatorNickname: string;
  privacyLevelOptions: string[];
  commentDisabled: boolean;
  duetDisabled: boolean;
  stitchDisabled: boolean;
  maxVideoPostDurationSec: number;
}

export interface TikTokPublishResult {
  publishId: string;
  postId: string | null;
  profileUrl: string;
  videoUrl: string | null;
}

const STATUS_POLL_INTERVAL_MS = 5_000;
const STATUS_POLL_MAX_ATTEMPTS = 120;

export async function queryTikTokCreatorInfo(
  accessToken: string,
): Promise<TikTokCreatorInfo> {
  const response = await fetch(
    "https://open.tiktokapis.com/v2/post/publish/creator_info/query/",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
    },
  );

  const body = (await response.json().catch(() => null)) as TikTokApiResponse<{
    creator_username?: string;
    creator_nickname?: string;
    privacy_level_options?: string[];
    comment_disabled?: boolean;
    duet_disabled?: boolean;
    stitch_disabled?: boolean;
    max_video_post_duration_sec?: number;
  }> | null;

  assertTikTokApiOk(response, body);

  const data = body.data;

  if (!data.creator_username || !data.privacy_level_options?.length) {
    throw new Error("TikTok did not return creator posting options");
  }

  return {
    creatorUsername: data.creator_username,
    creatorNickname: data.creator_nickname ?? data.creator_username,
    privacyLevelOptions: data.privacy_level_options,
    commentDisabled: Boolean(data.comment_disabled),
    duetDisabled: Boolean(data.duet_disabled),
    stitchDisabled: Boolean(data.stitch_disabled),
    maxVideoPostDurationSec: data.max_video_post_duration_sec ?? 60,
  };
}

function pickPrivacyLevel(
  options: string[],
  preferred: string,
): string {
  if (options.includes(preferred)) {
    return preferred;
  }

  if (options.includes("SELF_ONLY")) {
    return "SELF_ONLY";
  }

  return options[0]!;
}

async function initTikTokDirectPost(input: {
  accessToken: string;
  videoUrl: string;
  title: string;
  creator: TikTokCreatorInfo;
  privacyLevel: string;
}): Promise<string> {
  const response = await fetch(
    "https://open.tiktokapis.com/v2/post/publish/video/init/",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify({
        post_info: {
          title: input.title,
          privacy_level: input.privacyLevel,
          disable_comment: input.creator.commentDisabled,
          disable_duet: input.creator.duetDisabled,
          disable_stitch: input.creator.stitchDisabled,
          brand_content_toggle: false,
          brand_organic_toggle: true,
        },
        source_info: {
          source: "PULL_FROM_URL",
          video_url: input.videoUrl,
        },
      }),
    },
  );

  const body = (await response.json().catch(() => null)) as TikTokApiResponse<{
    publish_id?: string;
  }> | null;

  assertTikTokApiOk(response, body);

  if (!body.data.publish_id) {
    throw new Error("TikTok did not return a publish id");
  }

  return body.data.publish_id;
}

async function fetchTikTokPublishStatus(
  accessToken: string,
  publishId: string,
): Promise<{
  status: string;
  failReason: string | null;
  postIds: string[];
}> {
  const response = await fetch(
    "https://open.tiktokapis.com/v2/post/publish/status/fetch/",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify({ publish_id: publishId }),
    },
  );

  const body = (await response.json().catch(() => null)) as TikTokApiResponse<{
    status?: string;
    fail_reason?: string;
    publicaly_available_post_id?: string[];
  }> | null;

  assertTikTokApiOk(response, body);

  return {
    status: body.data.status ?? "FAILED",
    failReason: body.data.fail_reason ?? null,
    postIds: body.data.publicaly_available_post_id ?? [],
  };
}

async function waitForTikTokPublishComplete(
  accessToken: string,
  publishId: string,
): Promise<{ postIds: string[] }> {
  for (let attempt = 0; attempt < STATUS_POLL_MAX_ATTEMPTS; attempt += 1) {
    const status = await fetchTikTokPublishStatus(accessToken, publishId);

    if (status.status === "FAILED") {
      throw new Error(
        status.failReason
          ? `TikTok publish failed: ${status.failReason}`
          : "TikTok publish failed",
      );
    }

    if (status.status === "PUBLISH_COMPLETE") {
      return { postIds: status.postIds };
    }

    await new Promise((resolve) => {
      setTimeout(resolve, STATUS_POLL_INTERVAL_MS);
    });
  }

  throw new Error(
    "Timed out waiting for TikTok to finish publishing. Check your TikTok profile in a few minutes.",
  );
}

export async function publishTikTokVideo(input: {
  accessToken: string;
  videoUrl: string;
  title: string;
  privacyPreference: string;
}): Promise<TikTokPublishResult> {
  const creator = await queryTikTokCreatorInfo(input.accessToken);
  const privacyLevel = pickPrivacyLevel(
    creator.privacyLevelOptions,
    input.privacyPreference,
  );

  const publishId = await initTikTokDirectPost({
    accessToken: input.accessToken,
    videoUrl: input.videoUrl,
    title: input.title,
    creator,
    privacyLevel,
  });

  const { postIds } = await waitForTikTokPublishComplete(
    input.accessToken,
    publishId,
  );

  const postId = postIds[0] ?? null;
  const profileUrl = `https://www.tiktok.com/@${creator.creatorUsername.replace(/^@/, "")}`;

  return {
    publishId,
    postId,
    profileUrl,
    videoUrl: postId ? `https://www.tiktok.com/video/${postId}` : profileUrl,
  };
}
