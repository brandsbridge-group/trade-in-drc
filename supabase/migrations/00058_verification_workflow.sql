-- =============================================================================
-- TradeInDRC — Verification workflow: a complete trail, reviewable documents
-- Migration: 00058_verification_workflow.sql
-- =============================================================================
-- Audit of the verification circuit (owner sends → console queue → staff
-- decision → owner sees the outcome) found three gaps at the database level.
--
-- 1. The FIRST submission left no trace. `verification_reviews.decision` only
--    accepted approved / rejected / more_info_requested / resubmitted, so when
--    an owner sent a file for the first time nothing was recorded: the console
--    showed the company's CREATION date as "submitted on", the history started
--    at the first staff decision, and waiting time could not be measured.
--    → new value `submitted`.
--
-- 2. Owners could approve their own documents. `company_documents_owner_update`
--    (00001) let the owner UPDATE any column of their rows, including `status`
--    ('pending' | 'approved' | 'rejected') — the very field a reviewer sets.
--    Owners never need to update a document row (they add or remove files), so
--    UPDATE becomes staff-only.
--
-- 3. A reviewer could not say WHY a document was refused, nor could anyone tell
--    who reviewed it and when. → `review_note`, `reviewed_by`, `reviewed_at`.

-- ---------------------------------------------------------------------------
-- 1. `submitted` event
-- ---------------------------------------------------------------------------
ALTER TABLE public.verification_reviews
  DROP CONSTRAINT IF EXISTS verification_reviews_decision_check;

ALTER TABLE public.verification_reviews
  ADD CONSTRAINT verification_reviews_decision_check
  CHECK (decision IN ('submitted', 'approved', 'rejected', 'more_info_requested', 'resubmitted'));

COMMENT ON COLUMN public.verification_reviews.decision IS
  'submitted (owner, first send) → approved | rejected | more_info_requested (staff) → resubmitted (owner). admin_id is the acting user: staff for decisions, the owner for submitted/resubmitted.';

CREATE INDEX IF NOT EXISTS verification_reviews_company_created_idx
  ON public.verification_reviews (company_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- 2. Document rows: only staff update them
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "company_documents_owner_update" ON public.company_documents;
DROP POLICY IF EXISTS "company_documents_staff_update" ON public.company_documents;
CREATE POLICY "company_documents_staff_update"
  ON public.company_documents FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- 3. Per-document review
-- ---------------------------------------------------------------------------
ALTER TABLE public.company_documents
  ADD COLUMN IF NOT EXISTS review_note text CHECK (review_note IS NULL OR length(review_note) <= 500),
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

COMMENT ON COLUMN public.company_documents.review_note IS
  'Reviewer''s reason, shown to the owner (why a document was refused).';
