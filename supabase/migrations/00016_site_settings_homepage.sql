-- 00016_site_settings_homepage.sql
-- Cluster C4: Admin settings + homepage curation.
-- Three tables:
--   site_settings     — key/value JSONB store for global admin-editable settings.
--   carousel_slides   — bilingual homepage hero carousel, admin-curated, sortable.
--   featured_companies — admin-curated homepage company spotlight, sortable.
--
-- GOVERNMENT PRODUCTION DB: a human applies this later via `supabase db push`,
-- and we CANNOT verify the current live state. Every statement is idempotent and
-- safe on a partially-migrated DB.
--
-- Conventions reused (see supabase/migrations/CLAUDE.md):
--   - all objects in schema `public`
--   - id uuid pk default gen_random_uuid(); created_at/updated_at timestamptz default now()
--   - updated_at trigger via public.touch_updated_at() (defined in 00004)
--   - bilingual user-facing text: *_en / *_fr pairs
--   - public read filtered on `active`; admin write via public.is_admin()

-- ---------------------------------------------------------------------------
-- Safety: ensure the shared updated_at trigger function exists.
-- Created in 00004; re-declared here (CREATE OR REPLACE is idempotent) so this
-- migration is self-contained against a partially-migrated DB.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- Table: site_settings
-- Global key/value store for admin-editable site configuration.
-- value is JSONB to allow arbitrary structured settings per key.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_settings (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  key         TEXT        NOT NULL,
  value       JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique key (idempotent: guard with IF NOT EXISTS on the index).
CREATE UNIQUE INDEX IF NOT EXISTS site_settings_key_uniq
  ON public.site_settings (key);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Settings are globally readable (e.g. public-facing toggles, branding values).
DROP POLICY IF EXISTS "site_settings_public_read" ON public.site_settings;
CREATE POLICY "site_settings_public_read" ON public.site_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "site_settings_admin_all" ON public.site_settings;
CREATE POLICY "site_settings_admin_all" ON public.site_settings
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP TRIGGER IF EXISTS site_settings_updated_at ON public.site_settings;
CREATE TRIGGER site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Table: carousel_slides
-- Bilingual homepage hero carousel. Admin-curated, sortable, toggleable.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.carousel_slides (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en      TEXT        NOT NULL,
  title_fr      TEXT        NOT NULL,
  subtitle_en   TEXT,
  subtitle_fr   TEXT,
  image_url     TEXT        NOT NULL,
  cta_label_en  TEXT,
  cta_label_fr  TEXT,
  cta_href      TEXT,
  sort_order    INT         NOT NULL DEFAULT 0,
  active        BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS carousel_slides_active_sort_idx
  ON public.carousel_slides (sort_order)
  WHERE active = TRUE;

ALTER TABLE public.carousel_slides ENABLE ROW LEVEL SECURITY;

-- Public sees only active slides.
DROP POLICY IF EXISTS "carousel_slides_public_read" ON public.carousel_slides;
CREATE POLICY "carousel_slides_public_read" ON public.carousel_slides
  FOR SELECT USING (active = TRUE);

DROP POLICY IF EXISTS "carousel_slides_admin_all" ON public.carousel_slides;
CREATE POLICY "carousel_slides_admin_all" ON public.carousel_slides
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP TRIGGER IF EXISTS carousel_slides_updated_at ON public.carousel_slides;
CREATE TRIGGER carousel_slides_updated_at
  BEFORE UPDATE ON public.carousel_slides
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Table: featured_companies
-- Admin-curated homepage company spotlight. Sortable, toggleable.
-- One row per featured company (company_id unique).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.featured_companies (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID        NOT NULL REFERENCES public.companies (id) ON DELETE CASCADE,
  sort_order  INT         NOT NULL DEFAULT 0,
  active      BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- A company can be featured at most once (idempotent unique index).
CREATE UNIQUE INDEX IF NOT EXISTS featured_companies_company_uniq
  ON public.featured_companies (company_id);

CREATE INDEX IF NOT EXISTS featured_companies_active_sort_idx
  ON public.featured_companies (sort_order)
  WHERE active = TRUE;

ALTER TABLE public.featured_companies ENABLE ROW LEVEL SECURITY;

-- Public sees only active features.
DROP POLICY IF EXISTS "featured_companies_public_read" ON public.featured_companies;
CREATE POLICY "featured_companies_public_read" ON public.featured_companies
  FOR SELECT USING (active = TRUE);

DROP POLICY IF EXISTS "featured_companies_admin_all" ON public.featured_companies;
CREATE POLICY "featured_companies_admin_all" ON public.featured_companies
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP TRIGGER IF EXISTS featured_companies_updated_at ON public.featured_companies;
CREATE TRIGGER featured_companies_updated_at
  BEFORE UPDATE ON public.featured_companies
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
