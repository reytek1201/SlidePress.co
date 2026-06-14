-- Track campaign creations as append-only usage events so deleting
-- campaigns cannot bypass the monthly creation limit.

ALTER TABLE public.usage_events
  DROP CONSTRAINT IF EXISTS usage_events_event_type_check;

ALTER TABLE public.usage_events
  ADD CONSTRAINT usage_events_event_type_check
  CHECK (event_type IN ('slide_regenerated', 'campaign_created'));

-- Backfill creations from this month so existing usage counts stay accurate.
INSERT INTO public.usage_events (user_id, event_type, created_at)
SELECT user_id, 'campaign_created', created_at
FROM public.campaigns
WHERE created_at >= date_trunc('month', NOW() AT TIME ZONE 'UTC');
