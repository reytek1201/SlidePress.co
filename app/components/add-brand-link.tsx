import Link from "next/link";

const BRANDS_LIST_HREF = "/settings/brands";

interface AddBrandLinkProps {
  label?: string;
  variant?: "inline" | "button";
  className?: string;
}

export function addBrandHref(): string {
  return BRANDS_LIST_HREF;
}

export default function AddBrandLink({
  label = "Add a brand",
  variant = "inline",
  className = "",
}: AddBrandLinkProps) {
  if (variant === "button") {
    return (
      <Link
        href={BRANDS_LIST_HREF}
        className={`inline-flex items-center justify-center rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-secondary-foreground transition hover:border-ring/60 hover:text-foreground ${className}`}
      >
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={BRANDS_LIST_HREF}
      className={`font-medium text-primary underline-offset-2 hover:underline ${className}`}
    >
      {label}
    </Link>
  );
}

export function AddBrandBanner({
  label = "Add another brand",
}: {
  label?: string;
}) {
  return (
    <p className="mb-6 rounded-xl border border-border bg-card/40 px-4 py-3 text-sm text-muted-foreground">
      Working on more than one business or client?{" "}
      <AddBrandLink label={label} />
    </p>
  );
}
