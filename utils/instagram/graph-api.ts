const GRAPH_API_VERSION = "v22.0";
export const INSTAGRAM_CONTAINER_POLL_INTERVAL_MS = 5_000;
export const INSTAGRAM_CONTAINER_POLL_MAX_ATTEMPTS = 120;

export class InstagramPublishScopeError extends Error {
  constructor(message = "Instagram publishing permission is required") {
    super(message);
    this.name = "InstagramPublishScopeError";
  }
}

interface GraphErrorBody {
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
  };
}

function assertGraphOk(response: Response, body: GraphErrorBody | null): void {
  if (response.ok && !body?.error) {
    return;
  }

  const message = body?.error?.message ?? "Meta Graph API request failed";
  const normalized = message.toLowerCase();

  if (
    normalized.includes("permission") ||
    normalized.includes("oauth") ||
    normalized.includes("instagram_content_publish") ||
    body?.error?.code === 10 ||
    body?.error?.code === 200
  ) {
    if (
      normalized.includes("instagram_content_publish") ||
      normalized.includes("publish") ||
      normalized.includes("permission")
    ) {
      throw new InstagramPublishScopeError();
    }
  }

  throw new Error(message);
}

export async function graphGet<T>(
  path: string,
  accessToken: string,
  query?: Record<string, string>,
): Promise<T> {
  const params = new URLSearchParams({
    access_token: accessToken,
    ...query,
  });

  const response = await fetch(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/${path}?${params.toString()}`,
  );

  const body = (await response.json().catch(() => null)) as
    | (T & GraphErrorBody)
    | null;

  assertGraphOk(response, body);
  return body as T;
}

export async function graphPost<T>(
  path: string,
  accessToken: string,
  fields: Record<string, string>,
): Promise<T> {
  const params = new URLSearchParams({
    access_token: accessToken,
    ...fields,
  });

  const response = await fetch(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/${path}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    },
  );

  const body = (await response.json().catch(() => null)) as
    | (T & GraphErrorBody)
    | null;

  assertGraphOk(response, body);
  return body as T;
}

export async function fetchInstagramPageAccessToken(
  userAccessToken: string,
  pageId: string,
): Promise<string> {
  const data = await graphGet<{ access_token?: string }>(pageId, userAccessToken, {
    fields: "access_token",
  });

  if (!data.access_token) {
    throw new Error("Could not load Facebook Page access token for Instagram");
  }

  return data.access_token;
}

export async function waitForInstagramContainerReady(
  containerId: string,
  accessToken: string,
): Promise<void> {
  for (
    let attempt = 0;
    attempt < INSTAGRAM_CONTAINER_POLL_MAX_ATTEMPTS;
    attempt += 1
  ) {
    const data = await graphGet<{
      status_code?: string;
      status?: string;
    }>(containerId, accessToken, {
      fields: "status_code,status",
    });

    const statusCode = data.status_code ?? data.status ?? "";

    if (statusCode === "FINISHED") {
      return;
    }

    if (statusCode === "ERROR" || statusCode === "EXPIRED") {
      throw new Error(
        data.status
          ? `Instagram media processing failed: ${data.status}`
          : "Instagram media processing failed",
      );
    }

    await new Promise((resolve) => {
      setTimeout(resolve, INSTAGRAM_CONTAINER_POLL_INTERVAL_MS);
    });
  }

  throw new Error(
    "Timed out waiting for Instagram to process your media. Check your Instagram profile in a few minutes.",
  );
}

export async function publishInstagramMediaContainer(input: {
  instagramUserId: string;
  pageAccessToken: string;
  containerId: string;
}): Promise<string> {
  const data = await graphPost<{ id?: string }>(
    `${input.instagramUserId}/media_publish`,
    input.pageAccessToken,
    {
      creation_id: input.containerId,
    },
  );

  if (!data.id) {
    throw new Error("Instagram did not return a published media id");
  }

  return data.id;
}

export async function fetchInstagramMediaPermalink(
  mediaId: string,
  accessToken: string,
): Promise<string> {
  const data = await graphGet<{ permalink?: string }>(mediaId, accessToken, {
    fields: "permalink",
  });

  if (!data.permalink) {
    return `https://www.instagram.com/`;
  }

  return data.permalink;
}
