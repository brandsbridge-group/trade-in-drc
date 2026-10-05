-- =============================================================================
-- TradeInDRC — Fix the "owner of the first folder" storage policies
-- Migration: 00053_fix_storage_owner_folder_policies.sql
-- =============================================================================
-- Every owner-scoped storage policy (00001, 00011, 00018) was written as
--
--   EXISTS (SELECT 1 FROM public.companies
--           WHERE id::text = (storage.foldername(name))[1]
--             AND owner_id = auth.uid())
--
-- Inside that subquery an unqualified `name` resolves to the NEAREST relation
-- that has such a column — `companies.name`, not `storage.objects.name`.
-- Postgres stored the policies as `storage.foldername(companies.name)`, i.e.
-- "the company's display name must start with its own id as a folder": never
-- true. Result, found by a real upload test on 2026-10-02: every owner upload
-- was rejected ("new row violates row-level security policy") — verification
-- documents, logo, gallery photos, brochures and product images — and owners
-- could not read or delete their own files either. `company_documents` held
-- zero rows in production: no document had ever been stored.
--
-- Fix: recreate the 13 policies with the object's name qualified
-- (`objects.name`). Semantics are otherwise unchanged: same buckets, same
-- verbs, same roles, owner of the first path segment OR staff. The two
-- policies that still tested the legacy `profiles.role = 'admin'` now use
-- `public.is_admin()` like the others (it honours `staff_role` AND the legacy
-- role, so nobody loses access).

-- Shared predicate, inlined in each policy (a policy cannot call a helper
-- that needs the row's name without passing it, and inlining keeps the
-- definitions readable in pg_policies):
--   EXISTS (SELECT 1 FROM public.companies c
--           WHERE c.id::text = (storage.foldername(objects.name))[1]
--             AND c.owner_id = auth.uid())

-- ---------------------------------------------------------------------------
-- company-documents (private): verification documents
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "company_documents_bucket_owner_upload" ON storage.objects;
CREATE POLICY "company_documents_bucket_owner_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'company-documents'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id::text = (storage.foldername(objects.name))[1]
        AND c.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "company_documents_bucket_owner_read" ON storage.objects;
CREATE POLICY "company_documents_bucket_owner_read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'company-documents'
    AND (
      EXISTS (
        SELECT 1 FROM public.companies c
        WHERE c.id::text = (storage.foldername(objects.name))[1]
          AND c.owner_id = auth.uid()
      )
      OR public.is_admin()
    )
  );

DROP POLICY IF EXISTS "company_documents_bucket_owner_admin_delete" ON storage.objects;
CREATE POLICY "company_documents_bucket_owner_admin_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'company-documents'
    AND (
      EXISTS (
        SELECT 1 FROM public.companies c
        WHERE c.id::text = (storage.foldername(objects.name))[1]
          AND c.owner_id = auth.uid()
      )
      OR public.is_admin()
    )
  );

-- ---------------------------------------------------------------------------
-- company-assets (public read)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "company_assets_bucket_owner_upload" ON storage.objects;
CREATE POLICY "company_assets_bucket_owner_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'company-assets'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id::text = (storage.foldername(objects.name))[1]
        AND c.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "company_assets_bucket_owner_admin_delete" ON storage.objects;
CREATE POLICY "company_assets_bucket_owner_admin_delete"
  ON storage.objects FOR DELETE
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

-- ---------------------------------------------------------------------------
-- company-media (public read): logo, gallery
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "company_media_bucket_owner_upload" ON storage.objects;
CREATE POLICY "company_media_bucket_owner_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'company-media'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id::text = (storage.foldername(objects.name))[1]
        AND c.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "company_media_bucket_owner_update" ON storage.objects;
CREATE POLICY "company_media_bucket_owner_update"
  ON storage.objects FOR UPDATE
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

DROP POLICY IF EXISTS "company_media_bucket_owner_admin_delete" ON storage.objects;
CREATE POLICY "company_media_bucket_owner_admin_delete"
  ON storage.objects FOR DELETE
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

-- ---------------------------------------------------------------------------
-- company-brochures (public read)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "company_brochures_bucket_owner_upload" ON storage.objects;
CREATE POLICY "company_brochures_bucket_owner_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'company-brochures'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id::text = (storage.foldername(objects.name))[1]
        AND c.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "company_brochures_bucket_owner_update" ON storage.objects;
CREATE POLICY "company_brochures_bucket_owner_update"
  ON storage.objects FOR UPDATE
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

DROP POLICY IF EXISTS "company_brochures_bucket_owner_admin_delete" ON storage.objects;
CREATE POLICY "company_brochures_bucket_owner_admin_delete"
  ON storage.objects FOR DELETE
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

-- ---------------------------------------------------------------------------
-- product-images (public read)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "product_images_bucket_owner_upload" ON storage.objects;
CREATE POLICY "product_images_bucket_owner_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id::text = (storage.foldername(objects.name))[1]
        AND c.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "product_images_bucket_owner_admin_delete" ON storage.objects;
CREATE POLICY "product_images_bucket_owner_admin_delete"
  ON storage.objects FOR DELETE
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
