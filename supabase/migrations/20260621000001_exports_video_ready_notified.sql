-- Dedupe push notifications when a video export completes (notifications Phase 1)

ALTER TABLE public.exports
  ADD COLUMN IF NOT EXISTS video_ready_notified_at timestamptz;
