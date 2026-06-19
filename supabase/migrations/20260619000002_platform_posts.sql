-- Platform publish job tracking (YouTube Phase 1)

CREATE TYPE platform_post_status AS ENUM (
  'pending',
  'uploading',
  'processing',
  'published',
  'failed'
);

CREATE TABLE public.platform_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('youtube')),
  export_id uuid REFERENCES public.exports(id) ON DELETE SET NULL,
  status platform_post_status NOT NULL DEFAULT 'pending',
  external_id text,
  external_url text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX platform_posts_user_id_idx ON public.platform_posts(user_id);
CREATE INDEX platform_posts_campaign_id_idx ON public.platform_posts(campaign_id);

CREATE TRIGGER platform_posts_set_updated_at
  BEFORE UPDATE ON public.platform_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.platform_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY platform_posts_select_own ON public.platform_posts
  FOR SELECT
  USING (auth.uid() = user_id);
