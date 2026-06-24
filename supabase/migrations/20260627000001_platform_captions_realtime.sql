-- Enable realtime updates when platform captions are inserted or updated.
ALTER PUBLICATION supabase_realtime ADD TABLE public.platform_captions;
