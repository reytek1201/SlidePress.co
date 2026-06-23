import type { CampaignStatus } from "@/types/campaign";

/** Campaign statuses omitted from the campaigns list and total count. */
export const HIDDEN_CAMPAIGN_STATUSES: CampaignStatus[] = ["failed"];

export function isCampaignVisibleInList(status: CampaignStatus): boolean {
  return !HIDDEN_CAMPAIGN_STATUSES.includes(status);
}
