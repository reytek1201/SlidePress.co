-- Idempotency store for RevenueCat webhook events.
-- Prevents double-processing replayed events (e.g. double credit refills on RENEWAL).

CREATE TABLE public.revenuecat_processed_events (
  event_id      TEXT        PRIMARY KEY,
  processed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- No RLS needed — service role only. Never exposed to client.
