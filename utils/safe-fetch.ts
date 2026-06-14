/**
 * Fetch helper that validates URLs against an allowlist before requesting.
 * Prevents SSRF by blocking private IPs, link-local addresses, and any host
 * not explicitly trusted.
 */

const PRIVATE_IP_PATTERNS = [
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
];

function isPrivateHost(hostname: string): boolean {
  return PRIVATE_IP_PATTERNS.some((pattern) => pattern.test(hostname));
}

function getAllowedHosts(): string[] {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseHost = supabaseUrl ? new URL(supabaseUrl).hostname : "";

  return [
    supabaseHost,
    "fal.media",
    "v3.fal.media",
    "cdn.fal.media",
    "storage.googleapis.com",
  ].filter(Boolean);
}

function isAllowedUrl(rawUrl: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return false;
  }

  if (parsed.protocol !== "https:") {
    return false;
  }

  const { hostname } = parsed;

  if (isPrivateHost(hostname)) {
    return false;
  }

  const allowed = getAllowedHosts();
  return allowed.some(
    (host) => hostname === host || hostname.endsWith(`.${host}`),
  );
}

export async function safeFetch(url: string): Promise<Response> {
  if (!isAllowedUrl(url)) {
    throw new Error(
      `URL not allowed: ${url}. Only Supabase storage and Fal CDN URLs are permitted.`,
    );
  }

  return fetch(url);
}
