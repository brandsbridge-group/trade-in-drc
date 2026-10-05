-- =============================================================================
-- TradeInDRC — Public buckets: stop letting anyone LIST the files
-- Migration: 00054_storage_public_buckets_no_listing.sql
-- =============================================================================
-- Supabase's storage advisor flags the four public buckets ("Clients can list
-- all files in this bucket"): each had a SELECT policy `bucket_id = '<bucket>'`
-- for every role, so any visitor could enumerate every company's files through
-- the storage API.
--
-- A PUBLIC bucket does not need a SELECT policy to serve files: public URLs
-- (`/storage/v1/object/public/...`, the only way the site displays logos,
-- photos, brochures and product images) bypass RLS. The policy is only needed
-- by API calls that must SEE the object row — here, `remove()`, which the
-- owner's media manager uses. So the read is narrowed to the people who manage
-- the files: the owner of the first path segment's company, or staff.
--
-- `objects.name` is qualified on purpose (see 00053).

DROP POLICY IF EXISTS "company_media_bucket_public_read" ON storage.objects;
DROP POLICY IF EXISTS "company_media_bucket_owner_read" ON storage.objects;
CREATE POLICY "company_media_bucket_owner_read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'company-media'
    AND (
      EXISTS (
        SELECT 1 FROM public.companies c
        WHERE c.id::text = (storage.foldername(objects.name))[1]
          AND c.owner_id = auth.uid()
      )
      OR public.is_admin()
    )
  );

DROP POLICY IF EXISTS "company_brochures_bucket_public_read" ON storage.objects;
DROP POLICY IF EXISTS "company_brochures_bucket_owner_read" ON storage.objects;
CREATE POLICY "company_brochures_bucket_owner_read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'company-brochures'
    AND (
      EXISTS (
        SELECT 1 FROM public.companies c
        WHERE c.id::text = (storage.foldername(objects.name))[1]
          AND c.owner_id = auth.uid()
      )
      OR public.is_admin()
    )
  );

DROP POLICY IF EXISTS "company_assets_bucket_public_read" ON storage.objects;
DROP POLICY IF EXISTS "company_assets_bucket_owner_read" ON storage.objects;
CREATE POLICY "company_assets_bucket_owner_read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'company-assets'
    AND (
      EXISTS (
        SELECT 1 FROM public.companies c
        WHERE c.id::text = (storage.foldername(objects.name))[1]
          AND c.owner_id = auth.uid()
      )
      OR public.is_admin()
    )
  );

DROP POLICY IF EXISTS "product_images_bucket_public_read" ON storage.objects;
DROP POLICY IF EXISTS "product_images_bucket_owner_read" ON storage.objects;
CREATE POLICY "product_images_bucket_owner_read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND (
      EXISTS (
        SELECT 1 FROM public.companies c
        WHERE c.id::text = (storage.foldername(objects.name))[1]
          AND c.owner_id = auth.uid()
      )
      OR public.is_admin()
    )
  );
