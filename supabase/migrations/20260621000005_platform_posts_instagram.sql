-- Allow Instagram in platform_posts (Instagram Phase 3 — Reels publish)

ALTER TABLE public.platform_posts
  DROP CONSTRAINT platform_posts_platform_check;

ALTER TABLE public.platform_posts
  ADD CONSTRAINT platform_posts_platform_check
  CHECK (platform IN ('youtube', 'tiktok', 'instagram'));
