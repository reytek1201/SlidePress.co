import Link from "next/link";

interface CampaignBackLinkProps {
  className?: string;
}

export default function CampaignBackLink({ className = "" }: CampaignBackLinkProps) {
  return (
    <Link
      href="/campaigns"
      className={`inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground ${className}`}
    >
      <span aria-hidden>←</span>
      All campaigns
    </Link>
  );
}
