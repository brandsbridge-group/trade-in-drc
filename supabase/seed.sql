-- =============================================================================
-- TradeInDRC seed data
-- Idempotent: re-running is safe. Uses fixed UUIDs + ON CONFLICT.
-- Run order: assumes migrations 00001..00009 applied.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Demo accounts (auth.users + profiles auto-created via handle_new_user trigger)
-- IMPORTANT: GoTrue expects token columns to be '' (empty string), not NULL.
-- Inserting via raw SQL without them returns NULL and breaks login with
-- "Database error querying schema". We set them explicitly here.
-- -----------------------------------------------------------------------------
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_sent_at,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  phone_change, phone_change_token, email_change_token_current, reauthentication_token
) VALUES
  ('11111111-1111-1111-1111-111111111111',
   '00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated',
   'demo-owner@tradeindrc.example',
   crypt('demo-tradeindrc-2026', gen_salt('bf')),
   now(),
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"full_name":"Demo Owner"}'::jsonb,
   now(), now(), now(),
   '', '', '', '', '', '', '', ''),
  ('22222222-2222-2222-2222-222222222222',
   '00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated',
   'demo-user@tradeindrc.example',
   crypt('demo-user-2026', gen_salt('bf')),
   now(),
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"full_name":"Demo User"}'::jsonb,
   now(), now(), now(),
   '', '', '', '', '', '', '', '')
ON CONFLICT (id) DO NOTHING;

UPDATE public.profiles SET role = 'admin' WHERE id = '11111111-1111-1111-1111-111111111111';
UPDATE public.profiles SET role = 'user'  WHERE id = '22222222-2222-2222-2222-222222222222';

-- -----------------------------------------------------------------------------
-- 2. Sectors (10) — fixed UUIDs
-- -----------------------------------------------------------------------------
INSERT INTO public.sectors (id, name_en, name_fr, slug, parent_id) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Mining & Minerals',  'Mines & Minéraux',         'mining-minerals',  NULL),
  ('a0000000-0000-0000-0000-000000000002', 'Agriculture',        'Agriculture',              'agriculture',      NULL),
  ('a0000000-0000-0000-0000-000000000003', 'Forestry & Timber',  'Foresterie & Bois',        'forestry-timber',  NULL),
  ('a0000000-0000-0000-0000-000000000004', 'Oil & Gas',          'Pétrole & Gaz',            'oil-gas',          NULL),
  ('a0000000-0000-0000-0000-000000000005', 'Manufacturing',      'Fabrication',              'manufacturing',    NULL),
  ('a0000000-0000-0000-0000-000000000006', 'Textiles & Apparel', 'Textiles & Habillement',   'textiles-apparel', NULL),
  ('a0000000-0000-0000-0000-000000000007', 'Food & Beverages',   'Alimentation & Boissons',  'food-beverages',   NULL),
  ('a0000000-0000-0000-0000-000000000008', 'Construction',       'Construction',             'construction',     NULL),
  ('a0000000-0000-0000-0000-000000000009', 'Technology',         'Technologie',              'technology',       NULL),
  ('a0000000-0000-0000-0000-00000000000a', 'Energy',             'Énergie',                  'energy',           NULL)
ON CONFLICT (id) DO UPDATE SET
  name_en = EXCLUDED.name_en, name_fr = EXCLUDED.name_fr;

-- -----------------------------------------------------------------------------
-- 3. Categories per sector
-- -----------------------------------------------------------------------------
INSERT INTO public.categories (id, name_en, name_fr, slug, sector_id) VALUES
  -- Mining
  ('b1000000-0000-0000-0000-000000000001', 'Copper',     'Cuivre',          'copper',     'a0000000-0000-0000-0000-000000000001'),
  ('b1000000-0000-0000-0000-000000000002', 'Cobalt',     'Cobalt',          'cobalt',     'a0000000-0000-0000-0000-000000000001'),
  ('b1000000-0000-0000-0000-000000000003', 'Gold',       'Or',              'gold',       'a0000000-0000-0000-0000-000000000001'),
  ('b1000000-0000-0000-0000-000000000004', 'Coltan',     'Coltan',          'coltan',     'a0000000-0000-0000-0000-000000000001'),
  ('b1000000-0000-0000-0000-000000000005', 'Diamonds',   'Diamants',        'diamonds',   'a0000000-0000-0000-0000-000000000001'),
  ('b1000000-0000-0000-0000-000000000006', 'Iron Ore',   'Minerai de Fer',  'iron-ore',   'a0000000-0000-0000-0000-000000000001'),
  -- Agriculture
  ('b2000000-0000-0000-0000-000000000001', 'Coffee',     'Café',            'coffee',     'a0000000-0000-0000-0000-000000000002'),
  ('b2000000-0000-0000-0000-000000000002', 'Cocoa',      'Cacao',           'cocoa',      'a0000000-0000-0000-0000-000000000002'),
  ('b2000000-0000-0000-0000-000000000003', 'Palm Oil',   'Huile de Palme',  'palm-oil',   'a0000000-0000-0000-0000-000000000002'),
  ('b2000000-0000-0000-0000-000000000004', 'Cassava',    'Manioc',          'cassava',    'a0000000-0000-0000-0000-000000000002'),
  ('b2000000-0000-0000-0000-000000000005', 'Maize',      'Maïs',            'maize',      'a0000000-0000-0000-0000-000000000002'),
  -- Forestry
  ('b3000000-0000-0000-0000-000000000001', 'Hardwood',   'Bois durs',       'hardwood',   'a0000000-0000-0000-0000-000000000003'),
  ('b3000000-0000-0000-0000-000000000002', 'Sawn Timber','Bois scié',       'sawn-timber','a0000000-0000-0000-0000-000000000003'),
  -- Food & Beverages
  ('b7000000-0000-0000-0000-000000000001', 'Processed Foods', 'Aliments transformés', 'processed-foods', 'a0000000-0000-0000-0000-000000000007'),
  ('b7000000-0000-0000-0000-000000000002', 'Beverages',  'Boissons',        'beverages',  'a0000000-0000-0000-0000-000000000007'),
  -- Construction
  ('b8000000-0000-0000-0000-000000000001', 'Cement',     'Ciment',          'cement',     'a0000000-0000-0000-0000-000000000008'),
  ('b8000000-0000-0000-0000-000000000002', 'Steel',      'Acier',           'steel',      'a0000000-0000-0000-0000-000000000008')
