-- Enable realtime updates when platform captions are inserted or updated.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'platform_captions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.platform_captions;
  END IF;
END $$;
