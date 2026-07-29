ALTER TABLE public.trip_days
  ADD COLUMN IF NOT EXISTS cover_position_y integer NOT NULL DEFAULT 50
    CHECK (cover_position_y BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS cover_crop_locked boolean NOT NULL DEFAULT true;