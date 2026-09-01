-- 00028: allow anonymous buying requests from the public marketplace homepage.
-- The homepage lead-capture rail (customer design 1) must accept submissions
-- from visitors who have no account. Inserts happen server-side via the
-- service-role client (bypasses RLS), so no new RLS policy is needed —
-- submitter_id simply becomes nullable and keeps its FK.

ALTER TABLE public.business_requests
  ALTER COLUMN submitter_id DROP NOT NULL;

COMMENT ON COLUMN public.business_requests.submitter_id IS
  'Profile of the submitter; NULL for anonymous public submissions (homepage buying-request rail).';
