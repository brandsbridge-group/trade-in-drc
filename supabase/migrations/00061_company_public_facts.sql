-- Public company page: expose the handful of registration facts a buyer may
-- read (trading name, year, legal form, headcount) without shipping the whole
-- `verification_summary` to the browser. That JSON also holds the legal
-- identifiers, the contact person and staff's review notes, which are not
-- public; the page used to select the column whole.
--
-- Same visibility as the company itself: verified companies for everyone, any
-- status for the owner and for staff.

CREATE OR REPLACE FUNCTION public.company_public_facts(p_company_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT jsonb_build_object(
           'trading_name',     NULLIF(btrim(c.verification_summary #>> '{registration_intake,legal,trading_name}'), ''),
           'year_established', NULLIF(btrim(c.verification_summary #>> '{registration_intake,legal,year_established}'), ''),
           'legal_form',       NULLIF(btrim(c.verification_summary #>> '{registration_intake,legal,legal_form}'), ''),
           'employees',        NULLIF(btrim(c.verification_summary #>> '{registration_intake,legal,employees}'), '')
         )
    FROM public.companies c
   WHERE c.id = p_company_id
     AND (c.status = 'verified' OR c.owner_id = auth.uid() OR public.is_admin());
$$;

REVOKE ALL ON FUNCTION public.company_public_facts(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.company_public_facts(uuid) TO anon, authenticated;
