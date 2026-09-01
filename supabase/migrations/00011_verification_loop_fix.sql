-- 00011_verification_loop_fix.sql
-- Cluster C1: Fix the verification trust loop at the SCHEMA level.
--
-- Problem being fixed:
--   The 00001 `companies_owner_update` policy had a USING clause but NO WITH CHECK,
--   so a company owner could UPDATE their own row and self-promote
--   status / verification_tier / verified_at / verification_summary.
--   Only admins (is_admin()) may set those trust columns.
--
-- This migration is fully idempotent and safe on a partially-migrated, LIVE
-- GOVERNMENT PRODUCTION database. A human applies it later via `supabase db push`;
-- we cannot inspect current live state, so every statement guards itself:
--   ADD COLUMN IF NOT EXISTS / CREATE TABLE IF NOT EXISTS /
--   DROP POLICY IF EXISTS before CREATE POLICY / CREATE INDEX IF NOT EXISTS /
--   DO-block guards for CHECK-constraint changes.
--
-- NOTE on naming: the trust columns were first added in 00004_trust_center.sql
-- (verification_tier / verified_at / verification_summary). The canonical
-- document-type column is public.company_documents.type (NOT doc_type) — the DB
-- enum stays authoritative and code mirrors the values listed below.
-- There is intentionally NO companies.verified boolean; `status` is the legacy
-- workflow column and `verification_tier` is the canonical public trust tier.

-- ===========================================================================
-- 1. Ensure companies has the admin-writable trust columns (re-assert 00004).
--    Idempotent: ADD COLUMN IF NOT EXISTS is a no-op if 00004 already ran.
-- ===========================================================================
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS verification_tier TEXT
    NOT NULL DEFAULT 'none'
    CHECK (verification_tier IN ('none', 'basic', 'verified', 'premium')),
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_summary JSONB;

COMMENT ON COLUMN public.companies.verification_tier IS
  'Canonical public trust tier. Enum: none | basic | verified | premium. Admin-write only (is_admin()).';
COMMENT ON COLUMN public.companies.verified_at IS
  'Timestamp of the most recent tier promotion by an admin. Admin-write only.';
COMMENT ON COLUMN public.companies.verification_summary IS
  'Public-safe JSON. Shape in src/lib/trust/types.ts (VerificationSummary). Admin-write only. Never store PII.';
COMMENT ON COLUMN public.companies.status IS
  'Legacy verification workflow state: pending | verified | rejected. Admin-write only (is_admin()).';

-- ===========================================================================
-- 2. Column-level write protection for trust columns.
--    RLS is row-level; to stop owners writing specific columns we REVOKE the
--    column UPDATE privilege from the `authenticated` role entirely. The admin
--    client uses the service-role key, which bypasses column grants, so admin
--    promotions still work. This is the real lock on the trust loop.
--    REVOKE is idempotent (revoking an absent grant is a no-op).
-- ===========================================================================
REVOKE UPDATE (status, verification_tier, verified_at, verification_summary)
  ON public.companies FROM authenticated;

-- Belt-and-braces: also revoke from PUBLIC / anon in case a broad grant exists.
REVOKE UPDATE (status, verification_tier, verified_at, verification_summary)
  ON public.companies FROM PUBLIC;
REVOKE UPDATE (status, verification_tier, verified_at, verification_summary)
  ON public.companies FROM anon;

-- Re-grant UPDATE on the owner-editable columns so owners can still maintain
-- their profile. This list deliberately EXCLUDES the four trust columns above.
GRANT UPDATE (
  name,
  description,
  sector_id,
  contact_email,
  contact_phone,
  website,
  address,
  city,
  province,
  logo_url,
  updated_at
) ON public.companies TO authenticated;

