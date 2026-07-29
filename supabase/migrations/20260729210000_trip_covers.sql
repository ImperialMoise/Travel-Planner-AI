ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS cover_image_url text,
  ADD COLUMN IF NOT EXISTS cover_image_alt text,
  ADD COLUMN IF NOT EXISTS cover_photographer_name text,
  ADD COLUMN IF NOT EXISTS cover_photographer_url text,
  ADD COLUMN IF NOT EXISTS cover_source_url text;

CREATE TABLE IF NOT EXISTS public.trip_cover_search_cache (
  cache_key text PRIMARY KEY,
  query text NOT NULL,
  results jsonb NOT NULL DEFAULT '[]'::jsonb,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.trip_cover_search_cache ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.trip_cover_search_cache FROM anon, authenticated;
GRANT ALL ON TABLE public.trip_cover_search_cache TO service_role;