-- 00050_opportunity_sources_and_alerts.sql
-- Opportunities board redesign ("Appels d'offres et opportunités
-- d'investissement"): every notice can cite where it was published and link
-- the tender dossier, and visitors can subscribe to weekly sector alerts.
-- Idempotent.

-- ---------------------------------------------------------------------------
-- 1. Source + dossier on each notice (all optional)
-- ---------------------------------------------------------------------------
--   source_name  – publisher of the original notice ("Journal officiel", a
--                  ministry, the buyer's site…). NULL = submitted directly on
--                  Trade in DRC.
--   source_url   – link to that original publication.
--   document_url – the tender dossier / terms of reference (PDF…).
ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS source_name  text,
  ADD COLUMN IF NOT EXISTS source_url   text,
  ADD COLUMN IF NOT EXISTS document_url text;

ALTER TABLE public.opportunities DROP CONSTRAINT IF EXISTS opportunities_source_url_http;
ALTER TABLE public.opportunities ADD CONSTRAINT opportunities_source_url_http
  CHECK (source_url IS NULL OR source_url ~* '^https?://');
ALTER TABLE public.opportunities DROP CONSTRAINT IF EXISTS opportunities_document_url_http;
ALTER TABLE public.opportunities ADD CONSTRAINT opportunities_document_url_http
  CHECK (document_url IS NULL OR document_url ~* '^https?://');

-- ---------------------------------------------------------------------------
-- 2. Weekly alert subscriptions
-- ---------------------------------------------------------------------------
-- One row per e-mail; re-subscribing updates the followed sectors/provinces.
-- Written only by the server (service role) from the public form, so there is
-- no public policy; admins can read the list.
CREATE TABLE IF NOT EXISTS public.opportunity_alerts (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email           text        NOT NULL,
  sector_ids      uuid[]      NOT NULL DEFAULT '{}',
  provinces       text[]      NOT NULL DEFAULT '{}',
  locale          text        NOT NULL DEFAULT 'fr',
  unsubscribed_at timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT opportunity_alerts_email_unique UNIQUE (email)
);

ALTER TABLE public.opportunity_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "opportunity_alerts_admin_read" ON public.opportunity_alerts;
CREATE POLICY "opportunity_alerts_admin_read" ON public.opportunity_alerts
  FOR SELECT TO authenticated
  USING (public.is_admin());

DROP TRIGGER IF EXISTS opportunity_alerts_updated ON public.opportunity_alerts;
CREATE TRIGGER opportunity_alerts_updated
  BEFORE UPDATE ON public.opportunity_alerts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
