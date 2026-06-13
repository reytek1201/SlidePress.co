-- Row Level Security policies for Content Engine

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY campaigns_select_own ON public.campaigns
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY campaigns_insert_own ON public.campaigns
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY campaigns_update_own ON public.campaigns
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY campaigns_delete_own ON public.campaigns
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY slides_select_own ON public.slides
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = slides.campaign_id
        AND campaigns.user_id = auth.uid()
    )
  );

CREATE POLICY slides_insert_own ON public.slides
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = slides.campaign_id
        AND campaigns.user_id = auth.uid()
    )
  );

CREATE POLICY slides_update_own ON public.slides
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = slides.campaign_id
        AND campaigns.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = slides.campaign_id
        AND campaigns.user_id = auth.uid()
    )
  );

CREATE POLICY slides_delete_own ON public.slides
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = slides.campaign_id
        AND campaigns.user_id = auth.uid()
    )
  );

CREATE POLICY exports_select_own ON public.exports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = exports.campaign_id
        AND campaigns.user_id = auth.uid()
    )
  );

CREATE POLICY exports_insert_own ON public.exports
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = exports.campaign_id
        AND campaigns.user_id = auth.uid()
    )
  );

CREATE POLICY exports_update_own ON public.exports
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = exports.campaign_id
        AND campaigns.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = exports.campaign_id
        AND campaigns.user_id = auth.uid()
    )
  );

CREATE POLICY exports_delete_own ON public.exports
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = exports.campaign_id
        AND campaigns.user_id = auth.uid()
    )
  );
