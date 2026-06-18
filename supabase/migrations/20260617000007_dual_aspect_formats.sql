-- Per-aspect slide images + optional secondary format on campaigns

ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS secondary_aspect_ratio aspect_ratio_type,
  ADD COLUMN IF NOT EXISTS image_generation_aspect aspect_ratio_type;

CREATE TABLE IF NOT EXISTS public.slide_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slide_id uuid NOT NULL REFERENCES public.slides(id) ON DELETE CASCADE,
  aspect_ratio aspect_ratio_type NOT NULL,
  image_url text,
  fal_request_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (slide_id, aspect_ratio)
);

CREATE INDEX IF NOT EXISTS slide_images_slide_id_idx
  ON public.slide_images (slide_id);

CREATE INDEX IF NOT EXISTS slide_images_fal_request_id_idx
  ON public.slide_images (fal_request_id)
  WHERE fal_request_id IS NOT NULL;

-- Backfill primary-format images from legacy slides columns
INSERT INTO public.slide_images (slide_id, aspect_ratio, image_url, fal_request_id)
SELECT
  s.id,
  c.aspect_ratio,
  s.image_url,
  s.fal_request_id
FROM public.slides s
JOIN public.campaigns c ON c.id = s.campaign_id
WHERE s.image_url IS NOT NULL OR s.fal_request_id IS NOT NULL
ON CONFLICT (slide_id, aspect_ratio) DO NOTHING;

ALTER TABLE public.slide_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY slide_images_select_own ON public.slide_images
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.slides
      JOIN public.campaigns ON campaigns.id = slides.campaign_id
      WHERE slides.id = slide_images.slide_id
        AND campaigns.user_id = auth.uid()
    )
  );

CREATE POLICY slide_images_insert_own ON public.slide_images
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.slides
      JOIN public.campaigns ON campaigns.id = slides.campaign_id
      WHERE slides.id = slide_images.slide_id
        AND campaigns.user_id = auth.uid()
    )
  );

CREATE POLICY slide_images_update_own ON public.slide_images
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.slides
      JOIN public.campaigns ON campaigns.id = slides.campaign_id
      WHERE slides.id = slide_images.slide_id
        AND campaigns.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.slides
      JOIN public.campaigns ON campaigns.id = slides.campaign_id
      WHERE slides.id = slide_images.slide_id
        AND campaigns.user_id = auth.uid()
    )
  );

CREATE POLICY slide_images_delete_own ON public.slide_images
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.slides
      JOIN public.campaigns ON campaigns.id = slides.campaign_id
      WHERE slides.id = slide_images.slide_id
        AND campaigns.user_id = auth.uid()
    )
  );

ALTER PUBLICATION supabase_realtime ADD TABLE public.slide_images;
