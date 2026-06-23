-- Refund campaign credits when text generation fails before slides are saved.

ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS creation_credit_refunded BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.usage_events
  DROP CONSTRAINT IF EXISTS usage_events_event_type_check;

ALTER TABLE public.usage_events
  ADD CONSTRAINT usage_events_event_type_check
  CHECK (
    event_type IN (
      'slide_regenerated',
      'campaign_created',
      'campaign_refunded',
      'tts_characters',
      'tts_preview',
      'tts_export',
      'video_export'
    )
  );

-- Restore one credit, capped at the user's tier maximum.
CREATE OR REPLACE FUNCTION public.restore_credit(
  p_user_id  UUID,
  p_credit   TEXT  -- 'campaign' | 'regeneration' | 'video' | 'tts_preview' | 'audio_export'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.usage_balances
  SET
    campaign_credits_remaining = LEAST(
      campaign_credits_remaining + CASE WHEN p_credit = 'campaign' THEN 1 ELSE 0 END,
      CASE tier WHEN 'creator' THEN 10 WHEN 'agency' THEN 30 ELSE 3 END
    ),
    regeneration_credits_remaining = LEAST(
      regeneration_credits_remaining + CASE WHEN p_credit = 'regeneration' THEN 1 ELSE 0 END,
      CASE tier WHEN 'creator' THEN 20 WHEN 'agency' THEN 60 ELSE 10 END
    ),
    video_credits_remaining = LEAST(
      video_credits_remaining + CASE WHEN p_credit = 'video' THEN 1 ELSE 0 END,
      CASE tier WHEN 'creator' THEN 10 WHEN 'agency' THEN 20 ELSE 0 END
    ),
    tts_preview_credits_remaining = LEAST(
      tts_preview_credits_remaining + CASE WHEN p_credit = 'tts_preview' THEN 1 ELSE 0 END,
      CASE tier WHEN 'creator' THEN 30 WHEN 'agency' THEN 60 ELSE 5 END
    ),
    audio_export_credits_remaining = LEAST(
      audio_export_credits_remaining + CASE WHEN p_credit = 'audio_export' THEN 1 ELSE 0 END,
      CASE tier WHEN 'creator' THEN 5 WHEN 'agency' THEN 15 ELSE 0 END
    ),
    updated_at = NOW()
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'user_not_found' USING HINT = p_user_id::TEXT;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.restore_credit(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.restore_credit(uuid, text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.restore_credit(uuid, text) TO service_role;

-- Restore credits for campaigns that failed before slides were saved.
DO $$
DECLARE
  r RECORD;
  marked_id UUID;
BEGIN
  FOR r IN
    SELECT c.id, c.user_id
    FROM public.campaigns c
    WHERE c.status = 'failed'
      AND NOT c.creation_credit_refunded
      AND NOT EXISTS (
        SELECT 1 FROM public.slides s WHERE s.campaign_id = c.id
      )
  LOOP
    UPDATE public.campaigns
    SET creation_credit_refunded = TRUE
    WHERE id = r.id
      AND user_id = r.user_id
      AND NOT creation_credit_refunded
    RETURNING id INTO marked_id;

    IF marked_id IS NOT NULL THEN
      PERFORM public.restore_credit(r.user_id, 'campaign');
      INSERT INTO public.usage_events (user_id, event_type, metadata)
      VALUES (
        r.user_id,
        'campaign_refunded',
        jsonb_build_object('campaign_id', r.id)
      );
    END IF;
  END LOOP;
END $$;
