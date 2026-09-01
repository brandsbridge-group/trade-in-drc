-- 00029: institutional contacts directory (customer design 4).
-- Public DRC agencies / chambers / regulators that international businesses
-- need when entering the market. Public read; writes are service-role/admin only.

CREATE TABLE IF NOT EXISTS public.institutions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  acronym         TEXT NOT NULL,
  name_en         TEXT NOT NULL,
  name_fr         TEXT NOT NULL,
  category        TEXT NOT NULL DEFAULT 'other'
                    CHECK (category IN (
                      'investment_promotion', 'business_registration',
                      'chambers_networks', 'sector_regulators',
                      'provincial_support', 'export_trade',
                      'finance_tax', 'legal_judicial', 'education_training', 'other')),
  description_en  TEXT NOT NULL,
  description_fr  TEXT NOT NULL,
  city            TEXT,
  province        TEXT,
  website         TEXT,
  email           TEXT,
  phone           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS institutions_category_idx ON public.institutions (category);

ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "institutions_public_read" ON public.institutions;
CREATE POLICY "institutions_public_read"
  ON public.institutions FOR SELECT
  USING (true);
