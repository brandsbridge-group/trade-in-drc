-- ===========================================================================
-- Widen public.company_documents.type CHECK to add `additional_document`.
--
-- Context: the registration wizard's optional "additional documents"
-- dropzone (src/components/register/market/upload-documents.ts) used to
-- store files as `photo` — a borrowed label chosen only because it was
-- already a legal enum value that EXPECTED_DOC_TYPES excludes from the
-- admin verification queue's completeness scoring (see that file's history:
-- it previously mapped to `proof_of_address`, which was a real compliance
-- defect — any unrelated file uploaded there made "Proof of address:
-- uploaded" read as satisfied). `photo` fixed the false-positive but is
-- still the wrong label: a PDF filed as "Photo" is confusing for reviewers.
--
-- This migration gives those files their own honest type,
-- `additional_document`, WITHOUT re-adding it to EXPECTED_DOC_TYPES — it
-- must never contribute to a completeness dot, same as `photo` and `logo`.
--
-- Idempotency: follows the discover-drop-readd pattern from migration
-- 00011 section 5 exactly. It finds whatever CHECK constraint currently
-- constrains `type` (by name, via pg_constraint) and drops it, then
-- re-adds a canonical, stably-named constraint guarded by an existence
-- check. Safe to run whether or not company_documents has existing rows
-- (widening an allowed set never invalidates existing data) and safe to
-- run more than once (the guard skips re-adding if already present).
-- ===========================================================================
DO $$
DECLARE
  v_conname TEXT;
BEGIN
  -- Find any existing CHECK constraint on company_documents that references `type`.
  FOR v_conname IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace ns ON ns.oid = rel.relnamespace
    WHERE ns.nspname = 'public'
      AND rel.relname = 'company_documents'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ILIKE '%type%'
  LOOP
    EXECUTE format(
      'ALTER TABLE public.company_documents DROP CONSTRAINT %I',
      v_conname
    );
  END LOOP;

  -- Re-add the canonical CHECK, widened to include `additional_document`,
  -- under the same stable constraint name migration 00011 established.
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace ns ON ns.oid = rel.relnamespace
    WHERE ns.nspname = 'public'
      AND rel.relname = 'company_documents'
      AND con.conname = 'company_documents_type_check'
  ) THEN
    ALTER TABLE public.company_documents
      ADD CONSTRAINT company_documents_type_check
      CHECK (type IN (
        'business_license',
        'tax_registration',
        'proof_of_address',
        'logo',
        'photo',
        'additional_document'
      ));
  END IF;
END
$$;
