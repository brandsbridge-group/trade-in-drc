-- 00051_profiles_account_type_from_country.sql
--
-- A company owner is the "Admin" of their own dashboard. 00013 modelled that
-- role as profiles.account_type ('congolese_company' | 'international_business')
-- but nothing ever wrote it: handle_new_user() doesn't, the registration
-- wizard doesn't, and 00037 made the column service-role-only. Every company
-- owner therefore resolved to "visitor".
--
-- Rule (product decision 2026-09-30): the account type follows the country of
-- the owner's company. A company registered in the DRC makes its owner a
-- 'congolese_company'; any other country makes them 'international_business'.
-- An owner with several companies is Congolese as soon as one of them is in
-- the DRC, so the result never depends on write order.
--
-- Staff (staff_role set, or legacy role = 'admin') are never touched: their
-- privilege lives in staff_role and setUserRole() clears account_type for them.
--
-- The country literal matches HOME_COUNTRY in src/config/geo.ts and the
-- column default set in 00035.

CREATE OR REPLACE FUNCTION public.sync_owner_account_type(p_owner_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  UPDATE public.profiles p
     SET account_type = CASE
           WHEN EXISTS (
             SELECT 1 FROM public.companies c
              WHERE c.owner_id = p.id
                AND lower(btrim(c.country)) = lower('Democratic Republic of the Congo')
           ) THEN 'congolese_company'
           ELSE 'international_business'
         END
   WHERE p.id = p_owner_id
     AND p.staff_role IS NULL
     AND COALESCE(p.role, 'user') <> 'admin'
     AND EXISTS (SELECT 1 FROM public.companies c WHERE c.owner_id = p.id);
$$;

-- Only the trigger below (and the service role) may call it.
REVOKE EXECUTE ON FUNCTION public.sync_owner_account_type(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_owner_account_type(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.sync_owner_account_type(uuid) FROM authenticated;

CREATE OR REPLACE FUNCTION public.companies_sync_owner_account_type()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.owner_id IS NOT NULL THEN
    PERFORM public.sync_owner_account_type(NEW.owner_id);
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS companies_sync_owner_account_type ON public.companies;
CREATE TRIGGER companies_sync_owner_account_type
  AFTER INSERT OR UPDATE OF country, owner_id ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.companies_sync_owner_account_type();

-- Backfill every existing company owner.
SELECT public.sync_owner_account_type(owner_id)
  FROM (SELECT DISTINCT owner_id FROM public.companies WHERE owner_id IS NOT NULL) o;
