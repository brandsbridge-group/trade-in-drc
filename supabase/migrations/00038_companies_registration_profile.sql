-- 00038_companies_registration_profile.sql
--
-- Registration now forks: Congolese companies fill the RCCM/NIF/province form,
-- international companies fill the seven-step market-entry form (customer
-- design 2026-07-28). Which form was used is triage information admins need,
-- and it must be queryable — until now it was computed in the browser and
-- thrown away.
--
-- This is the applicant's own DECLARATION from the "Choose your company
-- profile" cards, deliberately NOT derived from `country`: a DRC-registered
-- subsidiary of a foreign group may legitimately declare international, and a
-- generated column would silently overrule them.

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS registration_profile text;

-- Backfill: everything registered before the fork used the Congolese form,
-- except rows already flagged as foreign by 00035's country column.
UPDATE public.companies
   SET registration_profile =
       CASE WHEN country IS DISTINCT FROM 'Democratic Republic of the Congo'
            THEN 'international' ELSE 'congolese' END
 WHERE registration_profile IS NULL;

ALTER TABLE public.companies
  ALTER COLUMN registration_profile SET DEFAULT 'congolese';

ALTER TABLE public.companies
  DROP CONSTRAINT IF EXISTS companies_registration_profile_check;
ALTER TABLE public.companies
  ADD CONSTRAINT companies_registration_profile_check
  CHECK (registration_profile IN ('congolese', 'international'));

-- The profile decides which validation branch ran, so an owner must not be able
-- to flip it after insert. Writes come from the service-role client only
-- (see register-company-actions.ts) — same pattern as 00037.
REVOKE UPDATE (registration_profile) ON public.companies FROM authenticated;

-- Admin triage filter: "show me pending international applications".
CREATE INDEX IF NOT EXISTS companies_status_profile_idx
  ON public.companies (status, registration_profile);

COMMENT ON COLUMN public.companies.registration_profile IS
  'Applicant-declared registration path (congolese | international). Set at insert by the service-role client; not owner-writable (00038).';
