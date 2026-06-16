"use client";

import SettingsBackLink from "@/app/settings/settings-back-link";

interface SettingsSubpageShellProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export default function SettingsSubpageShell({
  title,
  description,
  children,
}: SettingsSubpageShellProps) {
  return (
    <div className="min-h-full bg-background text-foreground">
      <main className="page-main">
        <div className="page-content">
          <div className="md:hidden">
            <SettingsBackLink className="mb-4" />
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
