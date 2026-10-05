-- 00059_console_dashboard_metrics.sql
--
-- Staff console home: one aggregate covering what the platform actually does.
--
-- Problem: the console dashboard read `companies` and `analytics_events` row by
-- row from the browser and counted there. Three consequences:
--   1. PostgREST caps a read at 1000 rows, so totals silently stopped growing.
--   2. `analytics_events_admin_read` (00001) only lets legacy role = 'admin'
--      through; a moderator or super-admin identified by `staff_role` (00013)
--      read zero events and saw 0 views / 0 contacts.
--   3. It only knew about companies: products, opportunities, requests, premium
--      and messaging — most of the product — were absent.
--
-- Fix: a SECURITY DEFINER aggregate gated on is_admin() (any staff member).
-- It returns counts, daily series and short ranked lists only — never raw
-- events, so visitor_id never leaves the database.
--
-- Window: the current period is the last p_days calendar days including today
-- (UTC); the previous period is the p_days before it. p_days is clamped to 7..90.
-- "Congolese" follows 00035/00051: country is NULL or the DRC.

CREATE OR REPLACE FUNCTION public.console_dashboard_metrics(p_days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  c_home       constant text := 'democratic republic of the congo';
  v_days       integer := LEAST(GREATEST(COALESCE(p_days, 30), 7), 90);
  v_today      timestamptz := date_trunc('day', now());
  v_start      timestamptz;
  v_prev_start timestamptz;
  v_metrics    jsonb;
  v_queue      jsonb;
  v_funnel     jsonb;
  v_reviews    jsonb;
  v_totals     jsonb;
  v_origin     jsonb;
  v_sectors    jsonb;
  v_categories jsonb;
  v_premium    jsonb;
  v_top        jsonb;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not_authorized' USING ERRCODE = '42501';
  END IF;

  v_start      := v_today - make_interval(days => v_days - 1);
  v_prev_start := v_start - make_interval(days => v_days);

  -- ---- Counted metrics: current, previous and a daily series ---------------
  WITH ev AS (
    SELECT CASE WHEN c.country IS NULL OR lower(btrim(c.country)) = c_home
                THEN 'companies_drc' ELSE 'companies_intl' END AS metric,
           c.created_at
      FROM public.companies c WHERE c.created_at >= v_prev_start
    UNION ALL
    SELECT 'users', p.created_at
      FROM public.profiles p WHERE p.created_at >= v_prev_start
    UNION ALL
    SELECT 'products', p.created_at
      FROM public.products p WHERE p.created_at >= v_prev_start
    UNION ALL
    SELECT 'opportunities', o.published_at
      FROM public.opportunities o
     WHERE o.published_at >= v_prev_start AND o.status IN ('published', 'expired')
    UNION ALL
    SELECT 'conversations', c.created_at
      FROM public.conversations c WHERE c.created_at >= v_prev_start
    UNION ALL
    SELECT 'responses', r.created_at
      FROM public.opportunity_responses r WHERE r.created_at >= v_prev_start
    UNION ALL
    SELECT CASE
             WHEN e.entity_type = 'company' AND e.event_type IN ('view', 'profile_view') THEN 'profile_views'
             WHEN e.entity_type = 'product' AND e.event_type = 'view'                     THEN 'product_views'
             WHEN e.event_type = 'search_appearance'                                      THEN 'search_appearances'
             WHEN e.event_type = 'contact_request'                                        THEN 'contact_requests'
           END,
           e.created_at
      FROM public.analytics_events e WHERE e.created_at >= v_prev_start
  ),
  names(metric) AS (
    VALUES ('companies_drc'), ('companies_intl'), ('users'), ('products'), ('opportunities'),
           ('conversations'), ('responses'), ('profile_views'), ('product_views'),
           ('search_appearances'), ('contact_requests')
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

  -- ---- Verification circuit: whose turn it is (same rule as reviewStage()) --
  WITH staged AS (
    SELECT c.id, c.status, c.created_at,
           (SELECT r.decision FROM public.verification_reviews r
             WHERE r.company_id = c.id ORDER BY r.created_at DESC LIMIT 1) AS last_decision,
           (SELECT max(r.created_at) FROM public.verification_reviews r
             WHERE r.company_id = c.id AND r.decision IN ('submitted', 'resubmitted')) AS last_sent
      FROM public.companies c
  ),
  labelled AS (
    SELECT *,
           CASE
             WHEN status = 'verified' THEN 'verified'
             WHEN status = 'rejected' THEN 'rejected'
             WHEN status = 'pending_documents' THEN 'not_submitted'
             WHEN last_decision = 'more_info_requested' THEN 'awaiting_owner'
             ELSE 'to_review'
           END AS stage
      FROM staged
  )
  SELECT jsonb_build_object(
           'registered',     count(*),
           'submitted',      count(*) FILTER (WHERE stage <> 'not_submitted'),
           'verified',       count(*) FILTER (WHERE stage = 'verified'),
           'rejected',       count(*) FILTER (WHERE stage = 'rejected'),
           'not_submitted',  count(*) FILTER (WHERE stage = 'not_submitted'),
           'to_review',      count(*) FILTER (WHERE stage = 'to_review'),
           'awaiting_owner', count(*) FILTER (WHERE stage = 'awaiting_owner'),
           'oldest_to_review', min(COALESCE(last_sent, created_at)) FILTER (WHERE stage = 'to_review'))
    INTO v_funnel
    FROM labelled;

  -- Staff decisions in the period, and how long the file waited for each one.
  WITH decisions AS (
    SELECT r.decision, r.created_at,
           (SELECT max(s.created_at) FROM public.verification_reviews s
             WHERE s.company_id = r.company_id
               AND s.decision IN ('submitted', 'resubmitted')
               AND s.created_at < r.created_at) AS sent_at
      FROM public.verification_reviews r
     WHERE r.decision IN ('approved', 'rejected', 'more_info_requested')
       AND r.created_at >= v_start
  )
  SELECT jsonb_build_object(
           'approved',  count(*) FILTER (WHERE decision = 'approved'),
           'rejected',  count(*) FILTER (WHERE decision = 'rejected'),
           'more_info', count(*) FILTER (WHERE decision = 'more_info_requested'),
           'median_decision_hours',
             round((percentile_cont(0.5) WITHIN GROUP (
               ORDER BY extract(epoch FROM created_at - sent_at) / 3600.0)
               FILTER (WHERE sent_at IS NOT NULL))::numeric, 1))
    INTO v_reviews
    FROM decisions;

  -- ---- Moderation queue: everything waiting on staff, with its oldest item --
  SELECT jsonb_build_object(
    'verifications', jsonb_build_object(
      'count', v_funnel -> 'to_review', 'oldest', v_funnel -> 'oldest_to_review'),
    'opportunities', (SELECT jsonb_build_object('count', count(*), 'oldest', min(created_at))
                        FROM public.opportunities WHERE status = 'pending_review'),
    'requests',      (SELECT jsonb_build_object('count', count(*), 'oldest', min(created_at))
                        FROM public.business_requests WHERE status = 'new'),
    'premium',       (SELECT jsonb_build_object('count', count(*), 'oldest', min(created_at))
                        FROM public.premium_requests WHERE status = 'pending'),
    'reports',       (SELECT jsonb_build_object('count', count(*), 'oldest', min(created_at))
                        FROM public.message_reports WHERE status = 'open'))
    INTO v_queue;

  -- ---- Stock: what the platform holds today --------------------------------
  SELECT jsonb_build_object(
    'users',                   (SELECT count(*) FROM public.profiles),
    'products',                (SELECT count(*) FROM public.products),
    'products_published',      (SELECT count(*) FROM public.products WHERE is_published),
    'opportunities_published', (SELECT count(*) FROM public.opportunities WHERE status = 'published'),
    'conversations',           (SELECT count(*) FROM public.conversations))
    INTO v_totals;

  -- ---- Where companies come from --------------------------------------------
  WITH c AS (
    SELECT (country IS NULL OR lower(btrim(country)) = c_home) AS is_drc,
           NULLIF(btrim(country), '') AS country, NULLIF(btrim(province), '') AS province
      FROM public.companies
  )
  SELECT jsonb_build_object(
    'drc',  (SELECT count(*) FROM c WHERE is_drc),
    'intl', (SELECT count(*) FROM c WHERE NOT is_drc),
    'provinces', COALESCE((SELECT jsonb_agg(x ORDER BY x.count DESC, x.name) FROM (
        SELECT province AS name, count(*) AS count FROM c
         WHERE is_drc AND province IS NOT NULL GROUP BY province ORDER BY count(*) DESC, province LIMIT 5) x), '[]'::jsonb),
    'countries', COALESCE((SELECT jsonb_agg(x ORDER BY x.count DESC, x.name) FROM (
        SELECT country AS name, count(*) AS count FROM c
         WHERE NOT is_drc GROUP BY country ORDER BY count(*) DESC, country LIMIT 5) x), '[]'::jsonb))
    INTO v_origin;

  -- ---- Companies by sector ----------------------------------------------------
  SELECT COALESCE(jsonb_agg(x ORDER BY x.count DESC, x.name_en), '[]'::jsonb) INTO v_sectors
    FROM (
      SELECT s.id, s.name_en, s.name_fr, count(*) AS count,
             count(*) FILTER (WHERE c.status = 'verified') AS verified
        FROM public.companies c JOIN public.sectors s ON s.id = c.sector_id
       GROUP BY s.id ORDER BY count(*) DESC, s.name_en LIMIT 6
    ) x;

  -- ---- Opportunities by category ----------------------------------------------
  SELECT COALESCE(jsonb_agg(x ORDER BY x.published DESC, x.category), '[]'::jsonb) INTO v_categories
    FROM (
      SELECT o.category,
             count(*) FILTER (WHERE o.status = 'published') AS published,
             count(*) FILTER (WHERE o.status = 'pending_review') AS pending,
             (SELECT count(*) FROM public.opportunity_responses r
                JOIN public.opportunities o2 ON o2.id = r.opportunity_id
               WHERE o2.category = o.category AND r.created_at >= v_start) AS responses
        FROM public.opportunities o
       WHERE o.status IN ('published', 'pending_review')
       GROUP BY o.category
    ) x;

  -- ---- Premium ----------------------------------------------------------------
  SELECT jsonb_build_object(
    'active', (SELECT count(*) FROM public.companies
                WHERE is_premium AND (premium_expires_at IS NULL OR premium_expires_at > now())),
    'expiring_30d', (SELECT count(*) FROM public.companies
                      WHERE is_premium AND premium_expires_at > now()
                        AND premium_expires_at <= now() + interval '30 days'),
    'by_plan', COALESCE((SELECT jsonb_agg(x ORDER BY x.count DESC, x.plan) FROM (
        SELECT premium_plan AS plan, count(*) AS count FROM public.companies
         WHERE is_premium AND premium_plan IS NOT NULL
           AND (premium_expires_at IS NULL OR premium_expires_at > now())
         GROUP BY premium_plan) x), '[]'::jsonb),
    'approved_count',  (SELECT count(*) FROM public.premium_requests
                         WHERE status = 'approved' AND reviewed_at >= v_start),
    'approved_amount_usd', (SELECT COALESCE(sum(amount_usd), 0) FROM public.premium_requests
                             WHERE status = 'approved' AND reviewed_at >= v_start))
    INTO v_premium;

  -- ---- Most viewed companies in the period -------------------------------------
  SELECT COALESCE(jsonb_agg(x ORDER BY x.views DESC, x.name), '[]'::jsonb) INTO v_top
    FROM (
      SELECT c.id, c.name, c.status,
             count(*) FILTER (WHERE e.event_type IN ('view', 'profile_view')) AS views,
             count(*) FILTER (WHERE e.event_type = 'contact_request') AS contacts
        FROM public.analytics_events e
        JOIN public.companies c ON c.id = e.entity_id
       WHERE e.entity_type = 'company' AND e.created_at >= v_start
         AND e.event_type IN ('view', 'profile_view', 'contact_request')
       GROUP BY c.id
      HAVING count(*) FILTER (WHERE e.event_type IN ('view', 'profile_view')) > 0
       ORDER BY 4 DESC, c.name
       LIMIT 5
    ) x;

  RETURN jsonb_build_object(
    'period_days',    v_days,
    'current_start',  v_start,
    'previous_start', v_prev_start,
    'metrics',        v_metrics,
    'queue',          v_queue,
    'funnel',         v_funnel - 'oldest_to_review',
    'reviews',        v_reviews,
    'totals',         v_totals,
    'origin',         v_origin,
    'sectors',        v_sectors,
    'categories',     v_categories,
    'premium',        v_premium,
    'top_companies',  v_top
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.console_dashboard_metrics(integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.console_dashboard_metrics(integer) FROM anon;
GRANT  EXECUTE ON FUNCTION public.console_dashboard_metrics(integer) TO authenticated;

COMMENT ON FUNCTION public.console_dashboard_metrics(integer) IS
  'Staff console home aggregates (is_admin() only): period counts + daily series, moderation queue, verification funnel, origin/sector/category breakdowns, premium (00059).';
