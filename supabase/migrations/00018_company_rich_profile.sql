-- =============================================================================
-- 00018_company_rich_profile.sql  (cluster C9)
-- Rich company profile + bilingual products + media (Req 3 & 4)
--
-- Extends:
--   00001_initial_schema.sql      (companies, products, storage buckets/policies,
--                                  update_updated_at(), is_admin via profiles.role)
--   00002_add_is_admin_helper.sql (public.is_admin())
--   00006_marketplace_segments.sql (owner-write RLS pattern on company-linked tables)
--
-- NOTE: hs_code / tags are handled via dedicated join tables in 00014 — NOT here.
--
-- Safety: this targets a GOVERNMENT PRODUCTION database applied later by a human
-- via `supabase db push`. Current live state is unknown / possibly partially
-- migrated. EVERY statement is idempotent and re-runnable:
--   ADD COLUMN IF NOT EXISTS, CREATE TABLE IF NOT EXISTS,
--   DROP POLICY IF EXISTS before each CREATE POLICY, CREATE INDEX IF NOT EXISTS,
--   DO-block guards for buckets / triggers / constraints.
-- =============================================================================

-- =============================================================================
-- 1. companies — rich profile fields (mirror the dashboard edit form)
-- =============================================================================

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS production_capacity TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS moq                 TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS lead_time           TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS markets             TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS spoken_languages    TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS certifications      TEXT[] NOT NULL DEFAULT '{}';

-- =============================================================================
-- 2. products — bilingual-first naming + video embed
--    Keep existing name/description (legacy). Add _en/_fr pairs and backfill
--    _en from the legacy single-language columns so no row loses its label.
-- =============================================================================

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS name_en        TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS name_fr        TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description_en TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description_fr TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS video_embed    TEXT;

-- Backfill bilingual _en columns from legacy single-language columns.
-- Idempotent: only fills rows where the _en column is still NULL.
UPDATE public.products
   SET name_en = name
 WHERE name_en IS NULL
   AND name IS NOT NULL;

UPDATE public.products
   SET description_en = description
 WHERE description_en IS NULL
   AND description IS NOT NULL;

-- =============================================================================
-- 3. company_media — gallery images, brochures, and video links
--    Chosen over parallel arrays on companies because each item needs its own
--    kind, ordering, and (for storage-backed items) a deletable row. The url
--    column points at an object in the company-media / company-brochures bucket
--    (gallery/brochure) or an external embed URL (video).
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.company_media (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES public.companies (id) ON DELETE CASCADE,
  kind        TEXT NOT NULL CHECK (kind IN ('gallery', 'brochure', 'video')),
  url         TEXT NOT NULL,
  title_en    TEXT,
  title_fr    TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.company_media ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS company_media_company_idx
  ON public.company_media (company_id);
CREATE INDEX IF NOT EXISTS company_media_company_kind_sort_idx
  ON public.company_media (company_id, kind, sort_order);

-- updated_at trigger (guarded: CREATE TRIGGER has no IF NOT EXISTS)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'company_media_updated_at'
  ) THEN
    CREATE TRIGGER company_media_updated_at
      BEFORE UPDATE ON public.company_media
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- Public can read media that belongs to a verified company; owners and admins
-- can always read their own (mirrors products_public_read_verified_company).
DROP POLICY IF EXISTS "company_media_public_read" ON public.company_media;
CREATE POLICY "company_media_public_read" ON public.company_media
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = company_id AND c.status = 'verified'
    )
    OR EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = company_id AND c.owner_id = auth.uid()
    )
    OR public.is_admin()
  );

-- Owners (of the linked company) and admins can write (insert/update/delete).
DROP POLICY IF EXISTS "company_media_owner_write" ON public.company_media;
CREATE POLICY "company_media_owner_write" ON public.company_media
  FOR ALL
  USING (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = company_id AND c.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = company_id AND c.owner_id = auth.uid()
    )
  );

-- =============================================================================
-- 4. Storage buckets — gallery (public) + brochures (public)
--    Files are organised under <company_id>/<filename> so the existing
--    storage.foldername(name)[1] = companies.id owner check applies.
-- =============================================================================

INSERT INTO storage.buckets (id, name, public) VALUES
  ('company-media',     'company-media',     true),
  ('company-brochures', 'company-brochures', true)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Storage RLS: company-media (gallery, public read; owner/admin write)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "company_media_bucket_owner_upload" ON storage.objects;
CREATE POLICY "company_media_bucket_owner_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'company-media'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.companies
      WHERE id::text = (storage.foldername(name))[1]
        AND owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "company_media_bucket_public_read" ON storage.objects;
CREATE POLICY "company_media_bucket_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'company-media');

DROP POLICY IF EXISTS "company_media_bucket_owner_update" ON storage.objects;
CREATE POLICY "company_media_bucket_owner_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'company-media'
    AND (
      EXISTS (
        SELECT 1 FROM public.companies
        WHERE id::text = (storage.foldername(name))[1]
          AND owner_id = auth.uid()
      )
      OR public.is_admin()
    )
  );

DROP POLICY IF EXISTS "company_media_bucket_owner_admin_delete" ON storage.objects;
CREATE POLICY "company_media_bucket_owner_admin_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'company-media'
    AND (
      EXISTS (
        SELECT 1 FROM public.companies
        WHERE id::text = (storage.foldername(name))[1]
          AND owner_id = auth.uid()
      )
      OR public.is_admin()
    )
  );

-- ---------------------------------------------------------------------------
-- Storage RLS: company-brochures (public read; owner/admin write)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "company_brochures_bucket_owner_upload" ON storage.objects;
CREATE POLICY "company_brochures_bucket_owner_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'company-brochures'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.companies
      WHERE id::text = (storage.foldername(name))[1]
        AND owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "company_brochures_bucket_public_read" ON storage.objects;
CREATE POLICY "company_brochures_bucket_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'company-brochures');

DROP POLICY IF EXISTS "company_brochures_bucket_owner_update" ON storage.objects;
CREATE POLICY "company_brochures_bucket_owner_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'company-brochures'
    AND (
      EXISTS (
        SELECT 1 FROM public.companies
        WHERE id::text = (storage.foldername(name))[1]
          AND owner_id = auth.uid()
      )
      OR public.is_admin()
    )
  );

DROP POLICY IF EXISTS "company_brochures_bucket_owner_admin_delete" ON storage.objects;
CREATE POLICY "company_brochures_bucket_owner_admin_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'company-brochures'
    AND (
      EXISTS (
        SELECT 1 FROM public.companies
        WHERE id::text = (storage.foldername(name))[1]
          AND owner_id = auth.uid()
      )
      OR public.is_admin()
    )
  );
