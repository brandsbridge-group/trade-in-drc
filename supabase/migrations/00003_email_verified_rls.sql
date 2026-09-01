-- 00003_email_verified_rls.sql
-- Block companies / rfq_listings inserts from users with unverified emails.

CREATE OR REPLACE FUNCTION public.is_email_verified() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth
AS $$
  SELECT COALESCE(
    (SELECT email_confirmed_at IS NOT NULL FROM auth.users WHERE id = auth.uid()),
    false
  );
$$;

-- Lock down execute privileges: only authenticated users invoke this via RLS checks.
REVOKE EXECUTE ON FUNCTION public.is_email_verified() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_email_verified() TO authenticated;

-- companies: drop old policy (named "companies_owner_insert" in 00001), replace with email-verified version
DROP POLICY IF EXISTS "companies_owner_insert" ON public.companies;
CREATE POLICY "companies_owner_verified_email_insert"
  ON public.companies FOR INSERT
  WITH CHECK (auth.uid() = owner_id AND public.is_email_verified());

-- rfq_listings: drop old policy (named "rfq_listings_owner_insert" in 00001), replace with email-verified version
DROP POLICY IF EXISTS "rfq_listings_owner_insert" ON public.rfq_listings;
CREATE POLICY "rfq_listings_owner_verified_email_insert"
  ON public.rfq_listings FOR INSERT
  WITH CHECK (
    public.is_email_verified()
    AND EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = company_id AND c.owner_id = auth.uid()
    )
  );
