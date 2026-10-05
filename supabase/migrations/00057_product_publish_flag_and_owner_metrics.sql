-- =============================================================================
-- TradeInDRC — Product management: hide/show flag + per-product owner metrics
-- Migration: 00057_product_publish_flag_and_owner_metrics.sql
-- =============================================================================
-- Two things the company dashboard's product pages need:
--
-- 1. `products.is_published` — a seller must be able to take a product off the
--    marketplace (out of stock, being reworked) without deleting it. Until now
--    the only way to hide a product was to delete it and lose its page.
--    Enforced where visibility already is, in the public-read policy: a
--    product is public when its company is verified AND it is published. The
--    owner and staff keep seeing it either way. Every public query (listing,
--    detail, home, sectors, global_search — a SECURITY INVOKER function) goes
--    through this policy, so no query needs its own filter.
--
-- 2. `owner_product_metrics(p_days)` — views per product. Owners cannot read
--    `analytics_events` (admin-only, 00001), and `owner_dashboard_metrics`
--    (00052) only returns the top 5 products; the product list and the product
--    detail page need the figure for EVERY product, with its daily series.

-- ---------------------------------------------------------------------------
-- 1. Publish flag
-- ---------------------------------------------------------------------------
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.products.is_published IS
  'Seller''s own switch: false hides the product from the marketplace without deleting it. Public = company verified AND is_published.';

DROP POLICY IF EXISTS "products_public_read_verified_company" ON public.products;
CREATE POLICY "products_public_read_verified_company"
  ON public.products FOR SELECT
  USING (
    (
      products.is_published
      AND EXISTS (
        SELECT 1 FROM public.companies c
        WHERE c.id = products.company_id AND c.status = 'verified'
      )
    )
    OR EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = products.company_id AND c.owner_id = auth.uid()
    )
    OR public.is_admin()
  );

-- ---------------------------------------------------------------------------
-- 2. Per-product metrics for the owner
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.owner_product_metrics(p_days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid        uuid := auth.uid();
  v_days       integer := LEAST(GREATEST(COALESCE(p_days, 30), 7), 90);
  v_today      timestamptz := date_trunc('day', now());
  v_start      timestamptz;
  v_prev_start timestamptz;
  v_result     jsonb;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501';
  END IF;

  v_start      := v_today - make_interval(days => v_days - 1);
  v_prev_start := v_start - make_interval(days => v_days);

  WITH mine AS (
    SELECT p.id
      FROM public.products p
      JOIN public.companies c ON c.id = p.company_id
     WHERE c.owner_id = v_uid
  ),
  events AS (
    SELECT e.entity_id AS product_id, e.event_type, e.created_at
      FROM public.analytics_events e
     WHERE e.entity_type = 'product'
       AND e.event_type IN ('view', 'search_appearance')
       AND e.created_at >= v_prev_start
       AND e.entity_id IN (SELECT id FROM mine)
  ),
  days AS (
    SELECT generate_series(v_start, v_today, interval '1 day') AS day
  ),
  per_product AS (
    SELECT m.id AS product_id,
           (SELECT count(*) FROM events e
             WHERE e.product_id = m.id AND e.event_type = 'view' AND e.created_at >= v_start) AS views,
           (SELECT count(*) FROM events e
             WHERE e.product_id = m.id AND e.event_type = 'view' AND e.created_at < v_start) AS previous_views,
           (SELECT count(*) FROM events e
             WHERE e.product_id = m.id AND e.event_type = 'search_appearance' AND e.created_at >= v_start) AS search_appearances,
           (SELECT jsonb_agg(
                     (SELECT count(*) FROM events e
                       WHERE e.product_id = m.id AND e.event_type = 'view'
                         AND e.created_at >= d.day AND e.created_at < d.day + interval '1 day')
                     ORDER BY d.day)
              FROM days d) AS series
      FROM mine m
  )
  SELECT jsonb_build_object(
           'period_days',   v_days,
           'current_start', v_start,
           'products',      COALESCE(jsonb_object_agg(
                              pp.product_id::text,
                              jsonb_build_object(
                                'views', pp.views,
                                'previous_views', pp.previous_views,
                                'search_appearances', pp.search_appearances,
                                'series', pp.series)), '{}'::jsonb))
    INTO v_result
    FROM per_product pp;

  RETURN v_result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.owner_product_metrics(integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.owner_product_metrics(integer) FROM anon;
GRANT  EXECUTE ON FUNCTION public.owner_product_metrics(integer) TO authenticated;

COMMENT ON FUNCTION public.owner_product_metrics(integer) IS
  'Per-product views / search appearances + daily view series for auth.uid()''s own products (00057). Counts only, never event rows.';
