-- 00052_owner_dashboard_metrics.sql
--
-- Company-dashboard analytics that actually reach the company.
--
-- Problem: analytics_events has a single SELECT policy, `analytics_events_admin_read`
-- (00001), restricted to legacy role = 'admin'. Every owner-side read of the table
-- (dashboard home StatsRow, /dashboard/analytics) therefore returned zero rows
-- under RLS, so companies always saw 0 views / 0 contacts whatever happened.
-- On top of that the home page counted product views by company id (they are
-- stored against the product id) and counted all-time totals in the browser,
-- capped at PostgREST's 1000-row default.
--
-- Fix: one SECURITY DEFINER aggregate, scoped to auth.uid()'s own companies and
-- products. It returns counts and daily series only — never raw rows, so
-- visitor_id never leaves the database — which is why this is a function rather
-- than an owner SELECT policy on analytics_events.
--
-- Window: the current period is the last p_days calendar days including today
-- (UTC); the previous period is the p_days before it. p_days is clamped to 7..90.

CREATE OR REPLACE FUNCTION public.owner_dashboard_metrics(p_days integer DEFAULT 30)
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
  v_companies  uuid[];
  v_products   uuid[];
  v_metrics    jsonb;
  v_outreach   jsonb;
  v_top_prod   jsonb;
  v_top_search jsonb;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501';
  END IF;

  v_start      := v_today - make_interval(days => v_days - 1);
  v_prev_start := v_start - make_interval(days => v_days);

  SELECT COALESCE(array_agg(id), '{}') INTO v_companies
    FROM public.companies WHERE owner_id = v_uid;
  SELECT COALESCE(array_agg(id), '{}') INTO v_products
    FROM public.products WHERE company_id = ANY (v_companies);

  -- ---- Counted metrics: current, previous and a daily series ---------------
  WITH ev AS (
    SELECT CASE
             WHEN e.entity_type = 'company' AND e.event_type IN ('view', 'profile_view') THEN 'profile_views'
             WHEN e.entity_type = 'product' AND e.event_type = 'view'                     THEN 'product_views'
             WHEN e.event_type = 'search_appearance'                                      THEN 'search_appearances'
             WHEN e.entity_type = 'company' AND e.event_type = 'contact_request'          THEN 'contact_requests'
           END AS metric,
           e.created_at
      FROM public.analytics_events e
     WHERE e.created_at >= v_prev_start
       AND (   (e.entity_type = 'company' AND e.entity_id = ANY (v_companies))
            OR (e.entity_type = 'product' AND e.entity_id = ANY (v_products)))
    UNION ALL
    -- Responses other companies sent to this owner's opportunities.
    SELECT 'responses_received', r.created_at
      FROM public.opportunity_responses r
      JOIN public.opportunities o ON o.id = r.opportunity_id
     WHERE o.company_id = ANY (v_companies)
       AND r.responder_id <> v_uid
       AND r.created_at >= v_prev_start
  ),
  names(metric) AS (
    VALUES ('profile_views'), ('product_views'), ('search_appearances'),
           ('contact_requests'), ('responses_received')
  ),
  days AS (
    SELECT generate_series(v_start, v_today, interval '1 day') AS d
  ),
  daily AS (
    SELECT metric, date_trunc('day', created_at) AS d, count(*) AS n
      FROM ev WHERE created_at >= v_start AND metric IS NOT NULL
     GROUP BY 1, 2
  ),
  totals AS (
    SELECT n.metric,
           count(ev.created_at) FILTER (WHERE ev.created_at >= v_start) AS cur,
           count(ev.created_at) FILTER (WHERE ev.created_at <  v_start) AS prev
      FROM names n LEFT JOIN ev ON ev.metric = n.metric
     GROUP BY n.metric
  ),
  series AS (
    SELECT n.metric, jsonb_agg(COALESCE(daily.n, 0) ORDER BY days.d) AS s
      FROM names n CROSS JOIN days
      LEFT JOIN daily ON daily.metric = n.metric AND daily.d = days.d
     GROUP BY n.metric
  )
  SELECT jsonb_object_agg(
           t.metric,
           jsonb_build_object('current', t.cur, 'previous', t.prev, 'series', s.s))
    INTO v_metrics
    FROM totals t JOIN series s USING (metric);

  -- ---- Outreach: conversations this user started, and supplier replies -----
  WITH started AS (
    SELECT c.id, c.created_at,
           (SELECT min(m.created_at) FROM public.messages m
             WHERE m.conversation_id = c.id AND m.sender_id <> v_uid) AS first_reply_at
      FROM public.conversations c
     WHERE c.initiator_id = v_uid AND c.created_at >= v_start
  )
  SELECT jsonb_build_object(
           'started', count(*),
           'replied', count(first_reply_at),
           'median_reply_hours',
             round((percentile_cont(0.5) WITHIN GROUP (
               ORDER BY extract(epoch FROM first_reply_at - created_at) / 3600.0)
             )::numeric, 1))
    INTO v_outreach
    FROM started;

  -- ---- Top products by views in the current period -------------------------
  SELECT COALESCE(jsonb_agg(x ORDER BY x.views DESC), '[]'::jsonb) INTO v_top_prod
    FROM (
      SELECT p.id, p.name, p.name_en, p.name_fr, p.images[1] AS image, count(*) AS views
        FROM public.analytics_events e
        JOIN public.products p ON p.id = e.entity_id
       WHERE e.entity_type = 'product' AND e.event_type = 'view'
         AND e.entity_id = ANY (v_products) AND e.created_at >= v_start
       GROUP BY p.id
       ORDER BY count(*) DESC
       LIMIT 5
    ) x;

  -- ---- What buyers find through search (the query text is not stored) -------
  SELECT COALESCE(jsonb_agg(x ORDER BY x.appearances DESC), '[]'::jsonb) INTO v_top_search
    FROM (
      SELECT e.entity_type, e.entity_id,
             COALESCE(p.name_en, p.name, c.name) AS name_en,
             COALESCE(p.name_fr, p.name, c.name) AS name_fr,
             count(*) AS appearances
        FROM public.analytics_events e
        LEFT JOIN public.products  p ON e.entity_type = 'product' AND p.id = e.entity_id
        LEFT JOIN public.companies c ON e.entity_type = 'company' AND c.id = e.entity_id
       WHERE e.event_type = 'search_appearance' AND e.created_at >= v_start
         AND (   (e.entity_type = 'company' AND e.entity_id = ANY (v_companies))
              OR (e.entity_type = 'product' AND e.entity_id = ANY (v_products)))
       GROUP BY e.entity_type, e.entity_id, p.name_en, p.name_fr, p.name, c.name
       ORDER BY count(*) DESC
       LIMIT 6
    ) x;

  RETURN jsonb_build_object(
    'period_days',    v_days,
    'current_start',  v_start,
    'previous_start', v_prev_start,
    'metrics',        v_metrics,
    'outreach',       v_outreach,
    'top_products',   v_top_prod,
    'top_search',     v_top_search
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.owner_dashboard_metrics(integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.owner_dashboard_metrics(integer) FROM anon;
GRANT  EXECUTE ON FUNCTION public.owner_dashboard_metrics(integer) TO authenticated;

COMMENT ON FUNCTION public.owner_dashboard_metrics(integer) IS
  'Company dashboard aggregates for auth.uid()''s own companies/products: counts + daily series only (00052).';
