import type { YouTubeVideoMetadata } from "@/utils/youtube/video-metadata";

const UPLOAD_INIT_URL =
  "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status";

const PROCESSING_POLL_INTERVAL_MS = 5_000;
const PROCESSING_POLL_MAX_ATTEMPTS = 48;

export class YouTubeUploadScopeError extends Error {
  constructor(message = "YouTube upload permission is required") {
    super(message);
    this.name = "YouTubeUploadScopeError";
  }
}

export interface YouTubeUploadResult {
  videoId: string;
  watchUrl: string;
  shortsUrl: string;
}

interface YouTubeVideoResource {
  id?: string;
  snippet?: {
    title?: string;
  };
  status?: {
    uploadStatus?: string;
    privacyStatus?: string;
  };
  processingDetails?: {
    processingStatus?: string;
    processingFailureReason?: string;
  };
}

async function downloadVideo(videoUrl: string): Promise<Buffer> {
  const response = await fetch(videoUrl);

  if (!response.ok) {
    throw new Error("Failed to download campaign video for YouTube upload");
  }

  const arrayBuffer = await response.arrayBuffer();

  if (arrayBuffer.byteLength === 0) {
    throw new Error("Campaign video file is empty");
  }

  return Buffer.from(arrayBuffer);
}

function assertYouTubeResponseOk(status: number, body: unknown): void {
  const payload = body as {
    error?: {
      message?: string;
      errors?: Array<{ reason?: string; message?: string }>;
    };
  } | null;

  if (status < 400) {
    return;
  }

  const reason = payload?.error?.errors?.[0]?.reason;

  if (status === 403 && reason === "insufficientPermissions") {
    throw new YouTubeUploadScopeError();
  }

  if (status === 403 && reason === "uploadLimitExceeded") {
    throw new Error("YouTube daily upload limit reached. Try again tomorrow.");
  }

  throw new Error(
    payload?.error?.message ??
      payload?.error?.errors?.[0]?.message ??
      `YouTube API request failed (${status})`,
  );
}

async function startResumableUpload(
  accessToken: string,
  metadata: YouTubeVideoMetadata,
  privacyStatus: "public" | "unlisted" | "private",
  contentLength: number,
): Promise<string> {
  const response = await fetch(UPLOAD_INIT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
      "X-Upload-Content-Type": "video/mp4",
      "X-Upload-Content-Length": String(contentLength),
    },
    body: JSON.stringify({
      snippet: {
        title: metadata.title,
        description: metadata.description,
        categoryId: metadata.categoryId,
      },
      status: {
        privacyStatus,
        selfDeclaredMadeForKids: false,
      },
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    assertYouTubeResponseOk(response.status, body);
  }

  const uploadUrl = response.headers.get("location");

  if (!uploadUrl) {
    throw new Error("YouTube did not return an upload URL");
  }

  return uploadUrl;
}

async function uploadVideoBytes(
  uploadUrl: string,
  videoBuffer: Buffer,
): Promise<YouTubeVideoResource> {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "video/mp4",
      "Content-Length": String(videoBuffer.byteLength),
    },
    body: new Uint8Array(videoBuffer),
  });

  const body = (await response.json().catch(() => null)) as
    | YouTubeVideoResource
    | { error?: { message?: string } }
    | null;

  if (!response.ok) {
    assertYouTubeResponseOk(response.status, body);
  }

  if (!body || !("id" in body) || !body.id) {
    throw new Error("YouTube upload completed without a video id");
  }

  return body;
}

async function fetchVideoProcessingStatus(
  accessToken: string,
  videoId: string,
): Promise<YouTubeVideoResource> {
  const params = new URLSearchParams({
    part: "processingDetails,status,snippet",
    id: videoId,
  });

  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  const body = (await response.json().catch(() => null)) as {
    items?: YouTubeVideoResource[];
    error?: { message?: string };
  } | null;

  if (!response.ok) {
    assertYouTubeResponseOk(response.status, body);
  }

  const video = body?.items?.[0];

  if (!video) {
    throw new Error("Uploaded video not found on YouTube");
  }

  return video;
}

function isTerminalProcessingStatus(status: string | undefined): boolean {
  return (
    status === "succeeded" ||
    status === "failed" ||
    status === "terminated"
  );
}

async function waitForVideoProcessing(
  accessToken: string,
  videoId: string,
): Promise<void> {
  for (let attempt = 0; attempt < PROCESSING_POLL_MAX_ATTEMPTS; attempt += 1) {
    const video = await fetchVideoProcessingStatus(accessToken, videoId);
    const processingStatus = video.processingDetails?.processingStatus;

    if (processingStatus === "failed" || processingStatus === "terminated") {
      const reason =
        video.processingDetails?.processingFailureReason ??
        "Video processing failed on YouTube";
      throw new Error(reason);
    }

    if (isTerminalProcessingStatus(processingStatus)) {
      return;
    }

    await new Promise((resolve) => {
      setTimeout(resolve, PROCESSING_POLL_INTERVAL_MS);
    });
  }

  throw new Error("Timed out waiting for YouTube to finish processing the video");
}

export async function uploadYouTubeShort(input: {
  accessToken: string;
  videoUrl: string;
  metadata: YouTubeVideoMetadata;
  privacyStatus: "public" | "unlisted" | "private";
}): Promise<YouTubeUploadResult> {
  const videoBuffer = await downloadVideo(input.videoUrl);
  const uploadUrl = await startResumableUpload(
    input.accessToken,
    input.metadata,
    input.privacyStatus,
    videoBuffer.byteLength,
  );

  const uploaded = await uploadVideoBytes(uploadUrl, videoBuffer);
  const videoId = uploaded.id!;

  await waitForVideoProcessing(input.accessToken, videoId);

  return {
    videoId,
    watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
    shortsUrl: `https://www.youtube.com/shorts/${videoId}`,
  };
}
