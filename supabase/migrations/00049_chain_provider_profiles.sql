-- 00049_chain_provider_profiles.sql
-- "Complete your operation" chain pages (/market/logistics, /finance,
-- /facilitation, /institutions). Each provider card shows filter chips and four
-- segment-specific facts, so a company's membership in a segment now carries:
--   specialties  text[]  – chip keys (e.g. corridor_matadi, documentary_credit),
--                           defined in src/lib/marketplace/chain.ts
--   attributes   jsonb   – { "<fact key>": "text" | { "en": "…", "fr": "…" } }
-- Institutions get the two facts the directory card needs (what you obtain there,
-- how you access it). Then demo providers are seeded for the three commercial
-- chain segments (fictional names, like the 00034 seed corpus), owned by the
-- seed-corpus owner. Every statement is idempotent.

-- ---------------------------------------------------------------------------
-- 1. Schema
-- ---------------------------------------------------------------------------
ALTER TABLE public.company_segments
  ADD COLUMN IF NOT EXISTS specialties text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS attributes  jsonb  NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS company_segments_specialties_idx
  ON public.company_segments USING gin (specialties);

ALTER TABLE public.institutions
  ADD COLUMN IF NOT EXISTS obtain_en text,
  ADD COLUMN IF NOT EXISTS obtain_fr text,
  ADD COLUMN IF NOT EXISTS access_en text,
  ADD COLUMN IF NOT EXISTS access_fr text;

-- ---------------------------------------------------------------------------
-- 2. Demo providers (fictional)
-- ---------------------------------------------------------------------------
WITH seed_owner AS (
  -- The account that owns the existing seed corpus.
  SELECT owner_id AS id FROM public.companies WHERE slug = 'kongo-central-logistics'
), new_companies (name, slug, description, city, province, tier) AS (
  VALUES
    -- Logistics & transit
    ('Katanga Freight Services',     'katanga-freight-services',     'Road freight and customs transit on the Kasumbalesa corridor, with a container yard in Lubumbashi.',            'Lubumbashi', 'Haut-Katanga',  'verified'),
    ('Great Lakes Transport',        'great-lakes-transport',        'Trucking between Kigali, Goma and Bukavu for general cargo and foodstuffs.',                                     'Goma',       'Nord-Kivu',     'basic'),
    ('Ndjili Consolidation Services','ndjili-consolidation-services','Sea-freight groupage from Europe to Matadi, with a warehouse near Ndjili for inland distribution.',              'Kinshasa',   'Kinshasa',      'verified'),
    -- Finance & payment
    ('Kinshasa Trade Bank',          'kinshasa-trade-bank',          'Commercial bank offering trade finance, letters of credit and FX services to Congolese importers and exporters.', 'Kinshasa',   'Kinshasa',      'verified'),
    ('Congo Commercial Finance',     'congo-commercial-finance',     'Letters of credit and import financing for mining suppliers and construction firms.',                           'Lubumbashi', 'Haut-Katanga',  'verified'),
    ('Matadi Maritime Insurance',    'matadi-maritime-insurance',    'Cargo, marine and trade credit insurance for shipments moving through the Matadi corridor.',                    'Matadi',     'Kongo-Central', 'basic'),
    ('Congo Export Finance Fund',    'congo-export-finance-fund',    'Pre-export and working-capital finance for agricultural processors.',                                           'Kinshasa',   'Kinshasa',      'verified'),
    ('Kivu FX & Payments',           'kivu-fx-payments',             'Currency exchange and cross-border payments for traders in the Kivus.',                                          'Bukavu',     'Sud-Kivu',      'verified'),
    -- Compliance & documentation
    ('DRC Inspection & Certification','drc-inspection-certification','Pre-shipment inspection, sampling and conformity reports for import and export cargo.',                          'Kinshasa',   'Kinshasa',      'verified'),
    ('Congo Customs Brokers SARL',   'congo-customs-brokers-sarl',   'Licensed customs brokerage: tariff classification, declarations and certificates of origin.',                   'Matadi',     'Kongo-Central', 'verified'),
    ('Lubumbashi Materials Lab',     'lubumbashi-materials-lab',     'Materials and ore testing laboratory serving mining and construction.',                                         'Lubumbashi', 'Haut-Katanga',  'basic'),
    ('Kinshasa Regulatory Advisory', 'kinshasa-regulatory-advisory', 'Registration dossiers and sector authorisations for regulated products.',                                        'Kinshasa',   'Kinshasa',      'verified')
)
INSERT INTO public.companies (owner_id, name, slug, description, city, province, country, registration_profile, status, verification_tier, verified_at)
SELECT o.id, n.name, n.slug, n.description, n.city, n.province,
       'Democratic Republic of the Congo', 'congolese', 'verified', n.tier, now()
FROM new_companies n CROSS JOIN seed_owner o
WHERE NOT EXISTS (SELECT 1 FROM public.companies c WHERE c.slug = n.slug);

