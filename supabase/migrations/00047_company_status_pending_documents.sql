-- =============================================================================
-- TradeInDRC — Company status `pending_documents`
-- Migration: 00047_company_status_pending_documents.sql
-- =============================================================================
-- The company form is now a short, signed-in-only form (name, sector,
-- location, contact). Companies created through it have no RCCM or documents
-- yet, so they must NOT land in the admin verification queue (`pending`).
--
--   pending_documents → created, nothing to review yet (new default)
--   pending           → owner submitted "Get verified" with at least the RCCM
--   verified/rejected → unchanged
--
-- The queue (src/lib/verifications/actions.ts) filters on `pending` only, so
-- it keeps showing reviewable files, and the 48h review SLA stays honest.
-- Public visibility is unaffected: every public read filters on 'verified'.

ALTER TABLE public.companies DROP CONSTRAINT IF EXISTS companies_status_check;

ALTER TABLE public.companies
  ADD CONSTRAINT companies_status_check
  CHECK (status IN ('pending_documents', 'pending', 'verified', 'rejected'));

COMMENT ON COLUMN public.companies.status IS
  'pending_documents (created, awaiting owner documents) → pending (in admin review) → verified | rejected.';
