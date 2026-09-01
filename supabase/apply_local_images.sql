-- Paste this into the Supabase Studio SQL editor and run once.
-- Idempotent: re-running has no effect.
-- After running, refresh /products, /companies, /news in the app.

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

UPDATE public.content_items SET cover_url =
  '/seed-images/content/' || regexp_replace(lower(title_en), '[^a-z0-9]+', '-', 'g') || '.webp'
WHERE status = 'published'
  AND (cover_url IS NULL OR cover_url LIKE '%placehold.co%');

-- Verify
SELECT
  (SELECT count(*) FROM products WHERE images[1] LIKE '/seed-images/%') AS products_now_local,
  (SELECT count(*) FROM companies WHERE logo_url LIKE '/seed-images/%') AS companies_now_local,
  (SELECT count(*) FROM content_items WHERE cover_url LIKE '/seed-images/%') AS content_now_local;
-- Expected: 25 / 15 / 7