-- Segment membership + chips + facts (upsert, so re-runs refresh the facts).
INSERT INTO public.company_segments (company_id, segment_key, specialties, attributes)
SELECT c.id, v.segment_key, v.specialties, v.attributes::jsonb
FROM (VALUES
  -- Logistics: corridors · modes · licence · storage
  ('kongo-central-logistics', 'logistics', ARRAY['corridor_matadi','sea','road','bonded'],
   '{"corridors":"Matadi → Kinshasa","modes":{"en":"Sea, road","fr":"Maritime, routier"},"licence":{"en":"Licensed customs agent","fr":"Commissionnaire agréé"},"storage":{"en":"Bonded warehouse","fr":"Entrepôt sous douane"}}'),
  ('katanga-freight-services', 'logistics', ARRAY['corridor_kasumbalesa','road','bonded'],
   '{"corridors":"Kasumbalesa → Lubumbashi","modes":{"en":"Road","fr":"Routier"},"licence":{"en":"Licensed","fr":"Agréé"},"storage":{"en":"Container yard","fr":"Parc à conteneurs"}}'),
  ('great-lakes-transport', 'logistics', ARRAY['corridor_kigali','road'],
   '{"corridors":"Kigali → Goma","modes":{"en":"Road","fr":"Routier"},"licence":{"en":"To be confirmed","fr":"À confirmer"},"storage":{"en":"None","fr":"Non"}}'),
  ('ndjili-consolidation-services', 'logistics', ARRAY['corridor_matadi','sea'],
   '{"corridors":{"en":"Europe groupage → Matadi","fr":"Groupage Europe → Matadi"},"modes":{"en":"Sea","fr":"Maritime"},"licence":{"en":"Licensed","fr":"Agréé"},"storage":{"en":"Ndjili warehouse","fr":"Entrepôt Ndjili"}}'),
  -- Finance: instruments · currencies · sectors · lead time
  ('kinshasa-trade-bank', 'finance', ARRAY['documentary_credit','bank_guarantee','fx'],
   '{"instruments":{"en":"Letter of credit, guarantee","fr":"Crédit documentaire, garantie"},"currencies":"USD, EUR, CDF","sectors":{"en":"Mining, agri, distribution","fr":"Mines, agro, distribution"},"lead_time":{"en":"10 days","fr":"10 jours"}}'),
  ('congo-commercial-finance', 'finance', ARRAY['documentary_credit','import_finance'],
   '{"instruments":{"en":"Letter of credit","fr":"Crédit documentaire"},"currencies":"USD, CDF","sectors":{"en":"Mining, construction","fr":"Mines, BTP"},"lead_time":{"en":"15 days","fr":"15 jours"}}'),
  ('matadi-maritime-insurance', 'finance', ARRAY['cargo_insurance'],
   '{"instruments":{"en":"Cargo insurance","fr":"Assurance cargaison"},"currencies":"USD","sectors":{"en":"All sectors","fr":"Tous secteurs"},"lead_time":{"en":"5 days","fr":"5 jours"}}'),
  ('congo-export-finance-fund', 'finance', ARRAY['import_finance'],
   '{"instruments":{"en":"Export finance","fr":"Financement export"},"currencies":"USD, EUR","sectors":{"en":"Agri, processing","fr":"Agro, transformation"},"lead_time":{"en":"3 weeks","fr":"3 semaines"}}'),
  ('kivu-fx-payments', 'finance', ARRAY['fx'],
   '{"instruments":{"en":"FX, transfers","fr":"Change, transferts"},"currencies":"USD, CDF","sectors":{"en":"Trade, services","fr":"Commerce, services"},"lead_time":{"en":"48 hours","fr":"48 heures"}}'),
  -- Compliance: accreditations · controls · documents · lead time
  ('drc-inspection-certification', 'facilitation', ARRAY['pre_inspection','standards_testing'],
   '{"accreditations":"ISO/IEC 17020","controls":{"en":"Pre-shipment inspection, sampling","fr":"Pré-inspection, échantillonnage"},"documents":{"en":"Conformity report","fr":"Rapport de conformité"},"lead_time":{"en":"3 days","fr":"3 jours"}}'),
  ('congo-customs-brokers-sarl', 'facilitation', ARRAY['tariff_classification','origin_certificate'],
   '{"accreditations":{"en":"Customs licence","fr":"Agrément douane"},"controls":{"en":"Tariff classification","fr":"Classement tarifaire"},"documents":{"en":"Declaration, origin","fr":"Déclaration, origine"},"lead_time":{"en":"2 days","fr":"2 jours"}}'),
  ('lubumbashi-materials-lab', 'facilitation', ARRAY['standards_testing'],
   '{"accreditations":"ISO/IEC 17025","controls":{"en":"Materials testing","fr":"Essais matériaux"},"documents":{"en":"Test report","fr":"Procès-verbal d’essai"},"lead_time":{"en":"7 days","fr":"7 jours"}}'),
  ('kinshasa-regulatory-advisory', 'facilitation', ARRAY['health_products','origin_certificate'],
   '{"controls":{"en":"Registration dossiers","fr":"Dossiers d’homologation"},"documents":{"en":"Sector authorisations","fr":"Autorisations sectorielles"},"lead_time":{"en":"3 weeks","fr":"3 semaines"}}'),
  ('kongo-central-logistics', 'facilitation', ARRAY['tariff_classification'],
   '{"accreditations":{"en":"Customs licence","fr":"Agrément douane"},"controls":{"en":"Customs clearance","fr":"Dédouanement"},"documents":{"en":"Customs declaration","fr":"Déclaration en douane"},"lead_time":{"en":"2 days","fr":"2 jours"}}')
) AS v(slug, segment_key, specialties, attributes)
JOIN public.companies c ON c.slug = v.slug
ON CONFLICT (company_id, segment_key) DO UPDATE
  SET specialties = EXCLUDED.specialties,
      attributes  = EXCLUDED.attributes;
