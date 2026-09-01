-- 00009_global_search.sql
-- Adds tsvector columns + GIN indexes on searchable tables, plus a SQL RPC
-- `public.global_search(q, lang)` that returns a typed union of results.

-- ---------- COMPANIES ----------
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS search_en tsvector,
  ADD COLUMN IF NOT EXISTS search_fr tsvector;

CREATE OR REPLACE FUNCTION public.companies_search_refresh() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_en := to_tsvector('english', COALESCE(NEW.name,'') || ' ' || COALESCE(NEW.description,''));
  NEW.search_fr := to_tsvector('french',  COALESCE(NEW.name,'') || ' ' || COALESCE(NEW.description,''));
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS companies_search_refresh ON public.companies;
CREATE TRIGGER companies_search_refresh BEFORE INSERT OR UPDATE
  ON public.companies FOR EACH ROW EXECUTE FUNCTION public.companies_search_refresh();

UPDATE public.companies SET name = name;  -- backfill existing rows
CREATE INDEX IF NOT EXISTS companies_search_en_idx ON public.companies USING GIN (search_en);
CREATE INDEX IF NOT EXISTS companies_search_fr_idx ON public.companies USING GIN (search_fr);

-- ---------- PRODUCTS ----------
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS search_en tsvector,
  ADD COLUMN IF NOT EXISTS search_fr tsvector;

CREATE OR REPLACE FUNCTION public.products_search_refresh() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_en := to_tsvector('english', COALESCE(NEW.name,'') || ' ' || COALESCE(NEW.description,''));
  NEW.search_fr := to_tsvector('french',  COALESCE(NEW.name,'') || ' ' || COALESCE(NEW.description,''));
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS products_search_refresh ON public.products;
CREATE TRIGGER products_search_refresh BEFORE INSERT OR UPDATE
  ON public.products FOR EACH ROW EXECUTE FUNCTION public.products_search_refresh();

UPDATE public.products SET name = name;
CREATE INDEX IF NOT EXISTS products_search_en_idx ON public.products USING GIN (search_en);
CREATE INDEX IF NOT EXISTS products_search_fr_idx ON public.products USING GIN (search_fr);

-- ---------- SERVICES ----------
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS search_en tsvector,
  ADD COLUMN IF NOT EXISTS search_fr tsvector;

CREATE OR REPLACE FUNCTION public.services_search_refresh() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_en := to_tsvector('english',
    COALESCE(NEW.name_en,'') || ' ' || COALESCE(NEW.description_en,''));
  NEW.search_fr := to_tsvector('french',
    COALESCE(NEW.name_fr,'') || ' ' || COALESCE(NEW.description_fr,''));
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS services_search_refresh ON public.services;
CREATE TRIGGER services_search_refresh BEFORE INSERT OR UPDATE
  ON public.services FOR EACH ROW EXECUTE FUNCTION public.services_search_refresh();

UPDATE public.services SET name_en = name_en;
CREATE INDEX IF NOT EXISTS services_search_en_idx ON public.services USING GIN (search_en);
CREATE INDEX IF NOT EXISTS services_search_fr_idx ON public.services USING GIN (search_fr);

-- ---------- OPPORTUNITIES ----------
ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS search_en tsvector,
  ADD COLUMN IF NOT EXISTS search_fr tsvector;

CREATE OR REPLACE FUNCTION public.opportunities_search_refresh() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_en := to_tsvector('english',
    COALESCE(NEW.title_en,'') || ' ' || COALESCE(NEW.summary_en,'') || ' ' || COALESCE(NEW.body_en,''));
  NEW.search_fr := to_tsvector('french',
    COALESCE(NEW.title_fr,'') || ' ' || COALESCE(NEW.summary_fr,'') || ' ' || COALESCE(NEW.body_fr,''));
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS opportunities_search_refresh ON public.opportunities;
CREATE TRIGGER opportunities_search_refresh BEFORE INSERT OR UPDATE
  ON public.opportunities FOR EACH ROW EXECUTE FUNCTION public.opportunities_search_refresh();

