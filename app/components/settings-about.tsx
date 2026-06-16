"use client";

import { useAppVersion } from "@/app/hooks/use-app-version";
import Link from "next/link";

interface SettingsAboutContentProps {
  variant?: "card" | "plain";
}

export default function SettingsAboutContent({
  variant = "plain",
}: SettingsAboutContentProps) {
  const version = useAppVersion();

  const versionLabel = version
    ? version.build !== version.version
      ? `Version ${version.version} (${version.build})`
      : `Version ${version.version}`
    : null;

  const body = (
    <>
      <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
        <p className="text-sm font-medium text-foreground">Beta</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          You&apos;re using a pre-release build. Features and limits may change.
          Report issues to{" "}
          <a
            href="mailto:hello@slidepress.co"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            hello@slidepress.co
          </a>
          .
        </p>
      </div>

      {versionLabel ? (
        <dl className="mt-6 space-y-4">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              App version
            </dt>
            <dd className="mt-1 text-sm text-foreground">{versionLabel}</dd>
          </div>
        </dl>
      ) : null}

      <nav
        aria-label="Legal"
        className="mt-8 space-y-1 border-t border-border pt-6"
      >
        <Link
          href="/privacy"
          className="flex items-center justify-between gap-4 py-3 text-sm font-medium text-foreground transition active:opacity-80"
        >
          Privacy Policy
          <span aria-hidden className="text-muted-foreground/70">
            ›
          </span>
        </Link>
        <Link
          href="/terms"
          className="flex items-center justify-between gap-4 py-3 text-sm font-medium text-foreground transition active:opacity-80"
        >
          Terms of Service
          <span aria-hidden className="text-muted-foreground/70">
            ›
          </span>
        </Link>
      </nav>
    </>
  );

  if (variant === "card") {
    return (
      <section className="rounded-2xl border border-border bg-card/50 p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-foreground">About</h2>
        <div className="mt-6">{body}</div>
      </section>
    );
  }

  return body;
}
