const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^\[?::1\]?$/,
  /^\[?fc[0-9a-f]{2}:/i,
  /^\[?fd[0-9a-f]{2}:/i,
  /^0\./,
  /^0$/,
  /\.local$/i,
  /\.internal$/i,
];

const DEFAULT_MAX_BYTES = 2 * 1024 * 1024;
const DEFAULT_TIMEOUT_MS = 12_000;

export class PublicUrlFetchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PublicUrlFetchError";
  }
}

function isPrivateHost(hostname: string): boolean {
  const normalized = hostname.trim().toLowerCase();

  if (!normalized) {
    return true;
  }

  return PRIVATE_HOST_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function normalizePublicWebsiteUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();

  if (!trimmed) {
    throw new PublicUrlFetchError("Enter a website URL");
  }

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  let parsed: URL;

  try {
    parsed = new URL(withProtocol);
  } catch {
    throw new PublicUrlFetchError("Enter a valid website URL");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new PublicUrlFetchError("Only http and https URLs are supported");
  }

  if (parsed.username || parsed.password) {
    throw new PublicUrlFetchError("URLs with credentials are not allowed");
  }

  if (isPrivateHost(parsed.hostname)) {
    throw new PublicUrlFetchError("That URL is not allowed");
  }

  parsed.hash = "";
  return parsed.toString();
}

function assertPublicResponseUrl(url: string): void {
  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch {
    throw new PublicUrlFetchError("Redirect target is not allowed");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new PublicUrlFetchError("Redirect target is not allowed");
  }

  if (isPrivateHost(parsed.hostname)) {
    throw new PublicUrlFetchError("Redirect target is not allowed");
  }
}

async function readResponseWithLimit(
  response: Response,
  maxBytes: number,
): Promise<string> {
  const contentLength = response.headers.get("content-length");

  if (contentLength && Number(contentLength) > maxBytes) {
    throw new PublicUrlFetchError("Website response is too large");
  }

  if (!response.body) {
    const text = await response.text();
    if (text.length > maxBytes) {
      throw new PublicUrlFetchError("Website response is too large");
    }
    return text;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let totalBytes = 0;
  let text = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    totalBytes += value.byteLength;

    if (totalBytes > maxBytes) {
      throw new PublicUrlFetchError("Website response is too large");
    }

    text += decoder.decode(value, { stream: true });
  }

  text += decoder.decode();
  return text;
}

export async function fetchPublicWebsiteHtml(
  rawUrl: string,
  options?: {
    maxBytes?: number;
    timeoutMs?: number;
  },
): Promise<{ html: string; finalUrl: string }> {
  const normalizedUrl = normalizePublicWebsiteUrl(rawUrl);
  const maxBytes = options?.maxBytes ?? DEFAULT_MAX_BYTES;
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(normalizedUrl, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        Accept: "text/html,application/xhtml+xml,text/plain;q=0.8",
        "User-Agent":
          "SlidePressBot/1.0 (+https://www.slidepress.co; website campaign ingest)",
      },
    });

    assertPublicResponseUrl(response.url);

    if (!response.ok) {
      throw new PublicUrlFetchError(
        `Could not read website (HTTP ${response.status})`,
      );
    }

    const html = await readResponseWithLimit(response, maxBytes);

    if (!html.trim()) {
      throw new PublicUrlFetchError("Website returned an empty page");
    }

    return {
      html,
      finalUrl: response.url,
    };
  } catch (error) {
    if (error instanceof PublicUrlFetchError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new PublicUrlFetchError("Website took too long to respond");
    }

    throw new PublicUrlFetchError("Could not reach that website");
  } finally {
    clearTimeout(timeout);
  }
}
