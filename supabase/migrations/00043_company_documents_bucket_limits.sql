-- P2-8: wire document uploads to Supabase Storage.
--
-- The registration wizard's Documents step now uploads real files to the
-- `company-documents` bucket via the authenticated browser client (see
-- src/components/register/market/upload-documents.ts). The wizard already
-- enforces MIME type and a 5 MB ceiling client-side
-- (src/lib/storage/registration-documents.ts), but a client-side-only check
-- is not "validate server-side" — it can be bypassed by anyone calling
-- storage.upload() directly with a valid session. Supabase Storage enforces
-- `file_size_limit` / `allowed_mime_types` at the bucket level (server-side,
-- independent of any client code), so set them here instead of adding a
-- Next.js API-route layer for a check Storage already provides.
--
-- Limits mirror the wizard's own constants — keep both in sync by hand;
-- there is no single source of truth across SQL and TypeScript here.
UPDATE storage.buckets
SET
  file_size_limit = 5242880, -- 5 MB, matches MAX_REGISTRATION_DOCUMENT_BYTES
  allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png']
WHERE id = 'company-documents';
