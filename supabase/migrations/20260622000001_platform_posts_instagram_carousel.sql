-- One active Instagram carousel post per campaign (carousel posts have no export_id).

CREATE UNIQUE INDEX IF NOT EXISTS platform_posts_campaign_carousel_active_idx
  ON public.platform_posts (campaign_id, platform)
  WHERE export_id IS NULL
    AND platform = 'instagram'
    AND status IN ('pending', 'uploading', 'processing', 'published');
