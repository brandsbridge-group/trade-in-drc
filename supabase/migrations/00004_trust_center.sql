-- 00004_trust_center.sql
-- Adds public-facing verification tier + curated public summary to companies.
-- Creates schema-only KYP and KYC tables (RLS locked) for future slices.
-- Do NOT apply while Supabase project is paused — run `supabase db push` after unpause.

-- ---------------------------------------------------------------------------
-- Extend companies with trust fields
-- ---------------------------------------------------------------------------
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS verification_tier TEXT
    NOT NULL DEFAULT 'none'
    CHECK (verification_tier IN ('none', 'basic', 'verified', 'premium')),
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_summary JSONB;

COMMENT ON COLUMN public.companies.verification_tier IS
  'Canonical trust tier. Enum: none | basic | verified | premium.';

COMMENT ON COLUMN public.companies.verified_at IS
  'Timestamp of the most recent tier promotion by an admin.';

COMMENT ON COLUMN public.companies.verification_summary IS
  'Public-safe JSON. Shape defined in src/lib/trust/types.ts (VerificationSummary). Never store PII here.';

-- ---------------------------------------------------------------------------
-- Table: kyp_checks  (per-product Know-Your-Product checks — schema only in S2)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kyp_checks (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID        NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
  type        TEXT        NOT NULL CHECK (type IN ('origin', 'quality', 'quantity', 'custom')),
  status      TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'passed', 'failed')),
  summary     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.kyp_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kyp_checks_admin_all" ON public.kyp_checks
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- Table: kyc_individuals  (per-individual KYC checks — schema only in S2)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kyc_individuals (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID        NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  id_doc_status   TEXT        NOT NULL DEFAULT 'pending' CHECK (id_doc_status IN ('pending', 'passed', 'failed')),
  address_status  TEXT        NOT NULL DEFAULT 'pending' CHECK (address_status IN ('pending', 'passed', 'failed')),
  summary         JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.kyc_individuals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kyc_individuals_admin_all" ON public.kyc_individuals
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "kyc_individuals_owner_read" ON public.kyc_individuals
  FOR SELECT TO authenticated
  USING (profile_id = auth.uid());

-- ---------------------------------------------------------------------------
-- updated_at triggers for new tables
-- Note: project already has update_updated_at() from 00001.
-- touch_updated_at() is created here as a project-namespaced alias so the
-- plan's function name resolves; CREATE OR REPLACE is idempotent.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS kyp_checks_updated_at ON public.kyp_checks;
CREATE TRIGGER kyp_checks_updated_at
  BEFORE UPDATE ON public.kyp_checks
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS kyc_individuals_updated_at ON public.kyc_individuals;
CREATE TRIGGER kyc_individuals_updated_at
  BEFORE UPDATE ON public.kyc_individuals
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
