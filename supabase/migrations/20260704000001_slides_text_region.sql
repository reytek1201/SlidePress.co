ALTER TABLE public.slides
  ADD COLUMN text_region jsonb;

COMMENT ON COLUMN public.slides.text_region IS
  'Best-effort headline placement hint from Gemini (position + background_tone). Phase 2 overlay applies legibility treatment regardless of accuracy.';
