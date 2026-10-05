-- 00067_statistics_by_user_type.sql
--
-- The two "Statistics" tabs, each reading what matters to the person in front
-- of it.
--
--   * /dashboard/analytics (a company owner) showed two counters and a news
--     feed. owner_analytics_details() adds what the home aggregate (00052) does
--     not carry: unique visitors, how fast the owner answers buyers, forwarded
--     requests, catalogue health, published opportunities and — for an owner
--     with several companies — the figures company by company.
--
--   * /console/analytics (staff) counted six rows in the browser, one of them
--     on the retired rfq_listings table. console_user_type_metrics() describes
--     the platform by type of user: Congolese companies, international
--     companies, accounts with no company yet, and the staff team itself.
--
-- Same rules as 00052 / 00059: SECURITY DEFINER, counts and short ranked lists
-- only (visitor_id and e-mail addresses never leave the database), the current
-- period is the last p_days calendar days including today (UTC), clamped to
-- 7..90, and "Congolese" means country is NULL or the DRC (00035 / 00051).

-- ---------------------------------------------------------------------------
-- 1. Company owner
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.owner_analytics_details(p_days integer DEFAULT 30)
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
  v_audience   jsonb;
  v_inbound    jsonb;
  v_requests   jsonb;
  v_catalogue  jsonb;
  v_opps       jsonb;
  v_by_company jsonb;
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

  -- ---- Audience: distinct visitors behind the profile and product views ----
  WITH v AS (
    SELECT e.visitor_id, e.created_at
      FROM public.analytics_events e
     WHERE e.created_at >= v_prev_start
       AND e.visitor_id IS NOT NULL
       AND (   (e.entity_type = 'company' AND e.event_type IN ('view', 'profile_view')
                AND e.entity_id = ANY (v_companies))
            OR (e.entity_type = 'product' AND e.event_type = 'view'
                AND e.entity_id = ANY (v_products)))
  ),
  cur AS (
    SELECT visitor_id, count(*) AS n FROM v WHERE created_at >= v_start GROUP BY visitor_id
  )
  SELECT jsonb_build_object(
           'visitors',          (SELECT count(*) FROM cur),
           'visitors_previous', (SELECT count(DISTINCT visitor_id) FROM v WHERE created_at < v_start),
           'repeat_visitors',   (SELECT count(*) FROM cur WHERE n > 1))
    INTO v_audience;

  -- ---- Responsiveness: conversations buyers opened, and the owner's answers -
  WITH inbound AS (
    SELECT c.id, c.created_at,
           (SELECT min(m.created_at) FROM public.messages m
             WHERE m.conversation_id = c.id AND m.sender_id = v_uid) AS replied_at
      FROM public.conversations c
     WHERE c.company_id = ANY (v_companies)
       AND c.initiator_id <> v_uid
       AND c.created_at >= v_start
  )
  SELECT jsonb_build_object(
           'received', count(*),
           'replied',  count(replied_at),
           'median_reply_hours',
             round((percentile_cont(0.5) WITHIN GROUP (
               ORDER BY extract(epoch FROM replied_at - created_at) / 3600.0)
             )::numeric, 1))
    INTO v_inbound
    FROM inbound;

  -- ---- Buyer requests the team forwarded (00062) ----------------------------
  SELECT jsonb_build_object(
           'current',  count(*) FILTER (WHERE br.forwarded_at >= v_start),
           'previous', count(*) FILTER (WHERE br.forwarded_at >= v_prev_start AND br.forwarded_at < v_start),
           'total',    count(*),
           'unopened', count(*) FILTER (WHERE br.supplier_seen_at IS NULL),
           'on_product', count(*) FILTER (WHERE br.forwarded_at >= v_start AND br.product_id IS NOT NULL))
    INTO v_requests
    FROM public.business_requests br
   WHERE br.forwarded_at IS NOT NULL
     AND br.target_company_id = ANY (v_companies);

  -- ---- Catalogue health -------------------------------------------------------
  SELECT jsonb_build_object(
           'products',   count(*),
           'published',  count(*) FILTER (WHERE p.is_published),
           'priced',     count(*) FILTER (WHERE p.price IS NOT NULL),
           'with_photo', count(*) FILTER (WHERE COALESCE(array_length(p.images, 1), 0) > 0),
           'viewed',     count(*) FILTER (WHERE EXISTS (
                           SELECT 1 FROM public.analytics_events e
                            WHERE e.entity_type = 'product' AND e.event_type = 'view'
                              AND e.entity_id = p.id AND e.created_at >= v_start)))
    INTO v_catalogue
    FROM public.products p
   WHERE p.company_id = ANY (v_companies);

  -- ---- Opportunities this owner published, and who answered ------------------
  SELECT jsonb_build_object(
    'published', (SELECT count(*) FROM public.opportunities o
                   WHERE o.company_id = ANY (v_companies) AND o.status = 'published'),
    'pending',   (SELECT count(*) FROM public.opportunities o
                   WHERE o.company_id = ANY (v_companies) AND o.status = 'pending_review'),
    'responses', (SELECT count(*) FROM public.opportunity_responses r
                    JOIN public.opportunities o ON o.id = r.opportunity_id
                   WHERE o.company_id = ANY (v_companies)
                     AND r.responder_id <> v_uid AND r.created_at >= v_start),
    'sent',      (SELECT count(*) FROM public.opportunity_responses r
                   WHERE r.responder_id = v_uid AND r.created_at >= v_start),
    'top', COALESCE((SELECT jsonb_agg(x ORDER BY x.responses DESC, x.published_at DESC NULLS LAST) FROM (
        SELECT o.id, o.slug, o.category, o.title_en, o.title_fr, o.status, o.published_at,
               (SELECT count(*) FROM public.opportunity_responses r
                 WHERE r.opportunity_id = o.id AND r.responder_id <> v_uid) AS responses
          FROM public.opportunities o
         WHERE o.company_id = ANY (v_companies) AND o.status IN ('published', 'pending_review')
         ORDER BY 8 DESC, o.published_at DESC NULLS LAST
         LIMIT 5) x), '[]'::jsonb))
    INTO v_opps;

  -- ---- Company by company (an owner may run several) -------------------------
  SELECT COALESCE(jsonb_agg(x ORDER BY (x.profile_views + x.product_views) DESC, x.name), '[]'::jsonb)
    INTO v_by_company
    FROM (SELECT * FROM (
      SELECT c.id, c.name, c.status,
             (SELECT count(*) FROM public.analytics_events e
               WHERE e.entity_type = 'company' AND e.entity_id = c.id
                 AND e.event_type IN ('view', 'profile_view') AND e.created_at >= v_start) AS profile_views,
             (SELECT count(*) FROM public.analytics_events e
                JOIN public.products p ON p.id = e.entity_id
               WHERE e.entity_type = 'product' AND e.event_type = 'view'
                 AND p.company_id = c.id AND e.created_at >= v_start) AS product_views,
             (SELECT count(*) FROM public.analytics_events e
               WHERE e.entity_type = 'company' AND e.entity_id = c.id
                 AND e.event_type = 'contact_request' AND e.created_at >= v_start) AS contacts
        FROM public.companies c
       WHERE c.id = ANY (v_companies)) per_company
       ORDER BY profile_views + product_views DESC, name
       LIMIT 6
    ) x;

  RETURN jsonb_build_object(
    'period_days',     v_days,
    'current_start',   v_start,
    'companies_count', COALESCE(array_length(v_companies, 1), 0),
    'audience',        v_audience,
    'inbound',         v_inbound,
    'requests',        v_requests,
    'catalogue',       v_catalogue,
    'opportunities',   v_opps,
    'by_company',      v_by_company
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.owner_analytics_details(integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.owner_analytics_details(integer) FROM anon;
GRANT  EXECUTE ON FUNCTION public.owner_analytics_details(integer) TO authenticated;

COMMENT ON FUNCTION public.owner_analytics_details(integer) IS
  'Company Statistics page, for auth.uid()''s own companies: unique visitors, responsiveness, forwarded requests, catalogue health, opportunities, per-company figures (00067).';

-- ---------------------------------------------------------------------------
-- 2. Staff console
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.console_user_type_metrics(p_days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  c_home       constant text := 'democratic republic of the congo';
  v_uid        uuid := auth.uid();
  v_super      boolean := public.is_super_admin();
  v_days       integer := LEAST(GREATEST(COALESCE(p_days, 30), 7), 90);
  v_today      timestamptz := date_trunc('day', now());
  v_start      timestamptz;
  v_prev_start timestamptz;
  v_seg        text;
  v_ids        uuid[];
  v_accounts   jsonb;
  v_series     jsonb;
  v_segments   jsonb := '{}'::jsonb;
  v_moderation jsonb;
  v_team       jsonb;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not_authorized' USING ERRCODE = '42501';
  END IF;

  v_start      := v_today - make_interval(days => v_days - 1);
  v_prev_start := v_start - make_interval(days => v_days);

  -- ---- Accounts by type ------------------------------------------------------
  -- The type is read from what the account owns today, not from a stored label:
  -- staff first, then one company in the DRC makes it Congolese (00051).
  WITH typed AS (
    SELECT p.id, p.created_at,
           CASE
             WHEN p.staff_role IS NOT NULL OR p.role = 'admin' THEN 'staff'
             WHEN EXISTS (SELECT 1 FROM public.companies c
                           WHERE c.owner_id = p.id
                             AND (c.country IS NULL OR lower(btrim(c.country)) = c_home)) THEN 'congolese'
             WHEN EXISTS (SELECT 1 FROM public.companies c WHERE c.owner_id = p.id) THEN 'international'
             ELSE 'none'
           END AS kind,
           u.last_sign_in_at,
           u.email_confirmed_at
      FROM public.profiles p
      LEFT JOIN auth.users u ON u.id = p.id
  ),
  kinds(kind) AS (
    VALUES ('congolese'), ('international'), ('none'), ('staff')
  ),
  by_kind AS (
    SELECT k.kind,
           count(t.id) AS total,
           count(t.id) FILTER (WHERE t.created_at >= v_start) AS new_current,
           count(t.id) FILTER (WHERE t.created_at >= v_prev_start AND t.created_at < v_start) AS new_previous,
           count(t.id) FILTER (WHERE t.last_sign_in_at >= v_start) AS active,
           count(t.id) FILTER (WHERE t.email_confirmed_at IS NOT NULL) AS confirmed
      FROM kinds k LEFT JOIN typed t ON t.kind = k.kind
     GROUP BY k.kind
  ),
  -- New accounts per day: those that went on to register a company, and the rest.
  days AS (
    SELECT generate_series(v_start, v_today, interval '1 day') AS d
  ),
  daily AS (
    SELECT date_trunc('day', created_at) AS d,
           count(*) FILTER (WHERE kind IN ('congolese', 'international')) AS with_company,
           count(*) FILTER (WHERE kind = 'none') AS without_company
      FROM typed WHERE created_at >= v_start AND kind <> 'staff'
     GROUP BY 1
  )
  SELECT (SELECT jsonb_object_agg(b.kind, to_jsonb(b) - 'kind') FROM by_kind b),
         (SELECT jsonb_build_object(
                   'with_company',    jsonb_agg(COALESCE(daily.with_company, 0) ORDER BY days.d),
                   'without_company', jsonb_agg(COALESCE(daily.without_company, 0) ORDER BY days.d))
            FROM days LEFT JOIN daily ON daily.d = days.d)
    INTO v_accounts, v_series;

  -- ---- Companies, Congolese then international --------------------------------
  FOREACH v_seg IN ARRAY ARRAY['drc', 'intl'] LOOP
    SELECT COALESCE(array_agg(c.id), '{}') INTO v_ids
      FROM public.companies c
     WHERE (c.country IS NULL OR lower(btrim(c.country)) = c_home) = (v_seg = 'drc');

    v_segments := v_segments || jsonb_build_object(v_seg, (
      WITH co AS (
        SELECT c.id, c.owner_id, c.status, c.created_at, c.is_premium, c.premium_expires_at,
               (   EXISTS (SELECT 1 FROM public.products p WHERE p.company_id = c.id AND p.is_published)
                OR EXISTS (SELECT 1 FROM public.opportunities o
                            WHERE o.company_id = c.id AND o.status = 'published')) AS has_offer,
               (   EXISTS (SELECT 1 FROM public.analytics_events e
                            WHERE e.entity_type = 'company' AND e.entity_id = c.id
                              AND e.event_type = 'contact_request')
                OR EXISTS (SELECT 1 FROM public.conversations cv
                            WHERE cv.company_id = c.id AND cv.initiator_id <> c.owner_id)
                OR EXISTS (SELECT 1 FROM public.business_requests br
                            WHERE br.target_company_id = c.id)
                OR EXISTS (SELECT 1 FROM public.opportunity_responses r
                             JOIN public.opportunities o ON o.id = r.opportunity_id
                            WHERE o.company_id = c.id)) AS has_contact
          FROM public.companies c WHERE c.id = ANY (v_ids)
      )
      SELECT jsonb_build_object(
        'companies',    count(*),
        'owners',       count(DISTINCT owner_id),
        'new_current',  count(*) FILTER (WHERE created_at >= v_start),
        'new_previous', count(*) FILTER (WHERE created_at >= v_prev_start AND created_at < v_start),
        'premium',      count(*) FILTER (WHERE is_premium AND (premium_expires_at IS NULL OR premium_expires_at > now())),
        -- Each step is a subset of the one before it, so the funnel only narrows.
        'funnel', jsonb_build_object(
          'registered', count(*),
          'submitted',  count(*) FILTER (WHERE status <> 'pending_documents'),
          'verified',   count(*) FILTER (WHERE status = 'verified'),
          'listed',     count(*) FILTER (WHERE status = 'verified' AND has_offer),
          'contacted',  count(*) FILTER (WHERE status = 'verified' AND has_offer AND has_contact)),
        'products',           (SELECT count(*) FROM public.products p WHERE p.company_id = ANY (v_ids)),
        'products_published', (SELECT count(*) FROM public.products p
                                WHERE p.company_id = ANY (v_ids) AND p.is_published),
        'opportunities',      (SELECT count(*) FROM public.opportunities o
                                WHERE o.company_id = ANY (v_ids) AND o.status = 'published'),
        'profile_views',      (SELECT count(*) FROM public.analytics_events e
                                WHERE e.entity_type = 'company' AND e.entity_id = ANY (v_ids)
                                  AND e.event_type IN ('view', 'profile_view') AND e.created_at >= v_start),
        'product_views',      (SELECT count(*) FROM public.analytics_events e
                                 JOIN public.products p ON p.id = e.entity_id
                                WHERE e.entity_type = 'product' AND e.event_type = 'view'
                                  AND p.company_id = ANY (v_ids) AND e.created_at >= v_start),
        'contact_requests',   (SELECT count(*) FROM public.analytics_events e
                                WHERE e.entity_type = 'company' AND e.entity_id = ANY (v_ids)
                                  AND e.event_type = 'contact_request' AND e.created_at >= v_start),
        'requests_received',  (SELECT count(*) FROM public.business_requests br
                                WHERE br.target_company_id = ANY (v_ids) AND br.created_at >= v_start),
        'conversations',      (SELECT count(*) FROM public.conversations cv
                                WHERE cv.company_id = ANY (v_ids) AND cv.created_at >= v_start),
        'responses_sent',     (SELECT count(*) FROM public.opportunity_responses r
                                WHERE r.company_id = ANY (v_ids) AND r.created_at >= v_start))
        FROM co));
  END LOOP;

  -- ---- Moderation over the period (same delay rule as 00059) ------------------
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
               FILTER (WHERE sent_at IS NOT NULL))::numeric, 1),
           'requests_forwarded', (SELECT count(*) FROM public.business_requests br
                                   WHERE br.forwarded_at >= v_start),
           'requests_waiting',   (SELECT count(*) FROM public.business_requests br
                                   WHERE br.status = 'new'))
    INTO v_moderation
    FROM decisions;

  -- ---- The team: a super-admin sees everyone, a moderator only their own row --
  SELECT COALESCE(jsonb_agg(x ORDER BY x.decisions + x.forwarded DESC, x.name), '[]'::jsonb)
    INTO v_team
    FROM (
      SELECT p.id,
             COALESCE(NULLIF(btrim(p.full_name), ''), '') AS name,
             CASE WHEN p.staff_role = 'moderator' THEN 'moderator' ELSE 'super_admin' END AS role,
             (p.id = v_uid) AS is_self,
             (SELECT count(*) FROM public.verification_reviews r
               WHERE r.admin_id = p.id AND r.created_at >= v_start
                 AND r.decision IN ('approved', 'rejected', 'more_info_requested')) AS decisions,
             (SELECT count(*) FROM public.verification_reviews r
               WHERE r.admin_id = p.id AND r.created_at >= v_start AND r.decision = 'approved') AS approved,
             (SELECT count(*) FROM public.business_requests br
               WHERE br.forwarded_by = p.id AND br.forwarded_at >= v_start) AS forwarded,
             (SELECT GREATEST(
                (SELECT max(r.created_at) FROM public.verification_reviews r
                  WHERE r.admin_id = p.id
                    AND r.decision IN ('approved', 'rejected', 'more_info_requested')),
                (SELECT max(br.forwarded_at) FROM public.business_requests br
                  WHERE br.forwarded_by = p.id))) AS last_action_at
        FROM public.profiles p
       WHERE (p.staff_role IS NOT NULL OR p.role = 'admin')
         AND (v_super OR p.id = v_uid)
    ) x;

  RETURN jsonb_build_object(
    'period_days',    v_days,
    'current_start',  v_start,
    'viewer_role',    CASE WHEN v_super THEN 'super_admin' ELSE 'moderator' END,
    'accounts',       v_accounts,
    'signups',        v_series,
    'segments',       v_segments,
    'moderation',     v_moderation,
    'team',           v_team
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.console_user_type_metrics(integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.console_user_type_metrics(integer) FROM anon;
GRANT  EXECUTE ON FUNCTION public.console_user_type_metrics(integer) TO authenticated;

COMMENT ON FUNCTION public.console_user_type_metrics(integer) IS
  'Staff console Statistics (is_admin() only): accounts and companies by type of user, activation funnels, moderation and team activity (00067).';
