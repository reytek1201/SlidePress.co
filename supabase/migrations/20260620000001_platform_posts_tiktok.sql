-- Allow TikTok in platform_posts and dedupe per platform + export.

ALTER TABLE public.platform_posts
  DROP CONSTRAINT platform_posts_platform_check;

ALTER TABLE public.platform_posts
  ADD CONSTRAINT platform_posts_platform_check
  CHECK (platform IN ('youtube', 'tiktok'));

DROP INDEX IF EXISTS public.platform_posts_campaign_export_active_idx;

CREATE UNIQUE INDEX platform_posts_campaign_export_platform_active_idx
  ON public.platform_posts (campaign_id, export_id, platform)
  WHERE export_id IS NOT NULL
    AND status IN ('pending', 'uploading', 'processing', 'published');
