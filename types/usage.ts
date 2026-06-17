export interface UsageLimits {
  campaignsPerMonth: number;
  slideRegenerationsPerMonth: number;
  ttsPreviewsPerMonth: number;
  audioExportsPerMonth: number;
  videoExportsPerMonth: number;
}

export interface UsageRemaining {
  campaigns: number;
  slideRegenerations: number;
  ttsPreviews: number;
  audioExports: number;
  videoExports: number;
}

export interface UsageSummary {
  campaignsThisMonth: number;
  totalCampaigns: number;
  slideRegenerationsThisMonth: number;
  ttsPreviewsThisMonth: number;
  audioExportsThisMonth: number;
  videoExportsThisMonth: number;
  limits: UsageLimits;
  remaining: UsageRemaining;
  canCreateCampaign: boolean;
  canRegenerateSlide: boolean;
  canPreviewTts: boolean;
  canExportAudio: boolean;
  canExportVideo: boolean;
  planLabel: string;
  resetsAt: string;
}
