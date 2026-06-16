"use client";

import SettingsBackLink from "@/app/settings/settings-back-link";

interface SettingsSubpageShellProps {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  children: React.ReactNode;
}

export default function SettingsSubpageShell({
  title,
  description,
  backHref,
  backLabel,
  children,
}: SettingsSubpageShellProps) {
  return (
    <div className="min-h-full bg-background text-foreground">
      <main className="page-main">
        <div className="page-content">
          <div className="sticky top-0 z-10 -mx-4 mb-4 border-b border-border/50 bg-background/90 px-4 py-3 backdrop-blur-md md:hidden">
            <SettingsBackLink href={backHref} label={backLabel} />
          </div>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {title}
            </h1>
            {description && (
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            )}
          </div>

          <div className="mt-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
