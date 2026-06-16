import Link from "next/link";

function ChevronLeftIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

export default function SettingsBackLink({
  className = "",
  href = "/settings",
  label = "Settings",
}: {
  className?: string;
  href?: string;
  label?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-0.5 text-sm font-medium text-primary transition active:opacity-70 ${className}`}
    >
      <ChevronLeftIcon />
      {label}
    </Link>
  );
}
