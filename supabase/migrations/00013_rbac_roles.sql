-- 00013_rbac_roles.sql  (cluster C3)
-- RBAC 5-role model + RLS hardening.
--
-- Spec roles:
--   Visitor               -> no profiles row (anon / unauthenticated)
--   Congolese Company      -> profiles.account_type = 'congolese_company'
--   International Business -> profiles.account_type = 'international_business'
--   Moderator              -> profiles.staff_role = 'moderator'
--   Super-Admin            -> profiles.staff_role = 'super_admin'
--
-- The legacy profiles.role ('user' | 'admin') from 00001 is kept for
-- back-compat; staff_role is the new source of truth for staff privilege.
-- is_admin() (used by every admin RLS policy across 00001/00004/00007/00009)
-- is widened to mean "moderator OR super_admin" so existing policies keep
-- working unchanged while honouring the new model.
--
-- All statements are idempotent and safe on a partially-migrated DB:
-- ADD COLUMN IF NOT EXISTS, DO-block guards for CHECK constraints,
-- CREATE OR REPLACE FUNCTION, DROP POLICY IF EXISTS before CREATE POLICY.

-- =============================================================================
-- 1. profiles: business account_type + staff_role columns
-- =============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_type TEXT,
  ADD COLUMN IF NOT EXISTS staff_role   TEXT;

-- account_type CHECK (nullable: null = not a business user / staff / unset).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND conname = 'profiles_account_type_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_account_type_check
      CHECK (account_type IS NULL
             OR account_type IN ('congolese_company', 'international_business'));
  END IF;
END $$;

-- staff_role CHECK (null = not staff).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND conname = 'profiles_staff_role_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_staff_role_check
      CHECK (staff_role IS NULL
             OR staff_role IN ('moderator', 'super_admin'));
  END IF;
END $$;

COMMENT ON COLUMN public.profiles.account_type IS
  'Business user classification: congolese_company | international_business. NULL for staff or unclassified accounts.';
COMMENT ON COLUMN public.profiles.staff_role IS
  'Staff privilege tier: moderator | super_admin. NULL for non-staff. Source of truth for admin access (legacy profiles.role kept for back-compat).';

-- Partial index to make is_moderator()/is_super_admin()/is_admin() lookups cheap.
CREATE INDEX IF NOT EXISTS profiles_staff_role_idx
  ON public.profiles (staff_role)
  WHERE staff_role IS NOT NULL;

-- =============================================================================
-- 2. Migrate existing admins -> staff_role = 'super_admin'
-- =============================================================================
-- Existing rows with the legacy role='admin' become Super-Admins under the new
-- model. Idempotent: only sets rows that aren't already staff.

UPDATE public.profiles
SET staff_role = 'super_admin'
WHERE role = 'admin'
  AND staff_role IS DISTINCT FROM 'super_admin'
  AND staff_role IS NULL;

-- =============================================================================
-- 3. Staff-role helper functions (SECURITY DEFINER, hardened search_path)
-- =============================================================================
-- SECURITY DEFINER + SET search_path = public, pg_temp lets these read
-- public.profiles while bypassing RLS (avoids the recursion fixed in 00010)
-- and resolves the function_search_path_mutable advisory.

CREATE OR REPLACE FUNCTION public.is_moderator()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND staff_role = 'moderator'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND staff_role = 'super_admin'
  );
$$;

-- Recreate is_admin() with hardened search_path. Returns true for any staff
-- member (moderator OR super_admin). Legacy role='admin' is also honoured so
-- rows not yet migrated in step 2 (edge case) still pass.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND (staff_role IN ('moderator', 'super_admin') OR role = 'admin')
  );
$$;

-- Lock down execute privileges to authenticated callers (matches 00003 pattern).
REVOKE EXECUTE ON FUNCTION public.is_moderator()    FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_super_admin()  FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin()        FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.is_moderator()    TO authenticated;
GRANT  EXECUTE ON FUNCTION public.is_super_admin()  TO authenticated;
GRANT  EXECUTE ON FUNCTION public.is_admin()        TO authenticated;

-- =============================================================================
-- 4. companies RLS: refactor admin paths to is_admin(); harden owner_update
-- =============================================================================
-- Original 00001 policies inline `EXISTS (SELECT 1 FROM profiles ... role='admin')`.
-- Refactor to the is_admin() helper so the 5-role model applies uniformly.

-- 4a. Public/admin read.
DROP POLICY IF EXISTS "companies_public_read_verified" ON public.companies;
CREATE POLICY "companies_public_read_verified"
  ON public.companies FOR SELECT
  USING (
    status = 'verified'
    OR owner_id = auth.uid()
    OR public.is_admin()
  );

-- 4b. Owner UPDATE — hardened.
-- USING: owners may update their own row; admins may update any row.
-- WITH CHECK: when the editor is a non-admin owner, the verification-controlled
-- fields (verification_tier / verified_at / status / verification_summary) MUST
-- remain identical to the currently-stored values. WITH CHECK only sees the NEW
-- row, so we compare against the existing row via a self-subquery (cur). Admins
-- bypass the freeze entirely.
DROP POLICY IF EXISTS "companies_owner_update" ON public.companies;
CREATE POLICY "companies_owner_update"
  ON public.companies FOR UPDATE
  USING (
    owner_id = auth.uid()
    OR public.is_admin()
  )
  WITH CHECK (
    public.is_admin()
    OR (
      owner_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.companies cur
        WHERE cur.id = companies.id
          AND cur.status                IS NOT DISTINCT FROM companies.status
          AND cur.verification_tier     IS NOT DISTINCT FROM companies.verification_tier
          AND cur.verified_at           IS NOT DISTINCT FROM companies.verified_at
          AND cur.verification_summary  IS NOT DISTINCT FROM companies.verification_summary
      )
    )
  );

-- 4c. Admin DELETE.
DROP POLICY IF EXISTS "companies_admin_delete" ON public.companies;
CREATE POLICY "companies_admin_delete"
  ON public.companies FOR DELETE
  USING (public.is_admin());
