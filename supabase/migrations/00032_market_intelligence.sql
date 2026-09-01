-- 00032: market-intelligence data layer for the Data Hub (design 11).
-- KPI cards, the monthly trade-value trend (line chart) and sector activity
-- (bar chart). Companies-by-sector (donut) and provincial coverage (map) are
-- derived live from companies. All public-read; writes are admin/service-role.

-- KPI cards: Total Trade Value / Exports / Imports / Active Companies.
CREATE TABLE IF NOT EXISTS public.market_metrics (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key            TEXT NOT NULL UNIQUE,
  label_en       TEXT NOT NULL,
  label_fr       TEXT NOT NULL,
  value_display  TEXT NOT NULL,
  value_numeric  NUMERIC,
  delta_pct      NUMERIC,
  period_en      TEXT,
  period_fr      TEXT,
  sort_order     INT NOT NULL DEFAULT 0,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Monthly trade-value trend (exports vs imports), USD billions.
CREATE TABLE IF NOT EXISTS public.trade_series (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month        DATE NOT NULL UNIQUE,
  exports_usd  NUMERIC NOT NULL,
  imports_usd  NUMERIC NOT NULL
);

-- Sector activity (trade value in USD billions) for the bar chart.
CREATE TABLE IF NOT EXISTS public.sector_activity (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label_en         TEXT NOT NULL,
  label_fr         TEXT NOT NULL,
  trade_value_usd  NUMERIC NOT NULL,
  sort_order       INT NOT NULL DEFAULT 0
);

ALTER TABLE public.market_metrics  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_series    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sector_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "market_metrics_public_read"  ON public.market_metrics;
DROP POLICY IF EXISTS "trade_series_public_read"    ON public.trade_series;
DROP POLICY IF EXISTS "sector_activity_public_read" ON public.sector_activity;
CREATE POLICY "market_metrics_public_read"  ON public.market_metrics  FOR SELECT USING (true);
CREATE POLICY "trade_series_public_read"    ON public.trade_series    FOR SELECT USING (true);
CREATE POLICY "sector_activity_public_read" ON public.sector_activity FOR SELECT USING (true);
