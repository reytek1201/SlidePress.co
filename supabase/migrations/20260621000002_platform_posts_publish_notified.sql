-- Dedupe push notifications when a platform publish reaches a terminal state (notifications Phase 2)

ALTER TABLE public.platform_posts
  ADD COLUMN IF NOT EXISTS publish_notified_at timestamptz;
