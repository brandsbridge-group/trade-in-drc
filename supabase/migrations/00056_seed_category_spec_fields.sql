-- =============================================================================
-- TradeInDRC — Starter specification templates for the existing categories
-- Migration: 00056_seed_category_spec_fields.sql
-- =============================================================================
-- 00055 created `category_spec_fields` empty: until staff define a template, a
-- seller only gets free "name / value" lines. This seeds a starter template for
-- each of the 17 categories that exist today, so the product form is useful
-- from day one. Staff adjust them in /console/taxonomy.
--
-- Rules followed:
--   - Keys already used by existing products are reused (process, roast, form,
--     purity, grade, packaging, …) so their values land in the template field
--     instead of staying free lines.
--   - Nothing is required: a required field would block editing the products
--     that already exist. Staff can switch a field to required from the console.
--   - Units are language-neutral (%, mm, m, ct).
--   - Idempotent: ON CONFLICT DO NOTHING, and a category missing from this
--     database is simply skipped (the join finds no row).

INSERT INTO public.category_spec_fields
  (category_id, key, label_en, label_fr, field_type, unit, options, sort_order)
SELECT c.id, t.key, t.label_en, t.label_fr, t.field_type, t.unit, t.options, t.sort_order
FROM (VALUES
  ('coffee', 'variety', 'Variety', 'Variété', 'text', NULL, '[]'::jsonb, 10),
  ('coffee', 'process', 'Process', 'Procédé', 'select', NULL, '[{"value":"washed","label_en":"Washed","label_fr":"Lavé"},{"value":"natural","label_en":"Natural","label_fr":"Nature"},{"value":"honey","label_en":"Honey","label_fr":"Honey"}]'::jsonb, 20),
  ('coffee', 'roast', 'Roast', 'Torréfaction', 'select', NULL, '[{"value":"green","label_en":"Green (unroasted)","label_fr":"Vert (non torréfié)"},{"value":"light","label_en":"Light","label_fr":"Claire"},{"value":"medium","label_en":"Medium","label_fr":"Moyenne"},{"value":"dark","label_en":"Dark","label_fr":"Foncée"}]'::jsonb, 30),
  ('coffee', 'altitude', 'Altitude', 'Altitude', 'number', 'm', '[]'::jsonb, 40),
  ('coffee', 'moisture', 'Moisture', 'Humidité', 'number', '%', '[]'::jsonb, 50),
  ('coffee', 'score', 'Cupping score', 'Note de dégustation', 'text', NULL, '[]'::jsonb, 60),
  ('coffee', 'weight', 'Packaging weight', 'Poids du conditionnement', 'text', NULL, '[]'::jsonb, 70),
  ('coffee', 'organic', 'Certified organic', 'Certifié bio', 'boolean', NULL, '[]'::jsonb, 80),
  ('cocoa', 'variety', 'Variety', 'Variété', 'text', NULL, '[]'::jsonb, 10),
  ('cocoa', 'grade', 'Grade', 'Grade', 'text', NULL, '[]'::jsonb, 20),
  ('cocoa', 'fermented', 'Fermented', 'Fermenté', 'boolean', NULL, '[]'::jsonb, 30),
  ('cocoa', 'moisture', 'Moisture', 'Humidité', 'number', '%', '[]'::jsonb, 40),
  ('cocoa', 'packaging', 'Packaging', 'Conditionnement', 'text', NULL, '[]'::jsonb, 50),
  ('cocoa', 'organic', 'Certified organic', 'Certifié bio', 'boolean', NULL, '[]'::jsonb, 60),
  ('cassava', 'form', 'Form', 'Forme', 'select', NULL, '[{"value":"fresh_roots","label_en":"Fresh roots","label_fr":"Racines fraîches"},{"value":"chips","label_en":"Chips","label_fr":"Cossettes"},{"value":"flour","label_en":"Flour","label_fr":"Farine"},{"value":"starch","label_en":"Starch","label_fr":"Amidon"}]'::jsonb, 10),
  ('cassava', 'moisture', 'Moisture', 'Humidité', 'number', '%', '[]'::jsonb, 20),
  ('cassava', 'weight', 'Packaging weight', 'Poids du conditionnement', 'text', NULL, '[]'::jsonb, 30),
  ('maize', 'variety', 'Variety', 'Variété', 'select', NULL, '[{"value":"white","label_en":"White","label_fr":"Blanc"},{"value":"yellow","label_en":"Yellow","label_fr":"Jaune"}]'::jsonb, 10),
  ('maize', 'grade', 'Grade', 'Grade', 'text', NULL, '[]'::jsonb, 20),
  ('maize', 'moisture', 'Moisture', 'Humidité', 'number', '%', '[]'::jsonb, 30),
  ('maize', 'weight', 'Packaging weight', 'Poids du conditionnement', 'text', NULL, '[]'::jsonb, 40),
  ('palm-oil', 'type', 'Type', 'Type', 'select', NULL, '[{"value":"crude","label_en":"Crude","label_fr":"Brute"},{"value":"refined","label_en":"Refined","label_fr":"Raffinée"},{"value":"red","label_en":"Red palm oil","label_fr":"Huile de palme rouge"}]'::jsonb, 10),
  ('palm-oil', 'ffa', 'Free fatty acids', 'Acides gras libres', 'number', '%', '[]'::jsonb, 20),
  ('palm-oil', 'volume', 'Volume / packaging', 'Volume / conditionnement', 'text', NULL, '[]'::jsonb, 30),
  ('cement', 'grade', 'Grade / class', 'Classe', 'text', NULL, '[]'::jsonb, 10),
  ('cement', 'packaging', 'Packaging', 'Conditionnement', 'select', NULL, '[{"value":"bag_50kg","label_en":"50 kg bags","label_fr":"Sacs de 50 kg"},{"value":"big_bag","label_en":"Big bags","label_fr":"Big bags"},{"value":"bulk","label_en":"Bulk","label_fr":"Vrac"}]'::jsonb, 20),
  ('cement', 'standard', 'Standard', 'Norme', 'text', NULL, '[]'::jsonb, 30),
  ('steel', 'product_type', 'Product type', 'Type de produit', 'select', NULL, '[{"value":"rebar","label_en":"Rebar","label_fr":"Fer à béton"},{"value":"sheet","label_en":"Sheet","label_fr":"Tôle"},{"value":"beam","label_en":"Beam","label_fr":"Poutrelle"},{"value":"wire","label_en":"Wire","label_fr":"Fil"}]'::jsonb, 10),
  ('steel', 'diameter', 'Diameter', 'Diamètre', 'number', 'mm', '[]'::jsonb, 20),
  ('steel', 'length', 'Length', 'Longueur', 'number', 'm', '[]'::jsonb, 30),
  ('steel', 'spec', 'Standard', 'Norme', 'text', NULL, '[]'::jsonb, 40),
  ('beverages', 'volume', 'Volume', 'Volume', 'text', NULL, '[]'::jsonb, 10),
  ('beverages', 'pack', 'Units per pack', 'Unités par pack', 'number', NULL, '[]'::jsonb, 20),
  ('beverages', 'alcohol', 'Alcohol content', 'Teneur en alcool', 'number', '%', '[]'::jsonb, 30),
  ('beverages', 'shelf_life_months', 'Shelf life (months)', 'Durée de conservation (mois)', 'number', NULL, '[]'::jsonb, 40),
  ('processed-foods', 'weight', 'Net weight', 'Poids net', 'text', NULL, '[]'::jsonb, 10),
  ('processed-foods', 'storage', 'Storage', 'Conservation', 'select', NULL, '[{"value":"ambient","label_en":"Ambient","label_fr":"Température ambiante"},{"value":"chilled","label_en":"Chilled","label_fr":"Réfrigéré"},{"value":"frozen","label_en":"Frozen","label_fr":"Surgelé"}]'::jsonb, 20),
  ('processed-foods', 'shelf_life_months', 'Shelf life (months)', 'Durée de conservation (mois)', 'number', NULL, '[]'::jsonb, 30),
  ('processed-foods', 'packaging', 'Packaging', 'Conditionnement', 'text', NULL, '[]'::jsonb, 40),
  ('hardwood', 'species', 'Species', 'Essence', 'text', NULL, '[]'::jsonb, 10),
  ('hardwood', 'grade', 'Grade', 'Grade', 'text', NULL, '[]'::jsonb, 20),
  ('hardwood', 'moisture', 'Moisture', 'Humidité', 'number', '%', '[]'::jsonb, 30),
  ('hardwood', 'certification', 'Certification', 'Certification', 'text', NULL, '[]'::jsonb, 40),
  ('sawn-timber', 'species', 'Species', 'Essence', 'text', NULL, '[]'::jsonb, 10),
  ('sawn-timber', 'thickness', 'Thickness', 'Épaisseur', 'number', 'mm', '[]'::jsonb, 20),
  ('sawn-timber', 'width', 'Width', 'Largeur', 'number', 'mm', '[]'::jsonb, 30),
  ('sawn-timber', 'length', 'Length', 'Longueur', 'number', 'm', '[]'::jsonb, 40),
  ('sawn-timber', 'drying', 'Drying', 'Séchage', 'select', NULL, '[{"value":"air_dried","label_en":"Air dried","label_fr":"Séché à l''air"},{"value":"kiln_dried","label_en":"Kiln dried","label_fr":"Séché au séchoir"}]'::jsonb, 50),
  ('sawn-timber', 'certification', 'Certification', 'Certification', 'text', NULL, '[]'::jsonb, 60),
  ('cobalt', 'form', 'Form', 'Forme', 'select', NULL, '[{"value":"hydroxide","label_en":"Hydroxide","label_fr":"Hydroxyde"},{"value":"cathode","label_en":"Cathode","label_fr":"Cathode"},{"value":"concentrate","label_en":"Concentrate","label_fr":"Concentré"}]'::jsonb, 10),
  ('cobalt', 'co_content', 'Cobalt content', 'Teneur en cobalt', 'number', '%', '[]'::jsonb, 20),
  ('cobalt', 'purity', 'Purity', 'Pureté', 'number', '%', '[]'::jsonb, 30),
  ('cobalt', 'packaging', 'Packaging', 'Conditionnement', 'text', NULL, '[]'::jsonb, 40),
  ('coltan', 'form', 'Form', 'Forme', 'select', NULL, '[{"value":"concentrate","label_en":"Concentrate","label_fr":"Concentré"},{"value":"ore","label_en":"Ore","label_fr":"Minerai"}]'::jsonb, 10),
  ('coltan', 'ta2o5', 'Ta2O5 content', 'Teneur en Ta2O5', 'number', '%', '[]'::jsonb, 20),
  ('coltan', 'nb2o5', 'Nb2O5 content', 'Teneur en Nb2O5', 'number', '%', '[]'::jsonb, 30),
  ('coltan', 'traceability', 'Certified traceability', 'Traçabilité certifiée', 'boolean', NULL, '[]'::jsonb, 40),
  ('copper', 'form', 'Form', 'Forme', 'select', NULL, '[{"value":"cathode","label_en":"Cathode","label_fr":"Cathode"},{"value":"wire_rod","label_en":"Wire rod","label_fr":"Fil machine"},{"value":"blister","label_en":"Blister","label_fr":"Blister"},{"value":"concentrate","label_en":"Concentrate","label_fr":"Concentré"}]'::jsonb, 10),
  ('copper', 'purity', 'Purity', 'Pureté', 'number', '%', '[]'::jsonb, 20),
  ('copper', 'diameter', 'Diameter', 'Diamètre', 'number', 'mm', '[]'::jsonb, 30),
  ('copper', 'packaging', 'Packaging', 'Conditionnement', 'text', NULL, '[]'::jsonb, 40),
  ('diamonds', 'type', 'Type', 'Type', 'select', NULL, '[{"value":"rough","label_en":"Rough","label_fr":"Brut"},{"value":"polished","label_en":"Polished","label_fr":"Taillé"}]'::jsonb, 10),
  ('diamonds', 'carat', 'Weight', 'Poids', 'number', 'ct', '[]'::jsonb, 20),
  ('diamonds', 'cert', 'Certificate', 'Certificat', 'text', NULL, '[]'::jsonb, 30),
  ('diamonds', 'compliance', 'Compliance', 'Conformité', 'text', NULL, '[]'::jsonb, 40),
  ('gold', 'form', 'Form', 'Forme', 'select', NULL, '[{"value":"dore","label_en":"Doré bars","label_fr":"Lingots doré"},{"value":"bullion","label_en":"Bullion","label_fr":"Lingots affinés"},{"value":"dust","label_en":"Dust","label_fr":"Poudre"}]'::jsonb, 10),
  ('gold', 'purity', 'Purity', 'Pureté', 'number', '%', '[]'::jsonb, 20),
  ('gold', 'weight', 'Weight', 'Poids', 'text', NULL, '[]'::jsonb, 30),
  ('gold', 'traceability', 'Certified traceability', 'Traçabilité certifiée', 'boolean', NULL, '[]'::jsonb, 40),
  ('iron-ore', 'form', 'Form', 'Forme', 'select', NULL, '[{"value":"lumps","label_en":"Lumps","label_fr":"Morceaux"},{"value":"fines","label_en":"Fines","label_fr":"Fines"},{"value":"pellets","label_en":"Pellets","label_fr":"Boulettes"}]'::jsonb, 10),
  ('iron-ore', 'fe_content', 'Iron content', 'Teneur en fer', 'number', '%', '[]'::jsonb, 20),
  ('iron-ore', 'moisture', 'Moisture', 'Humidité', 'number', '%', '[]'::jsonb, 30)
) AS t (slug, key, label_en, label_fr, field_type, unit, options, sort_order)
JOIN public.categories c ON c.slug = t.slug
ON CONFLICT (category_id, key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Existing values now under a NUMBER field
-- ---------------------------------------------------------------------------
-- Demo products stored these as text with the unit glued on ("99.99%", "8mm",
-- "6"). A number field keeps the unit on the template, so the value must be the
-- bare number — otherwise the page would print "99.99% %" and the form would
-- refuse the value. Only strings that are exactly a number (optionally followed
-- by % or mm) are converted; anything else is left untouched.

UPDATE public.products p
SET specs = jsonb_set(p.specs, '{purity}', to_jsonb(regexp_replace(p.specs->>'purity', '\s*(%|mm)$', '')::numeric))
FROM public.categories c
WHERE c.id = p.category_id
  AND c.slug = 'copper'
  AND jsonb_typeof(p.specs->'purity') = 'string'
  AND p.specs->>'purity' ~ '^[0-9]+(\.[0-9]+)?\s*(%|mm)?$';

UPDATE public.products p
SET specs = jsonb_set(p.specs, '{purity}', to_jsonb(regexp_replace(p.specs->>'purity', '\s*(%|mm)$', '')::numeric))
FROM public.categories c
WHERE c.id = p.category_id
  AND c.slug = 'cobalt'
  AND jsonb_typeof(p.specs->'purity') = 'string'
  AND p.specs->>'purity' ~ '^[0-9]+(\.[0-9]+)?\s*(%|mm)?$';

UPDATE public.products p
SET specs = jsonb_set(p.specs, '{co_content}', to_jsonb(regexp_replace(p.specs->>'co_content', '\s*(%|mm)$', '')::numeric))
FROM public.categories c
WHERE c.id = p.category_id
  AND c.slug = 'cobalt'
  AND jsonb_typeof(p.specs->'co_content') = 'string'
  AND p.specs->>'co_content' ~ '^[0-9]+(\.[0-9]+)?\s*(%|mm)?$';

UPDATE public.products p
SET specs = jsonb_set(p.specs, '{ta2o5}', to_jsonb(regexp_replace(p.specs->>'ta2o5', '\s*(%|mm)$', '')::numeric))
FROM public.categories c
WHERE c.id = p.category_id
  AND c.slug = 'coltan'
  AND jsonb_typeof(p.specs->'ta2o5') = 'string'
  AND p.specs->>'ta2o5' ~ '^[0-9]+(\.[0-9]+)?\s*(%|mm)?$';

UPDATE public.products p
SET specs = jsonb_set(p.specs, '{diameter}', to_jsonb(regexp_replace(p.specs->>'diameter', '\s*(%|mm)$', '')::numeric))
FROM public.categories c
WHERE c.id = p.category_id
  AND c.slug = 'copper'
  AND jsonb_typeof(p.specs->'diameter') = 'string'
  AND p.specs->>'diameter' ~ '^[0-9]+(\.[0-9]+)?\s*(%|mm)?$';

UPDATE public.products p
SET specs = jsonb_set(p.specs, '{diameter}', to_jsonb(regexp_replace(p.specs->>'diameter', '\s*(%|mm)$', '')::numeric))
FROM public.categories c
WHERE c.id = p.category_id
  AND c.slug = 'steel'
  AND jsonb_typeof(p.specs->'diameter') = 'string'
  AND p.specs->>'diameter' ~ '^[0-9]+(\.[0-9]+)?\s*(%|mm)?$';

UPDATE public.products p
SET specs = jsonb_set(p.specs, '{pack}', to_jsonb(regexp_replace(p.specs->>'pack', '\s*(%|mm)$', '')::numeric))
FROM public.categories c
WHERE c.id = p.category_id
  AND c.slug = 'beverages'
  AND jsonb_typeof(p.specs->'pack') = 'string'
  AND p.specs->>'pack' ~ '^[0-9]+(\.[0-9]+)?\s*(%|mm)?$';
