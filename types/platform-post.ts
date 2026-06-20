export type PlatformPostStatus =
  | "pending"
  | "uploading"
  | "processing"
  | "published"
  | "failed";

export type PlatformPostPlatform = "youtube" | "tiktok";

export interface PlatformPostPublic {
  id: string;
  campaignId: string;
  platform: PlatformPostPlatform;
  exportId: string | null;
  status: PlatformPostStatus;
  externalId: string | null;
  externalUrl: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformPostRow {
  id: string;
  user_id: string;
  campaign_id: string;
  platform: PlatformPostPlatform;
  export_id: string | null;
  status: PlatformPostStatus;
  external_id: string | null;
  external_url: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export function toPlatformPostPublic(row: PlatformPostRow): PlatformPostPublic {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    platform: row.platform,
    exportId: row.export_id,
    status: row.status,
    externalId: row.external_id,
    externalUrl: row.external_url,
    errorMessage: row.error_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
