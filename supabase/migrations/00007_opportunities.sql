-- 00007_opportunities.sql
-- Full Opportunities Board: tenders, PPP, investment calls, offers/demands,
-- quotations, partner searches, project launches. Companies submit; admins approve.

CREATE TABLE IF NOT EXISTS public.opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN (
    'tender','ppp','investment_call','offer','demand',
    'quotation','partner_search','project_launch'
  )),
  slug text NOT NULL,
  title_en text NOT NULL,
  title_fr text NOT NULL,
  summary_en text NOT NULL,
  summary_fr text NOT NULL,
  body_en text NOT NULL DEFAULT '',
  body_fr text NOT NULL DEFAULT '',
  budget_min numeric,
  budget_max numeric,
  budget_currency text DEFAULT 'USD',
  deadline_at timestamptz,
  sector_id uuid REFERENCES public.sectors(id) ON DELETE SET NULL,
  region text,
  status text NOT NULL DEFAULT 'pending_review'
    CHECK (status IN ('draft','pending_review','published','rejected','expired')),
  rejected_reason text,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (category, slug)
);

CREATE INDEX IF NOT EXISTS opportunities_pub_idx
  ON public.opportunities (category, status, published_at DESC NULLS LAST)
  WHERE status = 'published';
CREATE INDEX IF NOT EXISTS opportunities_deadline_idx
  ON public.opportunities (deadline_at)
  WHERE status = 'published';
CREATE INDEX IF NOT EXISTS opportunities_company_idx
  ON public.opportunities (company_id);

ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

-- Public sees only published.
CREATE POLICY "opportunities_public_read"
  ON public.opportunities FOR SELECT
  USING (status = 'published');

-- Owner sees own opportunities in any status.
CREATE POLICY "opportunities_owner_read"
  ON public.opportunities FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.companies c
            WHERE c.id = company_id AND c.owner_id = auth.uid())
    OR public.is_admin()
  );

-- Owner inserts in pending_review; email-verified gate enforced.
CREATE POLICY "opportunities_owner_insert"
  ON public.opportunities FOR INSERT TO authenticated
  WITH CHECK (
    public.is_email_verified()
    AND EXISTS (SELECT 1 FROM public.companies c
                WHERE c.id = company_id AND c.owner_id = auth.uid())
    AND status IN ('draft','pending_review')
  );

-- Owner can update their own opportunity, but only when not yet published
-- (after published, only admin can change it).
CREATE POLICY "opportunities_owner_update"
  ON public.opportunities FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.companies c
            WHERE c.id = company_id AND c.owner_id = auth.uid())
    AND status IN ('draft','pending_review','rejected')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.companies c
            WHERE c.id = company_id AND c.owner_id = auth.uid())
    AND status IN ('draft','pending_review')
  );

-- Owner delete only on drafts.
CREATE POLICY "opportunities_owner_delete"
  ON public.opportunities FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.companies c
            WHERE c.id = company_id AND c.owner_id = auth.uid())
    AND status = 'draft'
  );

-- Admin full control.
CREATE POLICY "opportunities_admin_all"
  ON public.opportunities FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- updated_at trigger.
DROP TRIGGER IF EXISTS opportunities_updated ON public.opportunities;
CREATE TRIGGER opportunities_updated BEFORE UPDATE ON public.opportunities
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- published_at guard: auto-stamp when status transitions to 'published'.
CREATE OR REPLACE FUNCTION public.opportunities_published_at_guard()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'published' AND NEW.published_at IS NULL THEN
    NEW.published_at = now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS opportunities_published_at ON public.opportunities;
CREATE TRIGGER opportunities_published_at BEFORE INSERT OR UPDATE
  ON public.opportunities
  FOR EACH ROW EXECUTE FUNCTION public.opportunities_published_at_guard();
