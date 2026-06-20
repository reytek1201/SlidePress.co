-- Track granted OAuth scopes per platform connection (server-side only).

ALTER TABLE public.platform_connections
  ADD COLUMN IF NOT EXISTS scopes text;
