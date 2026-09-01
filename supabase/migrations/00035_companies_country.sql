-- 00035_companies_country.sql
-- The registration wizard now accepts international companies, not only
-- Congolese ones (customer request 2026-07-25: "we agreed on registration for
-- international companies but the form is only for congolese"). Companies
-- therefore need a country of registration; `province` alone assumed the DRC.

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS country text;

-- Everything registered before this change was Congolese by construction
-- (the form only accepted DRC provinces).
UPDATE public.companies
   SET country = 'Democratic Republic of the Congo'
 WHERE country IS NULL;

ALTER TABLE public.companies
  ALTER COLUMN country SET DEFAULT 'Democratic Republic of the Congo';

CREATE INDEX IF NOT EXISTS companies_country_idx ON public.companies (country);

COMMENT ON COLUMN public.companies.country IS
  'Country of registration. Non-DRC companies leave province blank or free-text.';
