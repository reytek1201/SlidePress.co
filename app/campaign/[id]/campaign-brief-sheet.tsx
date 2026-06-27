"use client";

import CampaignCreationBriefContent from "@/app/campaign/[id]/campaign-creation-brief-content";
import BottomSheet from "@/app/components/bottom-sheet";
import type { Campaign } from "@/types/campaign";

interface CampaignBriefSheetProps {
  open: boolean;
  onClose: () => void;
  campaign: Campaign;
  brandName?: string | null;
  brandProductName?: string | null;
  slideCount: number;
}

export default function CampaignBriefSheet({
  open,
  onClose,
  campaign,
  brandName,
  brandProductName,
  slideCount,
}: CampaignBriefSheetProps) {
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Creation brief"
      titleId="campaign-brief-title"
      description="How this campaign was set up — topic, references, and key details."
      zIndexClass="z-[70]"
      maxHeightClass="max-h-[min(90dvh,720px)]"
      desktopModal
      footer={
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="btn-primary px-5 py-2.5 text-sm"
          >
            Close
          </button>
        </div>
      }
    >
      <CampaignCreationBriefContent
        campaign={campaign}
        brandName={brandName}
        brandProductName={brandProductName}
        slideCount={slideCount}
      />
    </BottomSheet>
  );
}
