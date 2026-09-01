-- 00023_premium_hardening.sql
-- Hardening pass from the 2026-06-04 ship-wreck-check review of 00022.
--
-- Three defense-in-depth fixes, all idempotent (safe to re-run on the LIVE
-- GOVERNMENT PRODUCTION database via `supabase db push`):
--
--   1. Pin amount_usd to plan on premium_requests.
--      ship-wreck-check finding: 00022 only checks `amount_usd > 0`, so a
--      company owner could forge a cheaper amount via a direct PostgREST insert
--      (the owner_insert policy never validates the price). A CHECK constraint
--      ties each plan to its canonical yearly price: congolese = $3,000,
--      international = $3,600. The amount can no longer be lied about.
--
--   2. Drop the dead/misleading premium_requests_owner_update policy.
--      ship-wreck-check finding: 00022 REVOKEs UPDATE on (status, ...) from
--      `authenticated`, so the owner_update policy — which exists purely to let
--      an owner flip status to 'cancelled' — can NEVER function (the column
--      grant is gone). It is dead code that misleads future readers into
--      thinking owners self-cancel via RLS. Owners will instead cancel through a
--      service-role server action. Removing the policy makes the real contract
--      honest.
--
--   3. Defense-in-depth WITH CHECK on companies_owner_update for premium columns.
--      ship-wreck-check finding: 00022 added is_premium/premium_plan/
--      premium_since/premium_expires_at and REVOKEd UPDATE on them, but the
--      companies_owner_update RLS policy (from 00011) does not pin them. If a
--      future migration accidentally re-GRANTs those columns, an owner could
--      self-grant premium. We re-create the EXACT 00011 policy verbatim and add
--      four NOT-DISTINCT-FROM conjuncts to its WITH CHECK, mirroring exactly how
--      00011 pins status / verification_tier / verified_at / verification_summary.

-- ===========================================================================
-- 1. Pin premium_requests.amount_usd to the plan (anti-forgery).
-- ===========================================================================
ALTER TABLE public.premium_requests
  DROP CONSTRAINT IF EXISTS premium_requests_amount_matches_plan;
ALTER TABLE public.premium_requests
  ADD CONSTRAINT premium_requests_amount_matches_plan
  CHECK ((plan = 'congolese' AND amount_usd = 3000)
      OR (plan = 'international' AND amount_usd = 3600));

-- ===========================================================================
-- 2. Drop the dead owner_update policy (status is REVOKE'd from owners, so it
--    can never function; owners cancel via a service-role server action).
-- ===========================================================================
DROP POLICY IF EXISTS premium_requests_owner_update ON public.premium_requests;

-- ===========================================================================
-- 3. Re-assert companies_owner_update (verbatim 00011) + pin premium columns.
--    Only the four premium conjuncts are ADDED to the WITH CHECK; every
--    existing condition is preserved exactly as written in 00011.
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
    -- Owners may not alter premium columns either (re-GRANT defense-in-depth).
    AND is_premium IS NOT DISTINCT FROM (SELECT c.is_premium FROM public.companies c WHERE c.id = companies.id)
    AND premium_plan IS NOT DISTINCT FROM (SELECT c.premium_plan FROM public.companies c WHERE c.id = companies.id)
    AND premium_since IS NOT DISTINCT FROM (SELECT c.premium_since FROM public.companies c WHERE c.id = companies.id)
    AND premium_expires_at IS NOT DISTINCT FROM (SELECT c.premium_expires_at FROM public.companies c WHERE c.id = companies.id)
  );