ON CONFLICT (id) DO UPDATE SET name_en = EXCLUDED.name_en, name_fr = EXCLUDED.name_fr;

-- -----------------------------------------------------------------------------
-- 4. Companies (verified, DRC-themed)
-- -----------------------------------------------------------------------------
INSERT INTO public.companies (
  id, owner_id, name, description, sector_id, status,
  contact_email, contact_phone, website, address, city, province,
  verification_tier, verified_at, verification_summary
) VALUES
  ('c0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
    'Katanga Copper Trading',
    'Verified DRC exporter of copper cathodes from Lualaba. Annual capacity 12 000 t.',
    'a0000000-0000-0000-0000-000000000001', 'verified',
    'sales@katangacopper.cd', '+243 81 000 0001', 'https://katangacopper.cd',
    'Avenue du Kilomètre 7', 'Lubumbashi', 'Haut-Katanga',
    'verified', now(),
    '{"checks":[{"key":"kyb","status":"passed"},{"key":"tax","status":"passed"},{"key":"license","status":"passed"}]}'::jsonb),
  ('c0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111',
    'Virunga Coffee Cooperative',
    'Cooperative of 1 200 smallholder coffee growers in North Kivu. Specialty arabica beans.',
    'a0000000-0000-0000-0000-000000000002', 'verified',
    'export@virungacoffee.cd', '+243 81 000 0002', 'https://virungacoffee.cd',
    'Quartier Birere', 'Goma', 'Nord-Kivu',
    'premium', now(),
    '{"checks":[{"key":"kyb","status":"passed"},{"key":"audit","status":"passed"},{"key":"site_visit","status":"passed"}]}'::jsonb),
  ('c0000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111',
    'Kinshasa Cocoa Exporters',
    'Bulk supplier of cocoa beans and semi-processed nibs sourced from Mai-Ndombe.',
    'a0000000-0000-0000-0000-000000000002', 'verified',
    'contact@kshcocoa.cd', '+243 81 000 0003', 'https://kshcocoa.cd',
    'Boulevard du 30 Juin', 'Kinshasa', 'Kinshasa',
    'verified', now(), NULL),
  ('c0000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111',
    'Lubumbashi Cobalt Refiners',
    'Lithium-ion battery grade cobalt sulfate. Tier-1 OEM qualified.',
    'a0000000-0000-0000-0000-000000000001', 'verified',
    'sales@lcr.cd', '+243 81 000 0004', 'https://lcr.cd',
    'Zone Industrielle Nord', 'Lubumbashi', 'Haut-Katanga',
    'premium', now(), NULL),
  ('c0000000-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111',
    'Equateur Hardwood Co.',
    'Sustainably harvested afrormosia and sapele lumber. FSC certified.',
    'a0000000-0000-0000-0000-000000000003', 'verified',
    'wood@equateurhardwood.cd', '+243 81 000 0005', 'https://equateurhardwood.cd',
    'Quartier Ngiri-Ngiri', 'Mbandaka', 'Équateur',
    'basic', now(), NULL),
  ('c0000000-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111',
    'Kasai Diamonds & Stones',
    'Polished and rough diamond exporter, Kimberley Process compliant.',
    'a0000000-0000-0000-0000-000000000001', 'verified',
    'trade@kasaidia.cd', '+243 81 000 0006', 'https://kasaidiamonds.cd',
    'Avenue Mwene Ditu', 'Mbuji-Mayi', 'Kasaï-Oriental',
    'verified', now(), NULL),
  ('c0000000-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111',
    'Bandundu Palm Industries',
    'Palm oil mill and refined RBD palm olein. 6 000 ha plantation.',
    'a0000000-0000-0000-0000-000000000002', 'verified',
    'sales@bandundupalm.cd', '+243 81 000 0007', NULL,
    'RN1 Km 30', 'Kikwit', 'Kwilu',
    'verified', now(), NULL),
  ('c0000000-0000-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111',
    'Goma Cement Works',
    'Portland cement CEM I 42.5N for the Great Lakes region.',
    'a0000000-0000-0000-0000-000000000008', 'verified',
    'sales@gomacement.cd', '+243 81 000 0008', 'https://gomacement.cd',
    'RN2 Km 4', 'Goma', 'Nord-Kivu',
    'verified', now(), NULL),
  ('c0000000-0000-0000-0000-000000000009', '11111111-1111-1111-1111-111111111111',
    'Maniema Coltan Ltd.',
    'Tantalum-niobium ore concentrate. Conflict-free certified (ITSCI).',
    'a0000000-0000-0000-0000-000000000001', 'verified',
    'sales@maniemacoltan.cd', '+243 81 000 0009', NULL,
    'Quartier Lubuto', 'Kindu', 'Maniema',
    'basic', now(), NULL),
  ('c0000000-0000-0000-0000-00000000000a', '11111111-1111-1111-1111-111111111111',
    'Kongo Central Logistics',
    'Trade facilitation between Matadi port and inland markets.',
    'a0000000-0000-0000-0000-000000000005', 'verified',
    'ops@kclogistics.cd', '+243 81 000 0010', 'https://kclogistics.cd',
    'Avenue du Port', 'Matadi', 'Kongo-Central',
    'verified', now(), NULL),
  ('c0000000-0000-0000-0000-00000000000b', '11111111-1111-1111-1111-111111111111',
    'Kivu Specialty Cassava',
    'Cassava flour, garri and dried chips for West & Central African markets.',
    'a0000000-0000-0000-0000-000000000002', 'verified',
    'sales@kivucassava.cd', '+243 81 000 0011', NULL,
    'Marché Birere', 'Bukavu', 'Sud-Kivu',
    'basic', now(), NULL),
  ('c0000000-0000-0000-0000-00000000000c', '11111111-1111-1111-1111-111111111111',
    'Kasai Steel Mills',
    'Reinforcement bar and structural steel for construction sites in central DRC.',
    'a0000000-0000-0000-0000-000000000008', 'verified',
    'sales@kasaisteel.cd', '+243 81 000 0012', NULL,
    'ZI Mbujimayi', 'Mbuji-Mayi', 'Kasaï-Oriental',
    'verified', now(), NULL),
  ('c0000000-0000-0000-0000-00000000000d', '11111111-1111-1111-1111-111111111111',
    'Tshopo Forestry Group',
    'Sawn timber and veneer logs from sustainable concessions in Tshopo.',
    'a0000000-0000-0000-0000-000000000003', 'verified',
    'wood@tshopoforestry.cd', '+243 81 000 0013', NULL,
    'Kisangani', 'Kisangani', 'Tshopo',
    'verified', now(), NULL),
  ('c0000000-0000-0000-0000-00000000000e', '11111111-1111-1111-1111-111111111111',
    'Lualaba Energy Partners',
    'Solar-hybrid power kit installer for mining sites and rural towns.',
    'a0000000-0000-0000-0000-00000000000a', 'verified',
    'sales@lualabaenergy.cd', '+243 81 000 0014', NULL,
    'Boulevard Kassapa', 'Kolwezi', 'Lualaba',
    'basic', now(), NULL),
  ('c0000000-0000-0000-0000-00000000000f', '11111111-1111-1111-1111-111111111111',
    'Kinshasa Beverages SARL',
    'Bottled water, soft drinks, and natural fruit nectars from local orchards.',
    'a0000000-0000-0000-0000-000000000007', 'verified',
    'sales@kinbev.cd', '+243 81 000 0015', NULL,
    'Avenue Lumumba', 'Kinshasa', 'Kinshasa',
    'verified', now(), NULL)
