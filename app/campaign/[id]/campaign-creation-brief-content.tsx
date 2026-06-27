"use client";

import type { Campaign } from "@/types/campaign";
import { hasReferences } from "@/types/references";
import {
  formatCampaignAspectRatios,
  formatCampaignDate,
} from "@/utils/campaign-display";
import { formatCampaignGenerationStatus } from "@/utils/campaign-status-display";

interface CampaignCreationBriefContentProps {
  campaign: Pick<
    Campaign,
    | "topic"
    | "target_audience"
    | "aspect_ratio"
    | "secondary_aspect_ratio"
    | "slide_count"
    | "status"
    | "created_at"
    | "error_message"
    | "creation_credit_refunded"
    | "source_url"
    | "product_reference_url"
    | "style_reference_url"
    | "logo_reference_url"
  >;
  brandName?: string | null;
  brandProductName?: string | null;
  slideCount: number;
}

function ReferenceImage({
  label,
  url,
  alt,
}: {
  label: string;
  url: string;
  alt: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card/40 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-secondary-foreground">
        {label}
      </p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={alt}
        className="mt-3 max-h-36 w-full rounded-md object-contain"
      />
    </div>
  );
}

function MetadataItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm leading-6 text-secondary-foreground">
        {value}
      </dd>
    </div>
  );
}

export default function CampaignCreationBriefContent({
  campaign,
  brandName,
  brandProductName,
  slideCount,
}: CampaignCreationBriefContentProps) {
  const references = {
    product: campaign.product_reference_url,
    style: campaign.style_reference_url,
    logo: campaign.logo_reference_url,
  };

  const showReferences = hasReferences(references);
  const resolvedSlideCount = campaign.slide_count ?? slideCount;

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-border bg-card/40 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Campaign details
        </p>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2">
          <MetadataItem
            label="Brand"
            value={brandName?.trim() || "—"}
          />
          {brandProductName ? (
            <MetadataItem label="Product" value={brandProductName} />
          ) : null}
          <MetadataItem
            label="Formats"
            value={formatCampaignAspectRatios(campaign)}
          />
          <MetadataItem
            label="Slides"
            value={String(resolvedSlideCount)}
          />
          <MetadataItem
            label="Status"
            value={formatCampaignGenerationStatus(campaign.status)}
          />
          <MetadataItem
            label="Created"
            value={formatCampaignDate(campaign.created_at)}
          />
        </dl>

        {campaign.target_audience ? (
          <div className="mt-4 border-t border-border pt-4">
            <MetadataItem
              label="Target audience"
              value={campaign.target_audience}
            />
          </div>
        ) : null}

        {campaign.status === "failed" && campaign.error_message ? (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-3 text-sm text-red-200"
          >
            <p>{campaign.error_message}</p>
            {campaign.creation_credit_refunded ? (
              <p className="mt-2 text-xs text-amber-100/90">
                Your campaign credit was restored for this failure.
              </p>
            ) : null}
          </div>
        ) : null}
      </section>

      {campaign.source_url ? (
        <div className="rounded-lg border border-border bg-card/40 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Source website
          </p>
          <a
            href={campaign.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 block break-all text-sm leading-6 text-primary hover:underline"
          >
            {campaign.source_url}
          </a>
        </div>
      ) : null}

      <div className="rounded-lg border border-border bg-card/40 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Topic
        </p>
        <p className="mt-2 text-sm leading-6 text-secondary-foreground">
          {campaign.topic}
        </p>
      </div>

      {showReferences ? (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Reference images
          </p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {campaign.product_reference_url ? (
              <ReferenceImage
                label="Product"
                url={campaign.product_reference_url}
                alt="Product reference"
              />
            ) : null}
            {campaign.style_reference_url ? (
              <ReferenceImage
                label="Style"
                url={campaign.style_reference_url}
                alt="Style reference"
              />
            ) : null}
            {campaign.logo_reference_url ? (
              <ReferenceImage
                label="Logo"
                url={campaign.logo_reference_url}
                alt="Logo reference"
              />
            ) : null}
          </div>
        </div>
      ) : (
        <p className="text-sm leading-6 text-muted-foreground">
          No reference images were uploaded for this campaign.
        </p>
      )}
    </div>
  );
}
