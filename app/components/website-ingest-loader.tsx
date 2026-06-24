"use client";

import { useEffect, useState } from "react";

const LOADING_STEPS = [
  "Reading your homepage…",
  "Understanding your offer…",
  "Drafting campaign hooks…",
] as const;

function getHostname(rawUrl: string): string | null {
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

function getFaviconUrl(hostname: string): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=64`;
}

interface WebsiteIngestLoaderProps {
  url: string;
  previewImageUrl?: string | null;
  businessName?: string | null;
}

export default function WebsiteIngestLoader({
  url,
  previewImageUrl = null,
  businessName = null,
}: WebsiteIngestLoaderProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const hostname = getHostname(url);
  const faviconUrl = hostname ? getFaviconUrl(hostname) : null;
  const imageUrl = previewImageUrl ?? faviconUrl;

  useEffect(() => {
    const interval = window.setInterval(() => {
      setStepIndex((current) => (current + 1) % LOADING_STEPS.length);
    }, 2200);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  return (
    <div className="rounded-xl border border-border bg-card/40 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-background">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          {businessName ? (
            <p className="truncate text-sm font-semibold text-foreground">
              {businessName}
            </p>
          ) : hostname ? (
            <p className="truncate text-sm font-medium text-foreground">
              {hostname}
            </p>
          ) : null}
          <p className="mt-0.5 text-sm text-muted-foreground">
            {LOADING_STEPS[stepIndex]}
          </p>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        {LOADING_STEPS.map((step, index) => (
          <div
            key={step}
            className={`h-1 flex-1 rounded-full transition ${
              index <= stepIndex ? "bg-primary" : "bg-border"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
