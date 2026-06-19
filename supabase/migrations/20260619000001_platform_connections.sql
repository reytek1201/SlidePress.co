-- Platform OAuth connections for direct posting (YouTube Phase 0)

CREATE TABLE public.platform_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('youtube')),
  access_token text NOT NULL,
  refresh_token text,
  expires_at timestamptz NOT NULL,
  account_external_id text NOT NULL,
  account_label text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT platform_connections_user_platform_unique UNIQUE (user_id, platform)
);

CREATE INDEX platform_connections_user_id_idx
  ON public.platform_connections(user_id);

CREATE TRIGGER platform_connections_set_updated_at
  BEFORE UPDATE ON public.platform_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.platform_connections ENABLE ROW LEVEL SECURITY;

-- Users may read their own connection metadata (tokens only used server-side via service role).
CREATE POLICY platform_connections_select_own ON public.platform_connections
  FOR SELECT
  USING (auth.uid() = user_id);
