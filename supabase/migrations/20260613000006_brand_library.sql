-- Saved brand reference images (one row per user)

CREATE TABLE public.brand_library (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  product_reference_url TEXT,
  style_reference_url TEXT,
  logo_reference_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER brand_library_set_updated_at
  BEFORE UPDATE ON public.brand_library
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.brand_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY brand_library_select_own ON public.brand_library
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY brand_library_insert_own ON public.brand_library
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY brand_library_update_own ON public.brand_library
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY brand_library_delete_own ON public.brand_library
  FOR DELETE
  USING (auth.uid() = user_id);
