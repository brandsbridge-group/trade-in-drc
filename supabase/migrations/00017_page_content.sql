-- 00017_page_content.sql
-- Cluster C8 — CMS for static pages + FAQ + Help + Contact (Req 7 & 14).
--
-- Tables:
--   page_content        — static editorial pages (about, terms, privacy, etc.)
--   faqs                — frequently asked questions, bilingual
--   help_articles       — help-center articles, bilingual rich body
--   contact_submissions — inbound contact form messages (anon INSERT, admin read)
--
-- Also: adds companies.slug (unique) + best-effort backfill for /trust/[companySlug]
-- and SEO-friendly URLs.
--
-- Every statement is written to be idempotent and safe to re-run on a
-- partially-migrated database (CREATE ... IF NOT EXISTS, DROP POLICY IF EXISTS
-- before each CREATE POLICY, DO-block guards). This is a GOVERNMENT PRODUCTION
-- database — a human applies it later via `supabase db push`.
--
-- Reuses existing helpers:
--   public.is_admin()          (00002) — admin-write authorization
--   public.touch_updated_at()  (00004) — updated_at trigger function
--   gen_random_uuid()          — pgcrypto extension enabled in 00001

-- ===========================================================================
-- Table: page_content
-- ---------------------------------------------------------------------------
-- One row per static page, keyed by a stable slug. Body is stored as JSONB so
-- the editor can persist a structured rich-text document (e.g. portable-text /
-- tiptap JSON) per locale.
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.page_content (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text NOT NULL UNIQUE,
  title_en    text NOT NULL,
  title_fr    text NOT NULL,
  body_en     jsonb NOT NULL DEFAULT '{}'::jsonb,
  body_fr     jsonb NOT NULL DEFAULT '{}'::jsonb,
  status      text NOT NULL DEFAULT 'published' CHECK (status IN ('draft','published')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.page_content ENABLE ROW LEVEL SECURITY;

-- Public read: only published pages.
DROP POLICY IF EXISTS "page_content_public_read_published" ON public.page_content;
CREATE POLICY "page_content_public_read_published"
  ON public.page_content FOR SELECT
  USING (status = 'published');

-- Admin full read/write.
DROP POLICY IF EXISTS "page_content_admin_all" ON public.page_content;
CREATE POLICY "page_content_admin_all"
  ON public.page_content FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP TRIGGER IF EXISTS page_content_updated_at ON public.page_content;
CREATE TRIGGER page_content_updated_at
  BEFORE UPDATE ON public.page_content
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ===========================================================================
-- Table: faqs
-- ---------------------------------------------------------------------------
-- Bilingual question/answer pairs, grouped by an optional free-text category
-- and ordered within a category via sort_order.
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.faqs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_en text NOT NULL,
  question_fr text NOT NULL,
  answer_en   text NOT NULL,
  answer_fr   text NOT NULL,
  category    text,
  sort_order  integer NOT NULL DEFAULT 0,
  published   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS faqs_category_sort_idx
  ON public.faqs (category, sort_order);

ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

-- Public read: only published FAQs.
DROP POLICY IF EXISTS "faqs_public_read_published" ON public.faqs;
CREATE POLICY "faqs_public_read_published"
  ON public.faqs FOR SELECT
  USING (published = true);

-- Admin full read/write.
DROP POLICY IF EXISTS "faqs_admin_all" ON public.faqs;
CREATE POLICY "faqs_admin_all"
  ON public.faqs FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP TRIGGER IF EXISTS faqs_updated_at ON public.faqs;
CREATE TRIGGER faqs_updated_at
  BEFORE UPDATE ON public.faqs
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ===========================================================================
-- Table: help_articles
-- ---------------------------------------------------------------------------
-- Help-center articles, slug-addressable, with bilingual JSONB rich bodies.
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.help_articles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text NOT NULL UNIQUE,
  title_en    text NOT NULL,
  title_fr    text NOT NULL,
  body_en     jsonb NOT NULL DEFAULT '{}'::jsonb,
  body_fr     jsonb NOT NULL DEFAULT '{}'::jsonb,
  category    text,
  sort_order  integer NOT NULL DEFAULT 0,
  published   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS help_articles_category_sort_idx
  ON public.help_articles (category, sort_order);

ALTER TABLE public.help_articles ENABLE ROW LEVEL SECURITY;

-- Public read: only published articles.
DROP POLICY IF EXISTS "help_articles_public_read_published" ON public.help_articles;
CREATE POLICY "help_articles_public_read_published"
  ON public.help_articles FOR SELECT
  USING (published = true);

-- Admin full read/write.
DROP POLICY IF EXISTS "help_articles_admin_all" ON public.help_articles;
CREATE POLICY "help_articles_admin_all"
  ON public.help_articles FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP TRIGGER IF EXISTS help_articles_updated_at ON public.help_articles;
CREATE TRIGGER help_articles_updated_at
  BEFORE UPDATE ON public.help_articles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ===========================================================================
-- Table: contact_submissions
-- ---------------------------------------------------------------------------
-- Inbound contact-form messages. Anyone (including anonymous visitors) may
-- INSERT a submission; only admins may read, update (triage status), or delete.
-- `ip` is captured server-side for abuse triage and is nullable.
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  email       text NOT NULL,
  subject     text,
  message     text NOT NULL,
  locale      text,
  status      text NOT NULL DEFAULT 'new' CHECK (status IN ('new','read','archived','spam')),
  ip          inet,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS contact_submissions_status_created_at_idx
  ON public.contact_submissions (status, created_at DESC);

ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Anyone (anon + authenticated) may submit. New rows must start in 'new' so a
-- visitor cannot self-mark a submission as read/archived/spam.
DROP POLICY IF EXISTS "contact_submissions_public_insert" ON public.contact_submissions;
CREATE POLICY "contact_submissions_public_insert"
  ON public.contact_submissions FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'new');

-- Admin read.
DROP POLICY IF EXISTS "contact_submissions_admin_read" ON public.contact_submissions;
CREATE POLICY "contact_submissions_admin_read"
  ON public.contact_submissions FOR SELECT TO authenticated
  USING (public.is_admin());

-- Admin update (triage status).
DROP POLICY IF EXISTS "contact_submissions_admin_update" ON public.contact_submissions;
CREATE POLICY "contact_submissions_admin_update"
  ON public.contact_submissions FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Admin delete.
DROP POLICY IF EXISTS "contact_submissions_admin_delete" ON public.contact_submissions;
CREATE POLICY "contact_submissions_admin_delete"
  ON public.contact_submissions FOR DELETE TO authenticated
  USING (public.is_admin());

DROP TRIGGER IF EXISTS contact_submissions_updated_at ON public.contact_submissions;
CREATE TRIGGER contact_submissions_updated_at
  BEFORE UPDATE ON public.contact_submissions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ===========================================================================
-- companies.slug — SEO-friendly identifier for /trust/[companySlug]
-- ---------------------------------------------------------------------------
-- Add the column (idempotent), best-effort backfill from name where null, then
-- enforce uniqueness via a unique index. We deliberately add the column WITHOUT
-- NOT NULL so existing rows that fail to backfill (none expected) don't block
-- the migration; application code generates a slug on company creation.
-- ===========================================================================
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS slug text;

-- Best-effort backfill: slugify the company name, guarantee per-row uniqueness
-- by appending a numeric suffix on collision. Only touches rows where slug IS
-- NULL, so re-running is a no-op.
DO $$
DECLARE
  rec        record;
  base_slug  text;
  candidate  text;
  suffix     integer;
BEGIN
  FOR rec IN
    SELECT id, name
    FROM public.companies
    WHERE slug IS NULL
    ORDER BY created_at, id
  LOOP
    -- lower-case, strip accents-agnostic non-alphanumerics to hyphens, trim.
    base_slug := regexp_replace(lower(coalesce(rec.name, '')), '[^a-z0-9]+', '-', 'g');
    base_slug := trim(both '-' from base_slug);

    -- Fall back to the row id when the name yields nothing usable.
    IF base_slug IS NULL OR base_slug = '' THEN
      base_slug := 'company-' || replace(rec.id::text, '-', '');
    END IF;

    candidate := base_slug;
    suffix := 1;

    -- Resolve collisions against rows already carrying a slug.
    WHILE EXISTS (
      SELECT 1 FROM public.companies
      WHERE slug = candidate AND id <> rec.id
    ) LOOP
      suffix := suffix + 1;
      candidate := base_slug || '-' || suffix::text;
    END LOOP;

    UPDATE public.companies SET slug = candidate WHERE id = rec.id;
  END LOOP;
END
$$;

-- Enforce uniqueness. A unique index (vs constraint) is straightforward to
-- create idempotently with IF NOT EXISTS.
CREATE UNIQUE INDEX IF NOT EXISTS companies_slug_key
  ON public.companies (slug);
