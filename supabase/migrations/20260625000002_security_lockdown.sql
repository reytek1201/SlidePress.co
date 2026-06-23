-- Security hardening (Supabase advisor):
-- 1. Billing RPCs: service_role only (block client tier/credit manipulation).
-- 2. campaign-refs: stop public bucket listing; owners can still read via API.
-- 3. set_updated_at: pin search_path.

-- ─── Billing RPCs ─────────────────────────────────────────────────────────────

REVOKE ALL ON FUNCTION public.consume_credit(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.consume_credit(uuid, text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_credit(uuid, text) TO service_role;

REVOKE ALL ON FUNCTION public.apply_tier_entitlement(uuid, text, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.apply_tier_entitlement(uuid, text, timestamptz) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_tier_entitlement(uuid, text, timestamptz) TO service_role;

REVOKE ALL ON FUNCTION public.handle_new_user_usage_balance() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user_usage_balance() FROM anon, authenticated;

-- Trigger-only; signup trigger still runs as SECURITY DEFINER owner.

-- ─── Storage: campaign-refs listing ───────────────────────────────────────────
-- Bucket stays public so getPublicUrl() keeps working for image gen + <img src>.
-- Remove world-readable list/select via Storage API.

DROP POLICY IF EXISTS campaign_refs_select_public ON storage.objects;

CREATE POLICY campaign_refs_select_own ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'campaign-refs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ─── Trigger helper: search_path ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;
