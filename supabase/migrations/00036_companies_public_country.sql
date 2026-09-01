-- 00036_companies_public_country.sql
-- 00035 added companies.country, but the public profile page reads the PII-free
-- `companies_public` projection, which still had no country column — so the
-- company profile query failed for every visitor. Re-declare the view with
-- country included.
--
-- NOTE: CREATE OR REPLACE VIEW can only APPEND columns — inserting country next
-- to province raises 42P16 ("cannot change name of view column"). It is
-- therefore added last. Otherwise identical to 00012, and still PII-free (no
-- contact_email / contact_phone).

CREATE OR REPLACE VIEW public.companies_public
WITH (security_invoker = on) AS
  SELECT
    c.id,
    c.owner_id,
    c.name,
    c.description,
    c.sector_id,
    c.status,
    c.website,
    c.address,
    c.city,
    c.province,
    c.logo_url,
    c.contact_visibility,
    c.created_at,
    c.updated_at,
    c.country
  FROM public.companies c
  WHERE c.status = 'verified';
