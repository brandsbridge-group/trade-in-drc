-- 00040_pin_declared_columns.sql
--
-- FIX for an ineffective protection shipped in 00038 and 00039.
--
-- Those migrations wrote:
--   REVOKE UPDATE (registration_profile) ON public.companies FROM authenticated;
--   REVOKE UPDATE (promotion_plan, promotion_amount_usd) ON public.business_requests ...
-- which is a NO-OP. In Postgres, revoking a COLUMN privilege does not remove a
-- TABLE-level privilege, and `authenticated` holds table-wide UPDATE on these
-- tables. 00037 got this right for `profiles` by revoking the table grant first
-- and handing back only the safe columns.
--
-- The same trick does not fit here: company owners legitimately update many
-- columns from the browser (src/hooks/use-companies.ts passes an arbitrary
-- patch), so enumerating an allow-list would be brittle and would break editing
-- the moment a new field is added. A BEFORE UPDATE trigger pins just the two
-- declared columns and leaves everything else alone.
--
-- `current_user` reflects the role PostgREST switched to: anon / authenticated
-- for end users, service_role for the admin client. Only the admin client — the
-- one that performs the insert in the first place — may correct these values.

-- ---------------------------------------------------------------------------
-- companies.registration_profile — the applicant's declared path
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.pin_registration_profile()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF current_user <> 'service_role'
     AND NEW.registration_profile IS DISTINCT FROM OLD.registration_profile THEN
    RAISE EXCEPTION
      'registration_profile is set at registration and cannot be changed (migration 00040)'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS companies_pin_registration_profile ON public.companies;
CREATE TRIGGER companies_pin_registration_profile
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.pin_registration_profile();

-- ---------------------------------------------------------------------------
-- business_requests.promotion_plan / promotion_amount_usd — the priced package
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.pin_promotion_plan()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF current_user <> 'service_role'
     AND (NEW.promotion_plan       IS DISTINCT FROM OLD.promotion_plan
       OR NEW.promotion_amount_usd IS DISTINCT FROM OLD.promotion_amount_usd) THEN
    RAISE EXCEPTION
      'promotion_plan/amount are set server-side and cannot be changed (migration 00040)'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS business_requests_pin_promotion_plan ON public.business_requests;
CREATE TRIGGER business_requests_pin_promotion_plan
  BEFORE UPDATE ON public.business_requests
  FOR EACH ROW EXECUTE FUNCTION public.pin_promotion_plan();
