-- =============================================================================
-- TradeInDRC — Surface verification tier in global search (P1)
-- Migration: 00026_search_verification_tier.sql
-- =============================================================================
-- The global_search RPC (00009) returns no trust signal, so search results can't
-- show the verification badge that listing pages now display. This recreates the
-- function with an added verification_tier column, populated for PRODUCT results
-- from their (verified) owning company and NULL for every other entity type.
--
-- Return signature changes, so DROP + CREATE (CREATE OR REPLACE cannot alter the
-- RETURNS TABLE shape). Idempotent: DROP IF EXISTS. Grants reapplied.
-- Extends: 00009_global_search.sql.
-- =============================================================================

DROP FUNCTION IF EXISTS public.global_search(text, text, integer);

CREATE OR REPLACE FUNCTION public.global_search(
  q            text,
  lang         text    DEFAULT 'en',
  max_per_type integer DEFAULT 8
)
RETURNS TABLE (
  entity_type       text,
  entity_id         uuid,
  title             text,
  snippet           text,
  href              text,
  rank              real,
  verification_tier text
)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  WITH tsq AS (
    SELECT
      CASE WHEN lang = 'fr'
        THEN plainto_tsquery('french',  q)
        ELSE plainto_tsquery('english', q)
      END AS q
  )
  SELECT * FROM (
    -- Companies (only verified)
    SELECT
      'company'::text                                     AS entity_type,
      c.id                                                AS entity_id,
      c.name                                              AS title,
      LEFT(COALESCE(c.description, ''), 160)              AS snippet,
      '/companies/' || c.id::text                         AS href,
      ts_rank(
        CASE WHEN lang = 'fr' THEN c.search_fr ELSE c.search_en END,
        (SELECT q FROM tsq)
      )                                                   AS rank,
      NULL::text                                          AS verification_tier
    FROM public.companies c, tsq
    WHERE c.status = 'verified'
      AND (CASE WHEN lang = 'fr' THEN c.search_fr ELSE c.search_en END) @@ tsq.q
    ORDER BY rank DESC
    LIMIT max_per_type
  ) companies_results

  UNION ALL

  SELECT * FROM (
    -- Products (only via verified company) — carry the company verification tier
    SELECT
      'product'::text,
      p.id,
      p.name,
      LEFT(COALESCE(p.description, ''), 160),
      '/products/' || p.id::text,
      ts_rank(
        CASE WHEN lang = 'fr' THEN p.search_fr ELSE p.search_en END,
        (SELECT q FROM tsq)
      ),
      c.verification_tier::text
    FROM public.products p
    JOIN public.companies c ON c.id = p.company_id AND c.status = 'verified'
    , tsq
    WHERE (CASE WHEN lang = 'fr' THEN p.search_fr ELSE p.search_en END) @@ tsq.q
    ORDER BY 6 DESC
    LIMIT max_per_type
  ) products_results

  UNION ALL

  SELECT * FROM (
    -- Services (only active, via verified company)
    SELECT
      'service'::text,
      s.id,
      CASE WHEN lang = 'fr' THEN s.name_fr ELSE s.name_en END,
      LEFT(COALESCE(
        CASE WHEN lang = 'fr' THEN s.description_fr ELSE s.description_en END,
        ''
      ), 160),
      '/companies/' || s.company_id::text,
      ts_rank(
        CASE WHEN lang = 'fr' THEN s.search_fr ELSE s.search_en END,
        (SELECT q FROM tsq)
      ),
      NULL::text
    FROM public.services s
    JOIN public.companies c ON c.id = s.company_id AND c.status = 'verified'
    , tsq
    WHERE s.status = 'active'
      AND (CASE WHEN lang = 'fr' THEN s.search_fr ELSE s.search_en END) @@ tsq.q
    ORDER BY 6 DESC
    LIMIT max_per_type
  ) services_results

  UNION ALL

  SELECT * FROM (
    -- Opportunities (only published)
    SELECT
      'opportunity'::text,
      o.id,
      CASE WHEN lang = 'fr' THEN o.title_fr ELSE o.title_en END,
      LEFT(COALESCE(
        CASE WHEN lang = 'fr' THEN o.summary_fr ELSE o.summary_en END,
        ''
      ), 160),
      '/opportunities/' || o.category || '/' || o.slug,
      ts_rank(
        CASE WHEN lang = 'fr' THEN o.search_fr ELSE o.search_en END,
        (SELECT q FROM tsq)
      ),
      NULL::text
    FROM public.opportunities o, tsq
    WHERE o.status = 'published'
      AND (CASE WHEN lang = 'fr' THEN o.search_fr ELSE o.search_en END) @@ tsq.q
    ORDER BY 6 DESC
    LIMIT max_per_type
  ) opportunities_results

  UNION ALL

  SELECT * FROM (
    -- Content items: news / event / blog (only published)
    SELECT
      'content'::text,
      ci.id,
      CASE WHEN lang = 'fr' THEN ci.title_fr ELSE ci.title_en END,
      LEFT(COALESCE(
        CASE WHEN lang = 'fr' THEN ci.excerpt_fr ELSE ci.excerpt_en END,
        ''
      ), 160),
      '/' || ci.type || '/' || ci.slug,
      ts_rank(
        CASE WHEN lang = 'fr' THEN ci.search_fr ELSE ci.search_en END,
        (SELECT q FROM tsq)
      ),
      NULL::text
    FROM public.content_items ci, tsq
    WHERE ci.status = 'published'
      AND (CASE WHEN lang = 'fr' THEN ci.search_fr ELSE ci.search_en END) @@ tsq.q
    ORDER BY 6 DESC
    LIMIT max_per_type
  ) content_results

  UNION ALL

  SELECT * FROM (
    -- Reports (only published)
    SELECT
      'report'::text,
      r.id,
      CASE WHEN lang = 'fr' THEN r.title_fr ELSE r.title_en END,
      LEFT(COALESCE(
        CASE WHEN lang = 'fr' THEN r.summary_fr ELSE r.summary_en END,
        ''
      ), 160),
      '/data-hub/' || r.kind || '/' || r.slug,
      ts_rank(
        CASE WHEN lang = 'fr' THEN r.search_fr ELSE r.search_en END,
        (SELECT q FROM tsq)
      ),
      NULL::text
    FROM public.reports r, tsq
    WHERE r.status = 'published'
      AND (CASE WHEN lang = 'fr' THEN r.search_fr ELSE r.search_en END) @@ tsq.q
    ORDER BY 6 DESC
    LIMIT max_per_type
  ) reports_results
$$;

REVOKE EXECUTE ON FUNCTION public.global_search(text, text, integer) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.global_search(text, text, integer) TO anon, authenticated;
