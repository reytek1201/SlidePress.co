-- One-time clamp: legacy v1 credit balances may exceed v2 tier caps in usage_balances
-- (v2 migration updated apply_tier_entitlement() but did not rewrite existing rows).
-- Must stay in sync with utils/plan-limits.ts PLAN_LIMITS and apply_tier_entitlement().

UPDATE public.usage_balances
SET
  campaign_credits_remaining = LEAST(
    campaign_credits_remaining,
    CASE tier WHEN 'creator' THEN 10 WHEN 'agency' THEN 30 ELSE 3 END
  ),
  regeneration_credits_remaining = LEAST(
    regeneration_credits_remaining,
    CASE tier WHEN 'creator' THEN 20 WHEN 'agency' THEN 60 ELSE 10 END
  ),
  video_credits_remaining = LEAST(
    video_credits_remaining,
    CASE tier WHEN 'creator' THEN 10 WHEN 'agency' THEN 20 ELSE 0 END
  ),
  tts_preview_credits_remaining = LEAST(
    tts_preview_credits_remaining,
    CASE tier WHEN 'creator' THEN 30 WHEN 'agency' THEN 60 ELSE 5 END
  ),
  audio_export_credits_remaining = LEAST(
    audio_export_credits_remaining,
    CASE tier WHEN 'creator' THEN 5 WHEN 'agency' THEN 15 ELSE 0 END
  ),
  updated_at = NOW()
WHERE
  campaign_credits_remaining > CASE tier WHEN 'creator' THEN 10 WHEN 'agency' THEN 30 ELSE 3 END
  OR regeneration_credits_remaining > CASE tier WHEN 'creator' THEN 20 WHEN 'agency' THEN 60 ELSE 10 END
  OR video_credits_remaining > CASE tier WHEN 'creator' THEN 10 WHEN 'agency' THEN 20 ELSE 0 END
  OR tts_preview_credits_remaining > CASE tier WHEN 'creator' THEN 30 WHEN 'agency' THEN 60 ELSE 5 END
  OR audio_export_credits_remaining > CASE tier WHEN 'creator' THEN 5 WHEN 'agency' THEN 15 ELSE 0 END;
