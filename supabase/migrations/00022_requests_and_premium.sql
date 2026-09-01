-- 00022_requests_and_premium.sql
-- Customer batch 2026-06-04: two new lead/intake workflows + company premium tier.
--
--   1. business_requests   — public "Tell Us What You Are Looking For" / "Request a Service"
--                            submissions. Authenticated users only. Admin triages them in
--                            the /admin/requests "Received Requests" dashboard.
--   2. premium_requests    — a company owner requests the Premium package
--                            (Congolese $3,000/yr or International $3,600/yr). Admin
--                            reviews; on approval the company gets premium flags below.
--   3. companies.is_premium et al — admin-only (REVOKE UPDATE) trust columns, granted on
--                            premium_request approval. Mirrors the existing
--                            status/verification_tier REVOKE pattern (00011).
--
-- Idempotent: safe to run repeatedly (IF NOT EXISTS + DROP POLICY IF EXISTS).

-- =====================================================================
-- 1. business_requests
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.business_requests (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submitter_id       UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  company_id         UUID REFERENCES public.companies (id) ON DELETE SET NULL,
  -- 'business' = "Tell Us What You Are Looking For"; 'service' = "Request a Service".
  kind               TEXT NOT NULL DEFAULT 'business'
                       CHECK (kind IN ('business', 'service')),
  -- What the requester wants (maps to the request-type cards on the Request page).
  intent             TEXT NOT NULL DEFAULT 'other'
                       CHECK (intent IN (
                         'find_partner', 'invest', 'sell', 'buy',
                         'publish_opportunity', 'register_company',
                         'market_report', 'business_mission',
                         'partner_search', 'market_entry', 'business_verification',
                         'b2b_meeting', 'local_representation', 'delegation',
                         'other')),
  full_name          TEXT NOT NULL,
  company_name       TEXT,
  country            TEXT,
  email              TEXT NOT NULL,
  phone              TEXT,
  sector             TEXT,
  preferred_location TEXT,
  timeline           TEXT,
  message            TEXT NOT NULL,
  status             TEXT NOT NULL DEFAULT 'new'
                       CHECK (status IN ('new', 'in_progress', 'converted', 'pending', 'closed', 'rejected')),
  follow_up_owner    TEXT,
  admin_notes        TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS business_requests_status_idx     ON public.business_requests (status);
CREATE INDEX IF NOT EXISTS business_requests_submitter_idx  ON public.business_requests (submitter_id);
CREATE INDEX IF NOT EXISTS business_requests_created_idx    ON public.business_requests (created_at DESC);
CREATE INDEX IF NOT EXISTS business_requests_kind_idx       ON public.business_requests (kind);

DROP TRIGGER IF EXISTS business_requests_updated ON public.business_requests;
CREATE TRIGGER business_requests_updated
  BEFORE UPDATE ON public.business_requests
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.business_requests ENABLE ROW LEVEL SECURITY;

-- Authenticated user submits their own request.
DROP POLICY IF EXISTS business_requests_owner_insert ON public.business_requests;
CREATE POLICY business_requests_owner_insert
  ON public.business_requests FOR INSERT TO authenticated
  WITH CHECK (submitter_id = auth.uid());

-- Submitter reads their own requests; admin reads all.
DROP POLICY IF EXISTS business_requests_owner_read ON public.business_requests;
CREATE POLICY business_requests_owner_read
  ON public.business_requests FOR SELECT TO authenticated
  USING (submitter_id = auth.uid() OR public.is_admin());

-- Admin triages (status / follow_up_owner / admin_notes).
DROP POLICY IF EXISTS business_requests_admin_update ON public.business_requests;
CREATE POLICY business_requests_admin_update
  ON public.business_requests FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS business_requests_admin_delete ON public.business_requests;
CREATE POLICY business_requests_admin_delete
  ON public.business_requests FOR DELETE TO authenticated
  USING (public.is_admin());

-- A submitter must never silently flip workflow columns by re-submitting.
REVOKE UPDATE (status, follow_up_owner, admin_notes) ON public.business_requests FROM authenticated;

-- =====================================================================
-- 2. premium_requests
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.premium_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES public.companies (id) ON DELETE CASCADE,
  requested_by  UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  plan          TEXT NOT NULL CHECK (plan IN ('congolese', 'international')),
  amount_usd    INTEGER NOT NULL CHECK (amount_usd > 0),
  billing_period TEXT NOT NULL DEFAULT 'year' CHECK (billing_period IN ('year')),
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  admin_notes   TEXT,
  reviewed_by   UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  reviewed_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS premium_requests_status_idx  ON public.premium_requests (status);
CREATE INDEX IF NOT EXISTS premium_requests_company_idx ON public.premium_requests (company_id);
CREATE INDEX IF NOT EXISTS premium_requests_created_idx ON public.premium_requests (created_at DESC);

-- At most one open (pending) premium request per company.
CREATE UNIQUE INDEX IF NOT EXISTS premium_requests_one_open_per_company
  ON public.premium_requests (company_id) WHERE status = 'pending';

DROP TRIGGER IF EXISTS premium_requests_updated ON public.premium_requests;
CREATE TRIGGER premium_requests_updated
  BEFORE UPDATE ON public.premium_requests
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.premium_requests ENABLE ROW LEVEL SECURITY;

-- Company owner requests premium for a company they own.
DROP POLICY IF EXISTS premium_requests_owner_insert ON public.premium_requests;
CREATE POLICY premium_requests_owner_insert
  ON public.premium_requests FOR INSERT TO authenticated
  WITH CHECK (
    requested_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = company_id AND c.owner_id = auth.uid()
    )
  );

-- Owner reads their company's requests; admin reads all.
DROP POLICY IF EXISTS premium_requests_owner_read ON public.premium_requests;
CREATE POLICY premium_requests_owner_read
  ON public.premium_requests FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR requested_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = company_id AND c.owner_id = auth.uid()
    )
  );

-- Owner may cancel their own pending request (status -> cancelled only, enforced in app).
DROP POLICY IF EXISTS premium_requests_owner_update ON public.premium_requests;
CREATE POLICY premium_requests_owner_update
  ON public.premium_requests FOR UPDATE TO authenticated
  USING (
    requested_by = auth.uid()
    AND status = 'pending'
  )
  WITH CHECK (requested_by = auth.uid());

-- Admin reviews (approve/reject) any request.
DROP POLICY IF EXISTS premium_requests_admin_update ON public.premium_requests;
CREATE POLICY premium_requests_admin_update
  ON public.premium_requests FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS premium_requests_admin_delete ON public.premium_requests;
CREATE POLICY premium_requests_admin_delete
  ON public.premium_requests FOR DELETE TO authenticated
  USING (public.is_admin());

-- Owner can only set review fields via admin; lock them down.
REVOKE UPDATE (status, admin_notes, reviewed_by, reviewed_at, amount_usd, plan)
  ON public.premium_requests FROM authenticated;

-- =====================================================================
-- 3. companies premium flags (admin-only, granted on approval)
-- =====================================================================
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS is_premium        BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS premium_plan      TEXT
  CHECK (premium_plan IS NULL OR premium_plan IN ('congolese', 'international'));
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS premium_since     TIMESTAMPTZ;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMPTZ;

COMMENT ON COLUMN public.companies.is_premium IS
  'Admin-granted premium membership. Set only on premium_request approval (service-role).';

-- Same lockdown as the trust columns (00011): owners cannot self-grant premium.
REVOKE UPDATE (is_premium, premium_plan, premium_since, premium_expires_at)
  ON public.companies FROM authenticated;
