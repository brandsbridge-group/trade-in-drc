-- 00034_marketplace_investors_segment.sql
-- The DRC Business Marketplace redesign (latest-designs/marketplace-drc-business.ai)
-- adds a 9th category — "Investors & More" — and expects every category card to
-- resolve to real companies. This migration:
--   1. registers the `investors` segment,
--   2. seeds finance / facilitation / investors companies (the marketplace had
--      none; names are fictional, matching the existing seed corpus),
--   3. back-fills company_segments for the already-seeded companies so the
--      manufacturer / exporter / importer / logistics cards are populated.
-- Government bodies and public corporations are intentionally NOT seeded here:
-- those cards link to the real institutions directory (see 00029_institutions).
-- Every statement is idempotent.

-- ---------------------------------------------------------------------------
-- 1. Ninth segment
-- ---------------------------------------------------------------------------
-- 00006 pinned `segments.key` to the original eight via a CHECK constraint.
-- Widen it so the ninth category can be inserted.
ALTER TABLE public.segments DROP CONSTRAINT IF EXISTS segments_key_check;
ALTER TABLE public.segments ADD CONSTRAINT segments_key_check CHECK (key IN (
  'manufacturer','importer','exporter','finance',
  'logistics','government','public_corp','facilitation','investors'
));

INSERT INTO public.segments (key, name_en, name_fr, name_es, name_tr, name_zh, sort_order) VALUES
  ('investors', 'Investors & More', 'Investisseurs et plus', 'Inversores y más', 'Yatırımcılar ve Daha Fazlası', '投资者及更多', 9)
ON CONFLICT (key) DO UPDATE
  SET name_en    = EXCLUDED.name_en,
      name_fr    = EXCLUDED.name_fr,
      name_es    = EXCLUDED.name_es,
      name_tr    = EXCLUDED.name_tr,
      name_zh    = EXCLUDED.name_zh,
      sort_order = EXCLUDED.sort_order;

-- ---------------------------------------------------------------------------
-- 2. Seed companies for the three empty commercial categories
-- ---------------------------------------------------------------------------
WITH seed_owner AS (
  SELECT id FROM public.profiles ORDER BY created_at LIMIT 1
), new_companies (name, slug, description, city, province, segment_key) AS (
  VALUES
    -- Finance & Banking
    ('Kinshasa Trade Bank',           'kinshasa-trade-bank',           'Commercial bank offering trade finance, letters of credit and FX services to Congolese importers and exporters.', 'Kinshasa',   'Kinshasa',      'finance'),
    ('Congo Commercial Finance',      'congo-commercial-finance',      'Working-capital and invoice financing for small and medium enterprises across the DRC.',                         'Lubumbashi', 'Haut-Katanga',  'finance'),
    ('Katanga Credit Union',          'katanga-credit-union',          'Cooperative lender serving mining suppliers and agricultural cooperatives in the south-east.',                   'Kolwezi',    'Lualaba',       'finance'),
    ('Lualaba Trade Finance SA',      'lualaba-trade-finance-sa',      'Structured commodity finance and export credit insurance for mineral exporters.',                               'Kolwezi',    'Lualaba',       'finance'),
    ('Kivu Microfinance Group',       'kivu-microfinance-group',       'Microfinance and payment services for small traders and producer cooperatives in the Kivus.',                    'Bukavu',     'Sud-Kivu',      'finance'),
    ('Matadi Maritime Insurance',     'matadi-maritime-insurance',     'Cargo, marine and trade credit insurance for shipments moving through the Matadi corridor.',                    'Matadi',     'Kongo-Central', 'finance'),
    -- Trade facilitation & service providers
    ('Congo Customs Brokers SARL',    'congo-customs-brokers-sarl',    'Licensed customs brokerage handling clearance, documentation and duty optimisation.',                           'Matadi',     'Kongo-Central', 'facilitation'),
    ('Kinshasa Trade Advisory',       'kinshasa-trade-advisory',       'Market-entry consulting, partner due diligence and regulatory compliance advisory.',                            'Kinshasa',   'Kinshasa',      'facilitation'),
    ('DRC Inspection & Certification','drc-inspection-certification',  'Pre-shipment inspection, quality certification and laboratory testing for export cargo.',                       'Lubumbashi', 'Haut-Katanga',  'facilitation'),
    ('Congo Legal Partners',          'congo-legal-partners',          'Corporate and commercial law firm advising on contracts, joint ventures and dispute resolution.',                'Kinshasa',   'Kinshasa',      'facilitation'),
    ('Goma Business Services',        'goma-business-services',        'Company formation, accounting and payroll services for businesses entering the eastern DRC.',                    'Goma',       'Nord-Kivu',     'facilitation'),
    -- Investors & more
    ('Congo Growth Capital',          'congo-growth-capital',          'Private equity fund backing mid-market manufacturing and agribusiness ventures in the DRC.',                    'Kinshasa',   'Kinshasa',      'investors'),
    ('Katanga Mining Ventures',       'katanga-mining-ventures',       'Investment vehicle funding exploration, processing and mine-service projects.',                                 'Lubumbashi', 'Haut-Katanga',  'investors'),
    ('Great Lakes Impact Fund',       'great-lakes-impact-fund',       'Impact investor financing agriculture, clean energy and women-led enterprises in the Great Lakes region.',       'Bukavu',     'Sud-Kivu',      'investors'),
    ('Kinshasa Angel Network',        'kinshasa-angel-network',        'Angel syndicate providing seed capital and mentoring to Congolese technology founders.',                        'Kinshasa',   'Kinshasa',      'investors'),
    ('Congo Infrastructure Partners', 'congo-infrastructure-partners', 'Long-horizon investor in transport, logistics and power infrastructure projects.',                              'Kinshasa',   'Kinshasa',      'investors')
)
INSERT INTO public.companies (owner_id, name, slug, description, city, province, status, verification_tier)
SELECT o.id, n.name, n.slug, n.description, n.city, n.province, 'verified', 'verified'
FROM new_companies n CROSS JOIN seed_owner o
WHERE NOT EXISTS (SELECT 1 FROM public.companies c WHERE c.slug = n.slug);

