import Link from "next/link";

export default function SettingsBackLink({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/settings"
      className={`inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground ${className}`}
    >
      <span aria-hidden>←</span>
      Settings
    </Link>
  );
}
