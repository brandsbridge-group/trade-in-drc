-- 00048_carousel_slides_placement.sql
--
-- The marketplace landing (/market) gets its own advertising carousel in the
-- hero, curated by admins separately from the homepage carousel. Rather than a
-- second table, slides gain a placement: 'home' (the existing homepage
-- carousel, and the backfill for every current row) or 'market'.
--
-- RLS is unchanged: the public still reads active slides only (00016); the
-- placement is just a filter the pages apply.

ALTER TABLE public.carousel_slides
  ADD COLUMN IF NOT EXISTS placement text NOT NULL DEFAULT 'home';

ALTER TABLE public.carousel_slides
  DROP CONSTRAINT IF EXISTS carousel_slides_placement_check;
ALTER TABLE public.carousel_slides
  ADD CONSTRAINT carousel_slides_placement_check
  CHECK (placement IN ('home', 'market'));

-- Public reads are "active slides for one placement, in order".
CREATE INDEX IF NOT EXISTS carousel_slides_placement_order_idx
  ON public.carousel_slides (placement, sort_order)
  WHERE active;

COMMENT ON COLUMN public.carousel_slides.placement IS
  'Where the slide runs: home (homepage carousel) or market (marketplace hero ads).';
