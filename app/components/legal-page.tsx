import Link from "next/link";
import type { ReactNode } from "react";

interface LegalPageProps {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}

export default function LegalPage({
  title,
  lastUpdated,
  children,
}: LegalPageProps) {
  return (
    <div className="min-h-full bg-background text-foreground">
      <main className="page-main">
        <div className="page-content mx-auto max-w-2xl">
          <p className="text-sm text-muted-foreground">
            <Link
              href="/"
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              SlidePress
            </Link>
          </p>

          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-foreground">
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
