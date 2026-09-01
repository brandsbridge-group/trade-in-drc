-- =============================================================================
-- 00020_company_contacts.sql  (cluster C9)
-- Directory contact persons for company profiles (Req 3 — company directory).
--
-- Extends:
--   00001_initial_schema.sql       (companies, profiles, update_updated_at(),
--                                   companies.owner_id / .status)
--   00002_add_is_admin_helper.sql  (public.is_admin())
--   00012_message_reports_and_rls.sql (companies.contact_visibility:
--                                   'direct' | 'obfuscated' | 'login_required',
--                                   and the companies_public PII-free view pattern)
--   00018_company_rich_profile.sql (company_media owner/admin RLS template,
--                                   bilingual title_en/title_fr + sort_order shape)
--
-- A contact person row carries bilingual job titles and OPTIONAL email/phone.
-- Row visibility: public may read rows flagged is_public on a verified company;
-- owners and admins always see their own. The email/phone PII columns are
-- additionally gated by companies.contact_visibility via the
-- company_contacts_public view (mirrors how companies_public hides PII):
--   - 'direct'         -> email/phone exposed to anon + authenticated
--   - 'obfuscated'     -> email/phone exposed only to authenticated callers
--   - 'login_required' -> email/phone exposed only to authenticated callers
-- Owners/admins always get the raw columns by selecting the base table directly.
--
-- Safety: this targets a GOVERNMENT PRODUCTION database applied later by a human
-- via `supabase db push`. Current live state is unknown / possibly partially
-- migrated. EVERY statement is idempotent and re-runnable:
--   CREATE TABLE IF NOT EXISTS, ADD COLUMN IF NOT EXISTS,
--   DROP POLICY IF EXISTS before each CREATE POLICY, CREATE INDEX IF NOT EXISTS,
--   DO-block guards for the trigger (CREATE TRIGGER has no IF NOT EXISTS).
-- =============================================================================

-- =============================================================================
-- 1. company_contacts — one row per contact person on a company profile
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.company_contacts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES public.companies (id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  title_en    TEXT,
  title_fr    TEXT,
  email       TEXT,
  phone       TEXT,
  is_public   BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Re-runnable on a partially-migrated DB where the table pre-exists without
-- some columns (e.g. created by an earlier hand-applied draft).
ALTER TABLE public.company_contacts ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE public.company_contacts ADD COLUMN IF NOT EXISTS name       TEXT;
ALTER TABLE public.company_contacts ADD COLUMN IF NOT EXISTS title_en   TEXT;
ALTER TABLE public.company_contacts ADD COLUMN IF NOT EXISTS title_fr   TEXT;
ALTER TABLE public.company_contacts ADD COLUMN IF NOT EXISTS email      TEXT;
ALTER TABLE public.company_contacts ADD COLUMN IF NOT EXISTS phone      TEXT;
ALTER TABLE public.company_contacts ADD COLUMN IF NOT EXISTS is_public  BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.company_contacts ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.company_contacts ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.company_contacts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.company_contacts ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS company_contacts_company_idx
  ON public.company_contacts (company_id);
CREATE INDEX IF NOT EXISTS company_contacts_company_sort_idx
  ON public.company_contacts (company_id, sort_order);

-- updated_at trigger (guarded: CREATE TRIGGER has no IF NOT EXISTS)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'company_contacts_updated_at'
  ) THEN
    CREATE TRIGGER company_contacts_updated_at
      BEFORE UPDATE ON public.company_contacts
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- =============================================================================
-- 2. Row-Level Security
--    Public read is limited to is_public rows on a verified company. Owners of
--    the linked company and admins always read/write their own. PII columns
--    (email/phone) are NOT masked at the row level here — the company_contacts
--    base table is the owner/admin surface; anon/public callers go through the
--    company_contacts_public view which applies contact_visibility gating.
-- =============================================================================

-- Public + everyone can read public contacts of verified companies; owners and
-- admins can always read their own (mirrors company_media_public_read).
DROP POLICY IF EXISTS "company_contacts_public_read" ON public.company_contacts;
CREATE POLICY "company_contacts_public_read" ON public.company_contacts
  FOR SELECT USING (
    (
      is_public = TRUE
      AND EXISTS (
        SELECT 1 FROM public.companies c
        WHERE c.id = company_id AND c.status = 'verified'
      )
    )
    OR EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = company_id AND c.owner_id = auth.uid()
    )
    OR public.is_admin()
  );

-- Owners (of the linked company) and admins can write (insert/update/delete).
DROP POLICY IF EXISTS "company_contacts_owner_write" ON public.company_contacts;
CREATE POLICY "company_contacts_owner_write" ON public.company_contacts
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
-- 3. company_contacts_public — public-safe projection of contact persons
--    security_invoker = on so company_contacts RLS (public_read) still applies,
--    limiting rows to is_public contacts of verified companies for anon callers.
--    email/phone are gated by the parent company's contact_visibility:
--      'direct'         -> shown to anon + authenticated
--      'obfuscated' /   -> shown only when auth.uid() IS NOT NULL
--      'login_required'    (i.e. authenticated callers), NULL for anon
--    Owners/admins who need the raw columns query company_contacts directly.
-- =============================================================================

CREATE OR REPLACE VIEW public.company_contacts_public
WITH (security_invoker = on) AS
  SELECT
    cc.id,
    cc.company_id,
    cc.name,
    cc.title_en,
    cc.title_fr,
    CASE
      WHEN c.contact_visibility = 'direct' OR auth.uid() IS NOT NULL
        THEN cc.email
      ELSE NULL
    END AS email,
    CASE
      WHEN c.contact_visibility = 'direct' OR auth.uid() IS NOT NULL
        THEN cc.phone
      ELSE NULL
    END AS phone,
    cc.is_public,
    cc.sort_order,
    cc.created_at,
    cc.updated_at
  FROM public.company_contacts cc
  JOIN public.companies c ON c.id = cc.company_id;

GRANT SELECT ON public.company_contacts_public TO anon, authenticated;
