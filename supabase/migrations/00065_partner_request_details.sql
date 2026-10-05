-- 00065: the "find a local partner" form (/request) keeps what the visitor
-- answered, really stores the attached document, and its reference can be used
-- to follow the request.
--
-- Until now the form folded every answer into `message` as English text with
-- internal keys ("Primary need: jv_partner"), so staff could neither filter nor
-- read it comfortably, and the "attached document" was only its file name: the
-- file itself was never uploaded.
--
--   details          the form's own answers, as keys the console translates:
--                    { form, need, product, volume, preferences[], website }.
--                    Requests from other forms keep '{}'.
--   attachment_path  object path in the private `request-attachments` bucket
--   attachment_name  the file's original name, for the download link
--
-- `message` now holds the visitor's own words only (same rule as 00062).

ALTER TABLE public.business_requests
  ADD COLUMN IF NOT EXISTS details         JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS attachment_path TEXT,
  ADD COLUMN IF NOT EXISTS attachment_name TEXT;

COMMENT ON COLUMN public.business_requests.details IS
  'Answers specific to the form that created the request, stored as keys (never translated labels). Partner request: { form, need, product, volume, preferences[], website }.';
COMMENT ON COLUMN public.business_requests.attachment_path IS
  'Object path of the supporting document in the private request-attachments bucket. Read through a staff-only signed URL.';

-- The reference is what a visitor types to follow a request: it must point at
-- one request only. The sequence already guarantees it; this makes it a rule.
CREATE UNIQUE INDEX IF NOT EXISTS business_requests_reference_key
  ON public.business_requests (reference)
  WHERE reference IS NOT NULL;

-- Supporting documents. Private, and deliberately WITHOUT any storage policy:
-- a visitor uploads through a one-time signed upload URL issued by a server
-- action, and staff downloads through a short-lived signed URL. Size and type
-- are enforced by Storage itself, whatever the client sends.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'request-attachments',
  'request-attachments',
  false,
  10485760, -- 10 MB, matches MAX_ATTACHMENT_BYTES in src/lib/requests/partner-request.ts
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png'
  ]
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;
