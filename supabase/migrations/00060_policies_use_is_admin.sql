-- =============================================================================
-- TradeInDRC — Staff policies: recognise staff_role, not only the legacy role
-- Migration: 00060_policies_use_is_admin.sql
-- =============================================================================
-- Staff privilege is `profiles.staff_role` ('moderator' | 'super_admin') since
-- 00013; `public.is_admin()` honours it AND the legacy `profiles.role = 'admin'`.
-- But 22 policies written before 00013 still test the legacy column directly:
--
--   EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid()
--                                    AND profiles.role = 'admin')
--
-- A staff account that has a `staff_role` but not the legacy role — which is
-- how every staff account is created today, and the case of the only staff
-- account in production — is therefore NOT staff for those policies. Found by
-- a real walk through the verification circuit (2026-10-02): a moderator could
-- not read a company's documents or its review trail under their own session,
-- so accepting or refusing a document silently updated zero rows. The same
-- defect covers sectors / categories editing, product and RFQ moderation,
-- conversations, and reading analytics events.
--
-- Fix: in every `public` policy, replace that exact clause by
-- `public.is_admin()`. It is a strict superset (legacy admins keep access), so
-- nobody loses anything; the rest of each policy is left untouched. Done by
-- rewriting the stored expression rather than re-typing 22 policies by hand,
-- so no other condition can be altered by mistake.

DO $$
DECLARE
  r record;
  legacy constant text :=
    '\(EXISTS \( SELECT 1\s+FROM profiles\s+WHERE \(\(profiles\.id = auth\.uid\(\)\) AND \(profiles\.role = ''admin''::text\)\)\)\)';
  new_qual  text;
  new_check text;
  changed   integer := 0;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname, qual, with_check
      FROM pg_policies
     WHERE schemaname = 'public'
       AND (coalesce(qual, '') ~ legacy OR coalesce(with_check, '') ~ legacy)
  LOOP
    new_qual  := regexp_replace(r.qual,       legacy, 'public.is_admin()', 'g');
    new_check := regexp_replace(r.with_check, legacy, 'public.is_admin()', 'g');

    IF new_qual IS NOT NULL AND new_check IS NOT NULL THEN
      EXECUTE format('ALTER POLICY %I ON %I.%I USING (%s) WITH CHECK (%s)',
                     r.policyname, r.schemaname, r.tablename, new_qual, new_check);
    ELSIF new_qual IS NOT NULL THEN
      EXECUTE format('ALTER POLICY %I ON %I.%I USING (%s)',
                     r.policyname, r.schemaname, r.tablename, new_qual);
    ELSE
      EXECUTE format('ALTER POLICY %I ON %I.%I WITH CHECK (%s)',
                     r.policyname, r.schemaname, r.tablename, new_check);
    END IF;
    changed := changed + 1;
  END LOOP;

  RAISE NOTICE '00060: % policies now use public.is_admin()', changed;

  -- Nothing may be left behind: fail the migration rather than half-fix.
  IF EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public'
       AND (coalesce(qual, '') || coalesce(with_check, '')) LIKE '%profiles.role = ''admin''%'
  ) THEN
    RAISE EXCEPTION '00060: a policy still tests the legacy profiles.role';
  END IF;
END
$$;
