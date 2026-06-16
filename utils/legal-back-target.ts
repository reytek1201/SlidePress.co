export interface LegalBackTarget {
  href: string;
  label: string;
}

export function resolveLegalBackTarget(from?: string): LegalBackTarget {
  switch (from) {
    case "about":
      return { href: "/settings/about", label: "About" };
    case "login":
      return { href: "/login", label: "Sign in" };
    default:
      return { href: "/", label: "SlidePress" };
  }
}

export function legalPageHref(
  path: "/privacy" | "/terms",
  from: "about" | "login",
): string {
  return `${path}?from=${from}`;
}
