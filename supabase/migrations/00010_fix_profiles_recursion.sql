-- 00010_fix_profiles_recursion.sql
-- The profiles_read_own + profiles_update_own policies have inline subqueries
-- against public.profiles to check admin status. When PostgREST evaluates them
-- on every SELECT, RLS triggers the same policy again → infinite recursion
-- ("infinite recursion detected in policy for relation 'profiles'", SQLSTATE 42P17).
-- Fix: replace the inline EXISTS with a call to public.is_admin(), which is
-- SECURITY DEFINER and therefore bypasses RLS when reading profiles.

DROP POLICY IF EXISTS profiles_read_own ON public.profiles;
CREATE POLICY profiles_read_own ON public.profiles
  FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());
