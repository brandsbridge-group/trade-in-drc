-- 00037_profiles_privilege_lockdown.sql
--
-- SECURITY FIX — privilege escalation.
--
-- `profiles_update_own` (00010) authorises a row with
--   USING (auth.uid() = id OR public.is_admin())
--   WITH CHECK (auth.uid() = id OR public.is_admin())
-- which is correct at ROW level but says nothing about COLUMNS. Postgres RLS
-- cannot restrict columns, and `authenticated` holds a table-wide UPDATE grant,
-- so any signed-in user could run
--   UPDATE profiles SET role = 'admin' WHERE id = auth.uid();
-- and the WITH CHECK still passed, because the row was still their own.
-- Reproduced against production: an ordinary user became `admin`.
--
-- Column-level privileges are the correct mechanism. RLS keeps restricting
-- WHICH ROW may be touched; these grants restrict WHICH COLUMNS.
--
-- Safe for existing behaviour:
--   * the only self-service write is dashboard/settings -> full_name
--   * every role/staff_role/account_type write goes through
--     src/lib/admin/users-actions.ts, which uses the SERVICE ROLE client and
--     therefore bypasses column grants entirely
--   * handle_new_user() is SECURITY DEFINER and is likewise unaffected

-- Drop the blanket UPDATE, then hand back only the self-service columns.
REVOKE UPDATE ON public.profiles FROM authenticated;
REVOKE UPDATE ON public.profiles FROM anon;

GRANT UPDATE (full_name, avatar_url) ON public.profiles TO authenticated;

-- anon must never write a profile at all.
REVOKE INSERT, DELETE ON public.profiles FROM anon;

COMMENT ON COLUMN public.profiles.role IS
  'Privileged. Writable only by the service-role client (see 00037) — never by the end user.';
COMMENT ON COLUMN public.profiles.staff_role IS
  'Privileged. Writable only by the service-role client (see 00037).';
COMMENT ON COLUMN public.profiles.account_type IS
  'Privileged. Writable only by the service-role client (see 00037).';
