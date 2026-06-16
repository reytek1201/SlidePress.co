import SettingsBackLink from "@/app/settings/settings-back-link";
import type { ReactNode } from "react";

interface LegalPageProps {
  title: string;
  lastUpdated: string;
  backHref: string;
  backLabel: string;
  children: ReactNode;
}

export default function LegalPage({
  title,
  lastUpdated,
  backHref,
  backLabel,
  children,
}: LegalPageProps) {
  return (
    <div className="min-h-full bg-background text-foreground">
      <main className="page-main">
        <div className="page-content mx-auto max-w-2xl">
          <div className="sticky top-0 z-10 -mx-4 mb-2 border-b border-border/50 bg-background/90 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6">
            <SettingsBackLink href={backHref} label={backLabel} />
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Last updated {lastUpdated}
          </p>

          <div className="prose-legal mt-10 space-y-6 text-sm leading-7 text-secondary-foreground">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