ON CONFLICT (id) DO UPDATE SET
  description = EXCLUDED.description, verification_tier = EXCLUDED.verification_tier;

-- -----------------------------------------------------------------------------
-- 5. Company ↔ Segments (segments themselves are seeded by migration 00006)
-- -----------------------------------------------------------------------------
INSERT INTO public.company_segments (company_id, segment_key) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'exporter'),
  ('c0000000-0000-0000-0000-000000000001', 'manufacturer'),
  ('c0000000-0000-0000-0000-000000000002', 'exporter'),
  ('c0000000-0000-0000-0000-000000000003', 'exporter'),
  ('c0000000-0000-0000-0000-000000000004', 'manufacturer'),
  ('c0000000-0000-0000-0000-000000000004', 'exporter'),
  ('c0000000-0000-0000-0000-000000000005', 'manufacturer'),
  ('c0000000-0000-0000-0000-000000000005', 'exporter'),
  ('c0000000-0000-0000-0000-000000000006', 'exporter'),
  ('c0000000-0000-0000-0000-000000000007', 'manufacturer'),
  ('c0000000-0000-0000-0000-000000000007', 'exporter'),
  ('c0000000-0000-0000-0000-000000000008', 'manufacturer'),
  ('c0000000-0000-0000-0000-000000000009', 'exporter'),
  ('c0000000-0000-0000-0000-00000000000a', 'logistics'),
  ('c0000000-0000-0000-0000-00000000000a', 'facilitation'),
  ('c0000000-0000-0000-0000-00000000000b', 'manufacturer'),
  ('c0000000-0000-0000-0000-00000000000b', 'exporter'),
  ('c0000000-0000-0000-0000-00000000000c', 'manufacturer'),
  ('c0000000-0000-0000-0000-00000000000d', 'manufacturer'),
  ('c0000000-0000-0000-0000-00000000000d', 'exporter'),
  ('c0000000-0000-0000-0000-00000000000e', 'manufacturer'),
  ('c0000000-0000-0000-0000-00000000000f', 'manufacturer')
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------------
-- 6. Products (33 — ~2 per company)
-- -----------------------------------------------------------------------------
INSERT INTO public.products (id, company_id, name, description, category_id, specs) VALUES
  ('d0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000001','Copper Cathode LME Grade A','99.99% Cu, LME registered, 25 kg sheets.','b1000000-0000-0000-0000-000000000001','{"purity":"99.99%","form":"cathode"}'),
  ('d0000000-0000-0000-0000-000000000002','c0000000-0000-0000-0000-000000000001','Copper Wire Rod 8mm','Continuous-cast wire rod, 8mm OD, drum-packed.','b1000000-0000-0000-0000-000000000001','{"diameter":"8mm","packaging":"drums"}'),
  ('d0000000-0000-0000-0000-000000000003','c0000000-0000-0000-0000-000000000002','Virunga Arabica Green Beans','Specialty SCA 84+, washed process, 60 kg jute bags.','b2000000-0000-0000-0000-000000000001','{"score":"84+","process":"washed"}'),
  ('d0000000-0000-0000-0000-000000000004','c0000000-0000-0000-0000-000000000002','Roasted Specialty Coffee 250g','Medium roast, ground or whole bean, retail pack.','b2000000-0000-0000-0000-000000000001','{"roast":"medium","weight":"250g"}'),
  ('d0000000-0000-0000-0000-000000000005','c0000000-0000-0000-0000-000000000003','Cocoa Beans Fermented Grade A','Fine-flavor cocoa beans, 65 kg jute bags.','b2000000-0000-0000-0000-000000000002','{"grade":"A","packaging":"jute"}'),
  ('d0000000-0000-0000-0000-000000000006','c0000000-0000-0000-0000-000000000003','Cocoa Nibs Roasted','Roasted nibs for chocolate makers, vacuum-sealed.','b2000000-0000-0000-0000-000000000002','{}'),
  ('d0000000-0000-0000-0000-000000000007','c0000000-0000-0000-0000-000000000004','Cobalt Sulfate Battery Grade','99.5% CoSO4·7H2O, Tier-1 OEM specs.','b1000000-0000-0000-0000-000000000002','{"purity":"99.5%"}'),
  ('d0000000-0000-0000-0000-000000000008','c0000000-0000-0000-0000-000000000004','Cobalt Hydroxide','Co content 30%, 1 t super sacks.','b1000000-0000-0000-0000-000000000002','{"co_content":"30%"}'),
  ('d0000000-0000-0000-0000-000000000009','c0000000-0000-0000-0000-000000000005','Afrormosia Sawn Timber','FSC certified afrormosia, kiln-dried, 4m lengths.','b3000000-0000-0000-0000-000000000001','{"certification":"FSC"}'),
  ('d0000000-0000-0000-0000-00000000000a','c0000000-0000-0000-0000-000000000005','Sapele Veneer Logs','Sapele veneer logs from sustainable concessions.','b3000000-0000-0000-0000-000000000001','{}'),
  ('d0000000-0000-0000-0000-00000000000b','c0000000-0000-0000-0000-000000000006','Polished Diamonds GIA Cert','Polished round brilliants, GIA certified, 0.5–2.0 ct.','b1000000-0000-0000-0000-000000000005','{"cert":"GIA"}'),
  ('d0000000-0000-0000-0000-00000000000c','c0000000-0000-0000-0000-000000000006','Rough Diamonds KP Compliant','Kimberley Process compliant rough diamond parcels.','b1000000-0000-0000-0000-000000000005','{"compliance":"Kimberley"}'),
  ('d0000000-0000-0000-0000-00000000000d','c0000000-0000-0000-0000-000000000007','Crude Palm Oil CPO','Crude palm oil, 25 t road tankers.','b2000000-0000-0000-0000-000000000003','{"volume":"25t/tanker"}'),
  ('d0000000-0000-0000-0000-00000000000e','c0000000-0000-0000-0000-000000000007','RBD Palm Olein','Refined bleached deodorized palm olein, 20 L jerry cans.','b2000000-0000-0000-0000-000000000003','{}'),
  ('d0000000-0000-0000-0000-00000000000f','c0000000-0000-0000-0000-000000000008','Portland Cement CEM I 42.5N','Bagged 50 kg or bulk tanker, regional delivery.','b8000000-0000-0000-0000-000000000001','{"grade":"CEM I 42.5N"}'),
  ('d0000000-0000-0000-0000-000000000010','c0000000-0000-0000-0000-000000000008','Construction Sand Washed','Washed river sand for concrete works, 25 t trucks.','b8000000-0000-0000-0000-000000000001','{}'),
  ('d0000000-0000-0000-0000-000000000011','c0000000-0000-0000-0000-000000000009','Coltan Concentrate 30%','Ta2O5 30%, ITSCI conflict-free certified.','b1000000-0000-0000-0000-000000000004','{"ta2o5":"30%"}'),
  ('d0000000-0000-0000-0000-000000000012','c0000000-0000-0000-0000-00000000000a','Containerised Inland Transport','Matadi → Lubumbashi corridor, FCL service.','b8000000-0000-0000-0000-000000000001','{"corridor":"Matadi-Lubumbashi"}'),
  ('d0000000-0000-0000-0000-000000000013','c0000000-0000-0000-0000-00000000000b','Cassava Flour Premium','Dry milled cassava flour, 50 kg bags, gluten-free.','b2000000-0000-0000-0000-000000000004','{"weight":"50kg"}'),
  ('d0000000-0000-0000-0000-000000000014','c0000000-0000-0000-0000-00000000000b','Garri White','White garri, fermented and roasted, 25 kg sacks.','b2000000-0000-0000-0000-000000000004','{}'),
  ('d0000000-0000-0000-0000-000000000015','c0000000-0000-0000-0000-00000000000c','Rebar 12mm','Reinforcement steel 12mm, 12m lengths, BS 4449.','b8000000-0000-0000-0000-000000000002','{"diameter":"12mm","spec":"BS 4449"}'),
  ('d0000000-0000-0000-0000-000000000016','c0000000-0000-0000-0000-00000000000d','Sawn Sapele Boards','Kiln-dried sapele boards, mixed widths.','b3000000-0000-0000-0000-000000000002','{}'),
  ('d0000000-0000-0000-0000-000000000017','c0000000-0000-0000-0000-00000000000e','Solar Hybrid Kit 5kW','Solar + lithium hybrid kit for off-grid sites.','b8000000-0000-0000-0000-000000000001','{"capacity":"5kW"}'),
  ('d0000000-0000-0000-0000-000000000018','c0000000-0000-0000-0000-00000000000f','Bottled Mineral Water 1.5L','Pack of 6, sourced from Mont Ngaliema spring.','b7000000-0000-0000-0000-000000000002','{"volume":"1.5L","pack":"6"}'),
  ('d0000000-0000-0000-0000-000000000019','c0000000-0000-0000-0000-00000000000f','Mango Nectar 330ml','Pasteurised mango nectar, no added sugar.','b7000000-0000-0000-0000-000000000002','{"volume":"330ml"}')
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 7. Services (8)
-- -----------------------------------------------------------------------------
INSERT INTO public.services (id, company_id, name_en, name_fr, description_en, description_fr, category_id, service_type, delivery_mode, status) VALUES
  ('e0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-00000000000a','Container clearing at Matadi','Dédouanement de conteneurs à Matadi','Customs clearance + inland forwarding from Matadi port.','Dédouanement et acheminement intérieur depuis le port de Matadi.',NULL,'logistics','on_request','active'),
  ('e0000000-0000-0000-0000-000000000002','c0000000-0000-0000-0000-00000000000a','Cross-border freight Zambia','Transport transfrontalier Zambie','Inland rail/road freight to Zambia and DRC south corridor.','Fret routier/ferroviaire vers la Zambie et le corridor sud.',NULL,'logistics','on_request','active'),
  ('e0000000-0000-0000-0000-000000000003','c0000000-0000-0000-0000-000000000001','Mining royalty calc consulting','Conseil en redevances minières','Royalty and DGI compliance support for mining exporters.','Accompagnement DGI/redevances minières pour exportateurs.',NULL,'consulting','retainer','active'),
  ('e0000000-0000-0000-0000-000000000004','c0000000-0000-0000-0000-000000000002','Coffee origin certification','Certification d''origine café','Specialty Coffee Association cupping & origin paperwork.','Notation SCA et dossier d''origine pour cafés de spécialité.',NULL,'consulting','one_off','active'),
  ('e0000000-0000-0000-0000-000000000005','c0000000-0000-0000-0000-000000000006','Kimberley Process advisory','Conseil Processus de Kimberley','KP compliance audit, documentation, broker matching.','Audit conformité KP, documentation, mise en relation courtiers.',NULL,'consulting','retainer','active'),
  ('e0000000-0000-0000-0000-000000000006','c0000000-0000-0000-0000-00000000000e','Solar EPC for mining camps','EPC solaire pour camps miniers','Turnkey solar-diesel hybrid plants for remote mining sites.','Centrales solaire-diesel clé en main pour sites miniers isolés.',NULL,'custom','one_off','active'),
  ('e0000000-0000-0000-0000-000000000007','c0000000-0000-0000-0000-000000000004','Battery-grade cobalt sampling','Échantillonnage cobalt batterie','Lab-grade cobalt sampling and OEM qualification support.','Échantillonnage cobalt qualité laboratoire et qualification OEM.',NULL,'consulting','on_request','active'),
  ('e0000000-0000-0000-0000-000000000008','c0000000-0000-0000-0000-00000000000c','Steel structural design','Conception structurelle acier','Local-code steel design for warehouses and bridges.','Conception structurelle acier conforme aux normes locales.',NULL,'consulting','one_off','active')
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 8. Opportunities (8 — one per category, published)
-- -----------------------------------------------------------------------------
INSERT INTO public.opportunities (id, company_id, category, slug, title_en, title_fr, summary_en, summary_fr, body_en, body_fr, budget_min, budget_max, budget_currency, deadline_at, sector_id, region, status, published_at) VALUES
  ('f0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000001','tender','copper-cathode-supply-2026-q3',
    'Tender: Copper cathode supply 2026-Q3',
    'Appel d''offres : fourniture de cathodes de cuivre T3 2026',
    'Long-term contract for 500 t/month of LME Grade A copper cathodes starting July 2026.',
    'Contrat long terme pour 500 t/mois de cathodes Grade A LME à partir de juillet 2026.',
    '## Scope\n500 t / month\n12-month framework, monthly delivery FOB Matadi.\n\n## Bidder criteria\n- ITSCI / OECD due-diligence compliant\n- LME-registered brand',
    '## Périmètre\n500 t/mois\nAccord-cadre 12 mois, livraison mensuelle FOB Matadi.\n\n## Critères\n- Conformité ITSCI / diligence OCDE\n- Marque enregistrée LME',
    NULL, NULL, 'USD', now() + interval '45 days',
    'a0000000-0000-0000-0000-000000000001','Haut-Katanga','published', now() - interval '2 days'),
  ('f0000000-0000-0000-0000-000000000002','c0000000-0000-0000-0000-00000000000a','ppp','matadi-lubumbashi-corridor-ppp',
    'PPP: Matadi-Lubumbashi corridor upgrade',
    'PPP : modernisation du corridor Matadi-Lubumbashi',
    'Public-private partnership to upgrade inland container freight along the southern corridor.',
    'Partenariat public-privé pour moderniser le fret conteneurisé sur le corridor sud.',
    '## Goal\nDouble corridor throughput within 36 months.\n\n## Instruments\nDesign-Build-Operate over 25 years.',
    '## Objectif\nDoubler le débit du corridor en 36 mois.\n\n## Instruments\nDesign-Build-Operate sur 25 ans.',
    50000000, 80000000, 'USD', now() + interval '120 days',
    'a0000000-0000-0000-0000-000000000005','Kongo-Central','published', now() - interval '5 days'),
  ('f0000000-0000-0000-0000-000000000003','c0000000-0000-0000-0000-000000000002','investment_call','virunga-cooperative-expansion',
    'Investment call: Virunga cooperative expansion',
    'Appel à investissement : extension coopérative Virunga',
    'Raising $4M to add wet-mill capacity for 1 200 smallholder coffee growers in North Kivu.',
    'Recherche de 4M USD pour augmenter la capacité de lavage pour 1 200 caféiculteurs au Nord-Kivu.',
    'Capacity expansion, drying patios, and traceability tech.',
    'Extension de capacité, séchoirs et technologie de traçabilité.',
    4000000, 5000000, 'USD', now() + interval '90 days',
    'a0000000-0000-0000-0000-000000000002','Nord-Kivu','published', now() - interval '1 days'),
  ('f0000000-0000-0000-0000-000000000004','c0000000-0000-0000-0000-000000000007','offer','palm-oil-spot-2000t',
    'Offer: Palm oil spot 2 000 t',
    'Offre : huile de palme spot 2 000 t',
    'Spot offer of 2 000 t CPO from Bandundu, prompt loading.',
    'Offre spot de 2 000 t CPO depuis Bandundu, chargement immédiat.',
    'CPO conforming to PORAM specifications.',
    'CPO conforme aux spécifications PORAM.',
    NULL, NULL, 'USD', now() + interval '21 days',
    'a0000000-0000-0000-0000-000000000002','Kwilu','published', now() - interval '6 days'),
  ('f0000000-0000-0000-0000-000000000005','c0000000-0000-0000-0000-00000000000f','demand','seeking-pet-preforms-supplier',
    'Demand: PET preforms supplier sought',
    'Demande : recherche fournisseur préformes PET',
    'Looking for 3M PET preforms (28mm neck, 27g) per month for 1.5L water bottling.',
    'Recherche 3M de préformes PET (col 28mm, 27g) par mois pour embouteillage 1,5L.',
    'Prefer regional suppliers (DRC, Zambia, Tanzania).',
    'Préférence pour fournisseurs régionaux (RDC, Zambie, Tanzanie).',
    NULL, NULL, 'USD', now() + interval '30 days',
    'a0000000-0000-0000-0000-000000000007','Kinshasa','published', now() - interval '3 days'),
  ('f0000000-0000-0000-0000-000000000006','c0000000-0000-0000-0000-000000000008','quotation','request-cement-dispatch-q4',
    'Quotation request: Cement dispatch Q4',
    'Demande de devis : expédition ciment T4',
    'Need quotations for 8 000 t CEM I delivered Kalemie + Goma in Q4.',
    'Devis souhaités pour 8 000 t CEM I livrées Kalemie + Goma au T4.',
    'CIP terms preferred.',
    'Termes CIP préférés.',
    NULL, NULL, 'USD', now() + interval '14 days',
    'a0000000-0000-0000-0000-000000000008','Nord-Kivu','published', now() - interval '4 days'),
  ('f0000000-0000-0000-0000-000000000007','c0000000-0000-0000-0000-000000000004','partner_search','battery-recycling-jv',
    'Partner search: Battery recycling JV',
    'Recherche partenaire : JV recyclage batteries',
    'Looking for a JV partner to set up Li-ion battery recycling in Kolwezi.',
    'Recherche partenaire JV pour installer le recyclage de batteries Li-ion à Kolwezi.',
    'Capacity target 10 kt black mass / year.',
    'Capacité visée 10 kt black mass / an.',
    NULL, NULL, 'USD', now() + interval '180 days',
    'a0000000-0000-0000-0000-000000000001','Lualaba','published', now() - interval '7 days'),
  ('f0000000-0000-0000-0000-000000000008','c0000000-0000-0000-0000-00000000000e','project_launch','solar-microgrid-fizi',
    'Project launch: Solar microgrid Fizi',
    'Lancement projet : micro-réseau solaire Fizi',
    'Launch of a 2.5 MW solar microgrid in Fizi territory, South Kivu.',
    'Lancement d''un micro-réseau solaire 2,5 MW dans le territoire de Fizi, Sud-Kivu.',
    'Hybrid PV + storage, 4 000 households + 60 SMEs.',
    'PV hybride + stockage, 4 000 foyers + 60 PME.',
    NULL, NULL, 'USD', now() + interval '60 days',
    'a0000000-0000-0000-0000-00000000000a','Sud-Kivu','published', now() - interval '8 days')
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 9. Content items (news + events + blog)
-- -----------------------------------------------------------------------------
INSERT INTO public.content_items (id, type, slug, title_en, title_fr, excerpt_en, excerpt_fr, body_en, body_fr, status, published_at, event_start_at, event_end_at, event_location, sector_id) VALUES
  ('a1000000-0000-0000-0000-000000000001','news','drc-copper-output-up-12-percent',
    'DRC copper output up 12% YoY',
    'La production de cuivre RDC en hausse de 12 % en glissement annuel',
    'Cobalt and copper export receipts reach record highs in Q1.',
    'Les recettes d''exportation de cobalt et de cuivre atteignent un sommet au T1.',
    '## Highlights\n- Copper output 720 kt YTD\n- Cobalt 47 kt YTD\n- Lualaba leads provinces',
    '## Faits saillants\n- Production de cuivre 720 kt cumulé\n- Cobalt 47 kt cumulé\n- Lualaba en tête des provinces',
    'published', now() - interval '2 days', NULL, NULL, NULL,
    'a0000000-0000-0000-0000-000000000001'),
  ('a1000000-0000-0000-0000-000000000002','news','virunga-arabica-wins-cup-of-excellence',
    'Virunga arabica wins Cup of Excellence',
    'L''arabica Virunga remporte la Cup of Excellence',
    'A North Kivu coffee scored 91.5 at the regional cupping competition.',
    'Un café du Nord-Kivu a obtenu 91,5 lors du concours régional de dégustation.',
    'Specialty buyers from Italy and Japan placed bids over $20/lb FOB Mombasa.',
    'Des acheteurs spécialisés d''Italie et du Japon ont enchéri à plus de 20 $/lb FOB Mombasa.',
    'published', now() - interval '6 days', NULL, NULL, NULL,
    'a0000000-0000-0000-0000-000000000002'),
  ('a1000000-0000-0000-0000-000000000003','news','matadi-port-throughput-record',
    'Matadi port hits record monthly throughput',
    'Record de débit mensuel au port de Matadi',
    'Containerised throughput at Matadi rose 18% YoY thanks to corridor work.',
    'Le débit conteneurisé de Matadi a progressé de 18 % grâce aux travaux du corridor.',
    'Inland forwarding to Lubumbashi sub-72-hour now achievable for FCL.',
    'L''acheminement vers Lubumbashi en moins de 72h est désormais réalisable pour le FCL.',
    'published', now() - interval '10 days', NULL, NULL, NULL,
    'a0000000-0000-0000-0000-000000000005'),
  ('a1000000-0000-0000-0000-000000000004','event','drc-trade-summit-2026',
    'DRC Trade Summit 2026 — Kinshasa',
    'Sommet du Commerce RDC 2026 — Kinshasa',
    'Two-day summit on DRC export diversification.',
    'Sommet de deux jours sur la diversification des exportations en RDC.',
    'Panels on mining royalties, agro-export logistics, and SME finance.',
    'Panels sur redevances minières, logistique agro-export, financement PME.',
    'published', now() - interval '3 days',
    (now() + interval '40 days')::timestamptz,
    (now() + interval '41 days')::timestamptz,
    'Pullman Kinshasa Grand Hotel, Kinshasa', NULL),
  ('a1000000-0000-0000-0000-000000000005','event','lubumbashi-mining-week',
    'Lubumbashi Mining Week',
    'Semaine Minière de Lubumbashi',
    'Five-day mining conference and exhibition.',
    'Cinq jours de conférence et exposition minière.',
    'Networking with refiners, OEMs, and government delegations.',
    'Mise en réseau avec affineurs, OEM et délégations gouvernementales.',
    'published', now() - interval '5 days',
    (now() + interval '70 days')::timestamptz,
    (now() + interval '74 days')::timestamptz,
    'Pullman Lubumbashi Grand Karavia', 'a0000000-0000-0000-0000-000000000001'),
  ('a1000000-0000-0000-0000-000000000006','blog','exporting-from-drc-the-basics',
    'Exporting from DRC: the basics',
    'Exporter depuis la RDC : les bases',
    'A short primer for buyers approaching a Congolese supplier for the first time.',
    'Une introduction pour les acheteurs qui contactent un fournisseur congolais pour la première fois.',
    '## Documents you''ll need\n- ITSCI / OECD due-diligence pack\n- Bill of lading template\n- DGI export declaration',
    '## Documents nécessaires\n- Dossier ITSCI / diligence OCDE\n- Modèle de connaissement\n- Déclaration d''exportation DGI',
    'published', now() - interval '15 days', NULL, NULL, NULL, NULL),
  ('a1000000-0000-0000-0000-000000000007','blog','choosing-a-verified-supplier',
    'Choosing a verified supplier on TradeInDRC',
    'Choisir un fournisseur vérifié sur TradeInDRC',
    'How verification tiers (basic, verified, premium) help you size up a counterparty.',
    'Comment les niveaux de vérification (basique, vérifié, premium) aident à juger un partenaire.',
    'A short walk through the trust badge tiers and what they actually mean.',
    'Une présentation des niveaux de badge de confiance et de leur signification.',
    'published', now() - interval '20 days', NULL, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 10. Data Hub reports (market_report, legal_guide, regulation)
-- -----------------------------------------------------------------------------
INSERT INTO public.reports (id, kind, slug, title_en, title_fr, summary_en, summary_fr, body_en, body_fr, sector_id, status, published_at) VALUES
  ('b2000000-1111-0000-0000-000000000001','market_report','drc-copper-cobalt-outlook-2026',
    'DRC Copper & Cobalt Outlook 2026',
    'Perspectives Cuivre & Cobalt RDC 2026',
    'Production, prices, and downstream demand drivers for 2026.',
    'Production, prix et moteurs de la demande aval pour 2026.',
    '## Headline numbers\n- Copper: 2.8 Mt projected\n- Cobalt: 175 kt projected',
    '## Chiffres-clés\n- Cuivre : 2,8 Mt prévu\n- Cobalt : 175 kt prévu',
    'a0000000-0000-0000-0000-000000000001','published', now() - interval '4 days'),
  ('b2000000-1111-0000-0000-000000000002','market_report','drc-agro-exports-half-year',
    'DRC Agro Exports — H1 Review',
    'Exports agricoles RDC — Revue S1',
    'Coffee, cocoa, palm oil, cassava — flows and prices.',
    'Café, cacao, huile de palme, manioc — flux et prix.',
    'Detailed tables by commodity.','Tableaux détaillés par produit.',
    'a0000000-0000-0000-0000-000000000002','published', now() - interval '10 days'),
  ('b2000000-1111-0000-0000-000000000003','market_report','drc-construction-sector-pulse',
    'DRC Construction Sector Pulse',
    'Pouls du secteur de la construction en RDC',
    'Cement demand and inland project pipeline.',
    'Demande de ciment et pipeline de projets en RDC.',
    'Demand growth and supply-side responses.','Croissance de la demande et réponses côté offre.',
    'a0000000-0000-0000-0000-000000000008','published', now() - interval '14 days'),
  ('b2000000-1111-0000-0000-000000000004','legal_guide','drc-export-documentation-guide',
    'DRC Export Documentation Guide',
    'Guide de la documentation d''exportation en RDC',
    'Step-by-step on customs paperwork for first-time exporters.',
    'Étape par étape sur les formalités douanières pour primo-exportateurs.',
    'OCC, DGI, DGDA — what each agency needs.','OCC, DGI, DGDA — ce que chaque administration exige.',
    NULL,'published', now() - interval '7 days'),
  ('b2000000-1111-0000-0000-000000000005','legal_guide','setting-up-a-company-in-drc',
    'Setting up a company in DRC',
    'Constituer une société en RDC',
    'OHADA framework, Guichet Unique, capital requirements.',
    'Cadre OHADA, Guichet Unique, exigences de capital.',
    'Walk-through of the registration steps.','Présentation des étapes d''immatriculation.',
    NULL,'published', now() - interval '21 days'),
  ('b2000000-1111-0000-0000-000000000006','regulation','mining-code-2018-summary',
    'Mining Code 2018 — Summary',
    'Code minier 2018 — Résumé',
    'Royalty rates, super-profit tax, and local content rules.',
    'Taux de redevance, taxe sur superprofit, règles de contenu local.',
    'Quick-reference table for foreign mining investors.','Tableau de référence rapide pour investisseurs miniers étrangers.',
    'a0000000-0000-0000-0000-000000000001','published', now() - interval '30 days'),
  ('b2000000-1111-0000-0000-000000000007','regulation','vat-export-rules-2025',
    'VAT and export rules 2025',
    'Règles TVA et exportation 2025',
    'Latest VAT zero-rating rules for exports.',
    'Dernières règles d''exonération TVA pour les exportations.',
    'A 2-page legal note.','Une note juridique de 2 pages.',
    NULL,'published', now() - interval '18 days')
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 11. Price series + monthly observations (last 12 months)
-- -----------------------------------------------------------------------------
INSERT INTO public.price_series (id, commodity_en, commodity_fr, unit, currency, sector_id, source, status) VALUES
  ('c3000000-1111-0000-0000-000000000001', 'Copper Cathode', 'Cathode de cuivre', 't',  'USD', 'a0000000-0000-0000-0000-000000000001', 'LME settlement (proxy)', 'published'),
  ('c3000000-1111-0000-0000-000000000002', 'Cobalt Sulfate', 'Sulfate de cobalt', 't',  'USD', 'a0000000-0000-0000-0000-000000000001', 'Asian Metal (proxy)',     'published'),
  ('c3000000-1111-0000-0000-000000000003', 'Arabica Coffee', 'Café arabica',       'lb', 'USD', 'a0000000-0000-0000-0000-000000000002', 'ICE futures (proxy)',     'published')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.price_points (series_id, observed_at, value) VALUES
  -- Copper (12 months, sample numbers)
  ('c3000000-1111-0000-0000-000000000001', now() - interval '12 months', 8400),
  ('c3000000-1111-0000-0000-000000000001', now() - interval '11 months', 8550),
  ('c3000000-1111-0000-0000-000000000001', now() - interval '10 months', 8480),
  ('c3000000-1111-0000-0000-000000000001', now() - interval '9 months',  8720),
  ('c3000000-1111-0000-0000-000000000001', now() - interval '8 months',  8900),
  ('c3000000-1111-0000-0000-000000000001', now() - interval '7 months',  9050),
  ('c3000000-1111-0000-0000-000000000001', now() - interval '6 months',  8970),
  ('c3000000-1111-0000-0000-000000000001', now() - interval '5 months',  9180),
  ('c3000000-1111-0000-0000-000000000001', now() - interval '4 months',  9320),
  ('c3000000-1111-0000-0000-000000000001', now() - interval '3 months',  9410),
  ('c3000000-1111-0000-0000-000000000001', now() - interval '2 months',  9550),
  ('c3000000-1111-0000-0000-000000000001', now() - interval '1 months',  9680),
  -- Cobalt
  ('c3000000-1111-0000-0000-000000000002', now() - interval '12 months', 28000),
  ('c3000000-1111-0000-0000-000000000002', now() - interval '10 months', 29500),
  ('c3000000-1111-0000-0000-000000000002', now() - interval '8 months',  31000),
  ('c3000000-1111-0000-0000-000000000002', now() - interval '6 months',  30200),
  ('c3000000-1111-0000-0000-000000000002', now() - interval '4 months',  32100),
  ('c3000000-1111-0000-0000-000000000002', now() - interval '2 months',  33800),
  -- Arabica
  ('c3000000-1111-0000-0000-000000000003', now() - interval '12 months', 1.85),
  ('c3000000-1111-0000-0000-000000000003', now() - interval '10 months', 1.92),
  ('c3000000-1111-0000-0000-000000000003', now() - interval '8 months',  2.04),
  ('c3000000-1111-0000-0000-000000000003', now() - interval '6 months',  2.18),
  ('c3000000-1111-0000-0000-000000000003', now() - interval '4 months',  2.31),
  ('c3000000-1111-0000-0000-000000000003', now() - interval '2 months',  2.42)
ON CONFLICT (series_id, observed_at) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 12. Image URLs — local /seed-images/ assets (SVG monograms + WebP product/content shots)
--     Companies get SVG monogram logos; products/content get WebP images from public/.
--     All paths are Next.js public-folder relative — served without a CDN hop.
-- -----------------------------------------------------------------------------

UPDATE public.companies SET logo_url = '/seed-images/companies/' || u.slug || '.svg' FROM (VALUES
  ('c0000000-0000-0000-0000-000000000001','kct'),
  ('c0000000-0000-0000-0000-000000000002','vcc'),
  ('c0000000-0000-0000-0000-000000000003','kce'),
  ('c0000000-0000-0000-0000-000000000004','lcr'),
  ('c0000000-0000-0000-0000-000000000005','ehc'),
  ('c0000000-0000-0000-0000-000000000006','kds'),
  ('c0000000-0000-0000-0000-000000000007','bpi'),
  ('c0000000-0000-0000-0000-000000000008','gcw'),
  ('c0000000-0000-0000-0000-000000000009','mcl'),
  ('c0000000-0000-0000-0000-00000000000a','kcl'),
  ('c0000000-0000-0000-0000-00000000000b','ksc'),
  ('c0000000-0000-0000-0000-00000000000c','ksm'),
  ('c0000000-0000-0000-0000-00000000000d','tfg'),
  ('c0000000-0000-0000-0000-00000000000e','lep'),
  ('c0000000-0000-0000-0000-00000000000f','kib')
) AS u(id, slug)
WHERE public.companies.id = u.id::uuid;

UPDATE public.products SET images = ARRAY['/seed-images/products/' || u.slug || '.webp'] FROM (VALUES
  ('d0000000-0000-0000-0000-000000000001','copper-cathode'),
  ('d0000000-0000-0000-0000-000000000002','copper-wire-rod'),
  ('d0000000-0000-0000-0000-000000000003','virunga-arabica'),
  ('d0000000-0000-0000-0000-000000000004','roasted-coffee-250g'),
  ('d0000000-0000-0000-0000-000000000005','cocoa-beans-grade-a'),
  ('d0000000-0000-0000-0000-000000000006','cocoa-nibs-roasted'),
  ('d0000000-0000-0000-0000-000000000007','cobalt-sulfate'),
  ('d0000000-0000-0000-0000-000000000008','cobalt-hydroxide'),
  ('d0000000-0000-0000-0000-000000000009','afrormosia-timber'),
  ('d0000000-0000-0000-0000-00000000000a','sapele-veneer'),
  ('d0000000-0000-0000-0000-00000000000b','polished-diamonds'),
  ('d0000000-0000-0000-0000-00000000000c','rough-diamonds'),
  ('d0000000-0000-0000-0000-00000000000d','crude-palm-oil'),
  ('d0000000-0000-0000-0000-00000000000e','rbd-palm-olein'),
  ('d0000000-0000-0000-0000-00000000000f','cement-cem-i-42-5n'),
  ('d0000000-0000-0000-0000-000000000010','washed-sand'),
  ('d0000000-0000-0000-0000-000000000011','coltan-concentrate'),
  ('d0000000-0000-0000-0000-000000000012','inland-transport'),
  ('d0000000-0000-0000-0000-000000000013','cassava-flour'),
  ('d0000000-0000-0000-0000-000000000014','garri-white'),
  ('d0000000-0000-0000-0000-000000000015','rebar-12mm'),
  ('d0000000-0000-0000-0000-000000000016','sapele-boards'),
  ('d0000000-0000-0000-0000-000000000017','solar-hybrid-5kw'),
  ('d0000000-0000-0000-0000-000000000018','mineral-water-1-5l'),
  ('d0000000-0000-0000-0000-000000000019','mango-nectar-330ml')
) AS u(id, slug)
WHERE public.products.id = u.id::uuid;

-- Cover images on content_items + reports too (one each)
UPDATE public.content_items SET cover_url =
  '/seed-images/content/' || regexp_replace(lower(title_en), '[^a-z0-9]+', '-', 'g') || '.webp'
WHERE status = 'published'
  AND (cover_url IS NULL OR cover_url LIKE '%placehold.co%');

-- =============================================================================
-- END SEED
-- =============================================================================
