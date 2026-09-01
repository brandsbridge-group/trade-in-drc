-- 00008_data_hub.sql
-- Data Hub: reports (market_report | legal_guide | regulation) + price time-series

-- ---------------------------------------------------------------------------
-- reports
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reports (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  kind          text        NOT NULL CHECK (kind IN ('market_report','legal_guide','regulation')),
  slug          text        NOT NULL,
  title_en      text        NOT NULL,
  title_fr      text        NOT NULL,
  summary_en    text,
  summary_fr    text,
  body_en       text        NOT NULL DEFAULT '',
  body_fr       text        NOT NULL DEFAULT '',
  attachment_url text,
  sector_id     uuid        REFERENCES public.sectors(id) ON DELETE SET NULL,
  status        text        NOT NULL DEFAULT 'draft'
                              CHECK (status IN ('draft','published','archived')),
  published_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kind, slug)
);

-- Partial index for public listing queries
CREATE INDEX IF NOT EXISTS reports_pub_idx
  ON public.reports (kind, status, published_at DESC NULLS LAST)
  WHERE status = 'published';

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reports_public_read" ON public.reports
  FOR SELECT USING (status = 'published');

CREATE POLICY "reports_admin_all" ON public.reports
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- updated_at trigger (reuses shared touch_updated_at function)
DROP TRIGGER IF EXISTS reports_updated ON public.reports;
CREATE TRIGGER reports_updated
  BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Auto-set published_at when status flips to 'published'
CREATE OR REPLACE FUNCTION public.reports_published_at_guard()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'published' AND NEW.published_at IS NULL THEN
    NEW.published_at = now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reports_published_at ON public.reports;
CREATE TRIGGER reports_published_at
  BEFORE INSERT OR UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.reports_published_at_guard();

-- ---------------------------------------------------------------------------
-- price_series
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.price_series (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  commodity_en  text        NOT NULL,
  commodity_fr  text        NOT NULL,
  unit          text        NOT NULL,
  currency      text        NOT NULL DEFAULT 'USD',
  sector_id     uuid        REFERENCES public.sectors(id) ON DELETE SET NULL,
  source        text,
  status        text        NOT NULL DEFAULT 'published'
                              CHECK (status IN ('draft','published','archived')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.price_series ENABLE ROW LEVEL SECURITY;

CREATE POLICY "price_series_public_read" ON public.price_series
  FOR SELECT USING (status = 'published');

CREATE POLICY "price_series_admin_all" ON public.price_series
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP TRIGGER IF EXISTS price_series_updated ON public.price_series;
CREATE TRIGGER price_series_updated
  BEFORE UPDATE ON public.price_series
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- price_points
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.price_points (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id   uuid        NOT NULL REFERENCES public.price_series(id) ON DELETE CASCADE,
  observed_at timestamptz NOT NULL,
  value       numeric     NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (series_id, observed_at)
);

CREATE INDEX IF NOT EXISTS price_points_series_observed_idx
  ON public.price_points (series_id, observed_at);

ALTER TABLE public.price_points ENABLE ROW LEVEL SECURITY;

-- Public read gated by parent series.status = 'published'
CREATE POLICY "price_points_public_read" ON public.price_points
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.price_series s
      WHERE s.id = series_id AND s.status = 'published'
    )
  );

CREATE POLICY "price_points_admin_all" ON public.price_points
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
