import type { WebsiteIngestApiSuccess } from "@/types/website-ingest";

const CACHE_KEY = "slidepress-website-ingest-cache";
const CACHE_VERSION = 1;
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface CachedWebsiteIngest extends WebsiteIngestApiSuccess {
  inputUrl: string;
  cachedAt: string;
  schemaVersion: number;
}

function isFresh(cachedAt: string): boolean {
  const timestamp = Date.parse(cachedAt);

  if (Number.isNaN(timestamp)) {
    return false;
  }

  return Date.now() - timestamp < CACHE_TTL_MS;
}

export function getCachedWebsiteIngest(): CachedWebsiteIngest | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(CACHE_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as CachedWebsiteIngest;

    if (
      parsed.schemaVersion !== CACHE_VERSION ||
      !parsed.success ||
      !parsed.topics?.length ||
      !parsed.inputUrl ||
      !parsed.cachedAt ||
      !isFresh(parsed.cachedAt)
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function setCachedWebsiteIngest(
  inputUrl: string,
  payload: WebsiteIngestApiSuccess,
): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const cache: CachedWebsiteIngest = {
      ...payload,
      inputUrl: inputUrl.trim(),
      cachedAt: new Date().toISOString(),
      schemaVersion: CACHE_VERSION,
    };

    window.localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // localStorage unavailable.
  }
}

export function clearCachedWebsiteIngest(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(CACHE_KEY);
  } catch {
    // localStorage unavailable.
  }
}

export function getHostnameFromUrl(rawUrl: string): string | null {
  const trimmed = rawUrl.trim();

  if (!trimmed) {
    return null;
  }

  try {
    const withProtocol = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;

    return new URL(withProtocol).hostname;
  } catch {
    return null;
  }
}