-- ===========================================================================
-- 3. RLS policies on companies: owner UPDATE (defense-in-depth WITH CHECK)
--    + explicit admin UPDATE. The WITH CHECK forbids an owner from changing
--    status / verification_tier away from their current persisted values even
--    if a future column grant slips through.
-- ===========================================================================
DROP POLICY IF EXISTS "companies_owner_update" ON public.companies;
CREATE POLICY "companies_owner_update"
  ON public.companies FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (
    owner_id = auth.uid()
    -- Owners may not alter trust columns; values must match what is persisted.
    AND status = (SELECT c.status FROM public.companies c WHERE c.id = companies.id)
    AND verification_tier = (SELECT c.verification_tier FROM public.companies c WHERE c.id = companies.id)
    AND verified_at IS NOT DISTINCT FROM (SELECT c.verified_at FROM public.companies c WHERE c.id = companies.id)
    AND verification_summary IS NOT DISTINCT FROM (SELECT c.verification_summary FROM public.companies c WHERE c.id = companies.id)
  );

DROP POLICY IF EXISTS "companies_admin_update" ON public.companies;
CREATE POLICY "companies_admin_update"
  ON public.companies FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ===========================================================================
-- 4. Storage bucket `company-documents` (private) + owner-path INSERT policy.
--    Re-assert the bucket and the INSERT policy so registration uploads work:
--    an authenticated user may upload to a path whose FIRST folder segment is a
--    companies.id they own (uploads happen AFTER the company row is created).
--    ON CONFLICT keeps the bucket private and idempotent.
-- ===========================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-documents', 'company-documents', false)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- INSERT: owner-of-first-folder-segment can upload. Recreated idempotently.
DROP POLICY IF EXISTS "company_documents_bucket_owner_upload" ON storage.objects;
CREATE POLICY "company_documents_bucket_owner_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'company-documents'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.companies
      WHERE id::text = (storage.foldername(name))[1]
        AND owner_id = auth.uid()
    )
  );

-- SELECT: owner of the first-folder-segment company, or any admin. Recreated
-- idempotently to keep the private-read contract intact alongside the INSERT fix.
DROP POLICY IF EXISTS "company_documents_bucket_owner_read" ON storage.objects;
CREATE POLICY "company_documents_bucket_owner_read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'company-documents'
    AND (
      EXISTS (
        SELECT 1 FROM public.companies
        WHERE id::text = (storage.foldername(name))[1]
          AND owner_id = auth.uid()
      )
      OR public.is_admin()
    )
  );

-- DELETE: owner of the first-folder-segment company, or any admin. Recreated
-- idempotently to mirror 00001 and keep all three CRUD verbs consistent.
DROP POLICY IF EXISTS "company_documents_bucket_owner_admin_delete" ON storage.objects;
CREATE POLICY "company_documents_bucket_owner_admin_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'company-documents'
    AND (
      EXISTS (
        SELECT 1 FROM public.companies
        WHERE id::text = (storage.foldername(name))[1]
          AND owner_id = auth.uid()
      )
      OR public.is_admin()
    )
  );

-- ===========================================================================
-- 5. Canonical company_documents.type CHECK enum.
--    Authoritative DB enum (code must mirror these exactly):
--      business_license | tax_registration | proof_of_address | logo | photo
--    Drop any existing CHECK on `type` then re-add the canonical one, guarded so
--    it is safe whether or not the constraint already exists / matches.
-- ===========================================================================
DO $$
DECLARE
  v_conname TEXT;
BEGIN
  -- Find any existing CHECK constraint on company_documents that references `type`.
  FOR v_conname IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace ns ON ns.oid = rel.relnamespace
    WHERE ns.nspname = 'public'
      AND rel.relname = 'company_documents'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ILIKE '%type%'
  LOOP
    EXECUTE format(
      'ALTER TABLE public.company_documents DROP CONSTRAINT %I',
      v_conname
    );
  END LOOP;

  -- Re-add the canonical CHECK under a stable, named constraint.
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace ns ON ns.oid = rel.relnamespace
    WHERE ns.nspname = 'public'
      AND rel.relname = 'company_documents'
      AND con.conname = 'company_documents_type_check'
  ) THEN
    ALTER TABLE public.company_documents
      ADD CONSTRAINT company_documents_type_check
      CHECK (type IN ('business_license', 'tax_registration', 'proof_of_address', 'logo', 'photo'));
  END IF;
END
$$;

COMMENT ON COLUMN public.company_documents.type IS
  'Canonical document type enum (DB authoritative). Values: business_license | tax_registration | proof_of_address | logo | photo. Code mirrors these.';