-- Link the freshly seeded companies to their category.
INSERT INTO public.company_segments (company_id, segment_key)
SELECT c.id, v.segment_key
FROM (VALUES
  ('kinshasa-trade-bank','finance'), ('congo-commercial-finance','finance'),
  ('katanga-credit-union','finance'), ('lualaba-trade-finance-sa','finance'),
  ('kivu-microfinance-group','finance'), ('matadi-maritime-insurance','finance'),
  ('congo-customs-brokers-sarl','facilitation'), ('kinshasa-trade-advisory','facilitation'),
  ('drc-inspection-certification','facilitation'), ('congo-legal-partners','facilitation'),
  ('goma-business-services','facilitation'),
  ('congo-growth-capital','investors'), ('katanga-mining-ventures','investors'),
  ('great-lakes-impact-fund','investors'), ('kinshasa-angel-network','investors'),
  ('congo-infrastructure-partners','investors')
) AS v(slug, segment_key)
JOIN public.companies c ON c.slug = v.slug
ON CONFLICT (company_id, segment_key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. Back-fill segments for the existing seeded companies
-- ---------------------------------------------------------------------------
-- Manufacturers — processors and industrial producers.
INSERT INTO public.company_segments (company_id, segment_key)
SELECT id, 'manufacturer' FROM public.companies
WHERE status = 'verified'
  AND name ~* '(mills|works|industries|refinery|refiners|cement|steel|packaging|labs|textiles|leather|furniture|beverages|agrofoods|sugar|cable)'
ON CONFLICT (company_id, segment_key) DO NOTHING;

-- Exporters — anything explicitly exporting, plus primary-produce cooperatives.
INSERT INTO public.company_segments (company_id, segment_key)
SELECT id, 'exporter' FROM public.companies
WHERE status = 'verified'
  AND name ~* '(export|cocoa|coffee|tea|arabica|honey|rubber|timber|hardwood|forest|palm|cassava|fish|copper|cobalt|coltan|cassiterite|diamond|gold)'
ON CONFLICT (company_id, segment_key) DO NOTHING;

-- Importers — distributors bringing goods into the DRC market.
INSERT INTO public.company_segments (company_id, segment_key)
SELECT id, 'importer' FROM public.companies
WHERE status = 'verified'
  AND name ~* '(distribution|supplies|supply|spares|parts|trading house|materials|equipment|machinery|pharma|medical|office)'
ON CONFLICT (company_id, segment_key) DO NOTHING;

-- Logistics & shipping.
INSERT INTO public.company_segments (company_id, segment_key)
SELECT id, 'logistics' FROM public.companies
WHERE status = 'verified'
  AND name ~* '(logistics|transport|port|shipping|freight)'
ON CONFLICT (company_id, segment_key) DO NOTHING;
