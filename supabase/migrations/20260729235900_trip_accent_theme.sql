ALTER TABLE public.trips
ADD COLUMN IF NOT EXISTS accent_theme text NOT NULL DEFAULT 'ochre';

ALTER TABLE public.trips
DROP CONSTRAINT IF EXISTS trips_accent_theme_check;

ALTER TABLE public.trips
ADD CONSTRAINT trips_accent_theme_check
CHECK (accent_theme IN ('ochre', 'forest', 'ocean', 'terracotta', 'plum'));