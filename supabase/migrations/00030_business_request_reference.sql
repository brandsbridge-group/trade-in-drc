-- 00030: human-readable reference IDs for business requests (design 10).
-- The "Find a Local Partner" confirmation shows a Request ID like
-- TIDRC-PR-2025-000124. Generate it from a sequence at insert time.

CREATE SEQUENCE IF NOT EXISTS public.business_request_ref_seq START 124;

ALTER TABLE public.business_requests
  ADD COLUMN IF NOT EXISTS reference TEXT;

ALTER TABLE public.business_requests
  ALTER COLUMN reference SET DEFAULT (
    'TIDRC-PR-' || to_char(NOW(), 'YYYY') || '-' ||
    lpad(nextval('public.business_request_ref_seq')::text, 6, '0')
  );

-- Backfill any existing rows that predate the column.
UPDATE public.business_requests
SET reference = 'TIDRC-PR-' || to_char(created_at, 'YYYY') || '-' ||
    lpad(nextval('public.business_request_ref_seq')::text, 6, '0')
WHERE reference IS NULL;

COMMENT ON COLUMN public.business_requests.reference IS
  'Human-readable request ID shown to submitters (TIDRC-PR-YYYY-NNNNNN).';
