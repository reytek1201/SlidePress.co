-- Content Engine: initial schema

CREATE TYPE campaign_status_type AS ENUM (
  'idle',
  'generating_text',
  'generating_images',
  'completed',
  'failed'
);

CREATE TYPE export_type_enum AS ENUM (
  'zip',
  'video'
);

CREATE TYPE export_status_type AS ENUM (
  'pending',
  'processing',
  'completed',
  'failed'
);

CREATE TYPE aspect_ratio_type AS ENUM (
  '4:5',
  '9:16'
);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  title TEXT,
  target_audience TEXT,
  aspect_ratio aspect_ratio_type NOT NULL,
  status campaign_status_type NOT NULL DEFAULT 'idle',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_campaigns_user_id ON public.campaigns(user_id);

CREATE TRIGGER campaigns_set_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  slide_index INTEGER NOT NULL CHECK (slide_index >= 0),
  text_overlay TEXT,
  voiceover_script TEXT,
  image_prompt TEXT,
  image_url TEXT,
  fal_request_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT slides_campaign_id_slide_index_unique UNIQUE (campaign_id, slide_index)
);

CREATE INDEX idx_slides_campaign_id ON public.slides(campaign_id);

CREATE TRIGGER slides_set_updated_at
  BEFORE UPDATE ON public.slides
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  export_type export_type_enum NOT NULL,
  status export_status_type NOT NULL DEFAULT 'pending',
  output_url TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_exports_campaign_id ON public.exports(campaign_id);

CREATE TRIGGER exports_set_updated_at
  BEFORE UPDATE ON public.exports
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
