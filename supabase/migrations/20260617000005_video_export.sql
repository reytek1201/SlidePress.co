-- Phase 4: Fal FFmpeg video export tracking

ALTER TABLE public.exports
  ADD COLUMN IF NOT EXISTS fal_request_id TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_exports_fal_request_id
  ON public.exports (fal_request_id)
  WHERE fal_request_id IS NOT NULL;

ALTER TABLE public.usage_events
  DROP CONSTRAINT IF EXISTS usage_events_event_type_check;

ALTER TABLE public.usage_events
  ADD CONSTRAINT usage_events_event_type_check
  CHECK (
    event_type IN (
      'slide_regenerated',
      'campaign_created',
      'tts_characters',
      'tts_preview',
      'tts_export',
      'video_export'
    )
  );