UPDATE public.opportunities SET title_en = title_en;
CREATE INDEX IF NOT EXISTS opportunities_search_en_idx ON public.opportunities USING GIN (search_en);
CREATE INDEX IF NOT EXISTS opportunities_search_fr_idx ON public.opportunities USING GIN (search_fr);

-- ---------- CONTENT_ITEMS ----------
ALTER TABLE public.content_items
  ADD COLUMN IF NOT EXISTS search_en tsvector,
  ADD COLUMN IF NOT EXISTS search_fr tsvector;

CREATE OR REPLACE FUNCTION public.content_items_search_refresh() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_en := to_tsvector('english',
    COALESCE(NEW.title_en,'') || ' ' || COALESCE(NEW.excerpt_en,'') || ' ' || COALESCE(NEW.body_en,''));
  NEW.search_fr := to_tsvector('french',
    COALESCE(NEW.title_fr,'') || ' ' || COALESCE(NEW.excerpt_fr,'') || ' ' || COALESCE(NEW.body_fr,''));
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS content_items_search_refresh ON public.content_items;
CREATE TRIGGER content_items_search_refresh BEFORE INSERT OR UPDATE
  ON public.content_items FOR EACH ROW EXECUTE FUNCTION public.content_items_search_refresh();

UPDATE public.content_items SET title_en = title_en;
CREATE INDEX IF NOT EXISTS content_items_search_en_idx ON public.content_items USING GIN (search_en);
CREATE INDEX IF NOT EXISTS content_items_search_fr_idx ON public.content_items USING GIN (search_fr);

-- ---------- REPORTS ----------
ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS search_en tsvector,
  ADD COLUMN IF NOT EXISTS search_fr tsvector;

CREATE OR REPLACE FUNCTION public.reports_search_refresh() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_en := to_tsvector('english',
    COALESCE(NEW.title_en,'') || ' ' || COALESCE(NEW.summary_en,'') || ' ' || COALESCE(NEW.body_en,''));
  NEW.search_fr := to_tsvector('french',
    COALESCE(NEW.title_fr,'') || ' ' || COALESCE(NEW.summary_fr,'') || ' ' || COALESCE(NEW.body_fr,''));
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS reports_search_refresh ON public.reports;
CREATE TRIGGER reports_search_refresh BEFORE INSERT OR UPDATE
  ON public.reports FOR EACH ROW EXECUTE FUNCTION public.reports_search_refresh();

UPDATE public.reports SET title_en = title_en;
CREATE INDEX IF NOT EXISTS reports_search_en_idx ON public.reports USING GIN (search_en);
CREATE INDEX IF NOT EXISTS reports_search_fr_idx ON public.reports USING GIN (search_fr);

-- ---------- RPC ----------
DROP FUNCTION IF EXISTS public.global_search(text, text, integer);

CREATE OR REPLACE FUNCTION public.global_search(
  q            text,
  lang         text    DEFAULT 'en',
  max_per_type integer DEFAULT 8
)
RETURNS TABLE (
  entity_type text,
  entity_id   uuid,
  title       text,
  snippet     text,
  href        text,
  rank        real
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
      )                                                   AS rank
    FROM public.companies c, tsq
    WHERE c.status = 'verified'
      AND (CASE WHEN lang = 'fr' THEN c.search_fr ELSE c.search_en END) @@ tsq.q
    ORDER BY rank DESC
    LIMIT max_per_type
  ) companies_results

  UNION ALL

  SELECT * FROM (
    -- Products (only via verified company)
    SELECT
      'product'::text,
      p.id,
      p.name,
      LEFT(COALESCE(p.description, ''), 160),
      '/products/' || p.id::text,
      ts_rank(
        CASE WHEN lang = 'fr' THEN p.search_fr ELSE p.search_en END,
        (SELECT q FROM tsq)
      )
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
      )
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
      )
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
      )
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
      )
    FROM public.reports r, tsq
    WHERE r.status = 'published'
      AND (CASE WHEN lang = 'fr' THEN r.search_fr ELSE r.search_en END) @@ tsq.q
    ORDER BY 6 DESC
    LIMIT max_per_type
  ) reports_results
$$;

REVOKE EXECUTE ON FUNCTION public.global_search(text, text, integer) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.global_search(text, text, integer) TO anon, authenticated;
