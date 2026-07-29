ALTER TABLE public.trip_days
  ADD COLUMN IF NOT EXISTS cover_image_url text,
  ADD COLUMN IF NOT EXISTS cover_image_alt text,
  ADD COLUMN IF NOT EXISTS cover_photographer_name text,
  ADD COLUMN IF NOT EXISTS cover_photographer_url text,
  ADD COLUMN IF NOT EXISTS cover_source_url text;

UPDATE public.trip_days AS day
SET
  cover_image_url = trip.cover_image_url,
  cover_image_alt = trip.cover_image_alt,
  cover_photographer_name = trip.cover_photographer_name,
  cover_photographer_url = trip.cover_photographer_url,
  cover_source_url = trip.cover_source_url
FROM public.trips AS trip
WHERE day.trip_id = trip.id
  AND day.day_index = 0
  AND day.cover_image_url IS NULL
  AND trip.cover_image_url IS NOT NULL;