-- 00041_companies_premium_plan_strategic.sql
--
-- 00039 widened `premium_requests.plan` to admit the new
-- 'international_strategic' tier (USD 6,000) but left `companies.premium_plan`
-- pinned to the original two values. The two are written together when a
-- promotion is granted, so approving the new tier failed at the second step:
--
--   new row for relation "companies" violates check constraint
--   "companies_premium_plan_check"
--
-- i.e. the premium_requests row was recorded as approved while the company
-- never actually became premium. Found by exercising the grant end-to-end.

ALTER TABLE public.companies
  DROP CONSTRAINT IF EXISTS companies_premium_plan_check;

ALTER TABLE public.companies
  ADD CONSTRAINT companies_premium_plan_check
  CHECK (
    premium_plan IS NULL
    OR premium_plan IN ('congolese', 'international', 'international_strategic')
  );

COMMENT ON COLUMN public.companies.premium_plan IS
  'Granted promotion package. Must stay in step with premium_requests.plan (00039) and src/config/promotion-plans.ts.';
