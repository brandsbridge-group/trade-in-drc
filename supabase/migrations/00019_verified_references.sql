-- 00019_verified_references.sql  (cluster C9)
-- Verified References / network of trust (Req 15).
-- A company can vouch for other companies it has worked with. The referenced
-- party may be an on-platform company (referenced_company_id) or an off-platform
-- business (referenced_name). References are owner-submitted, admin-moderated.
--
-- Trust-link visibility rule: a reference shows publicly only when it is itself
-- approved AND (it is an off-platform reference OR the on-platform referenced
-- company is itself a verified company, i.e. companies.status = 'verified').
--
-- Idempotent + safe to re-run on a partially-migrated DB. Government production
-- database — a human applies this later via `supabase db push`; we cannot verify
-- live state, so every statement guards itself.

-- ---------------------------------------------------------------------------
-- Table: company_references
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.company_references (
  id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id             UUID        NOT NULL REFERENCES public.companies (id) ON DELETE CASCADE,
  referenced_company_id  UUID        REFERENCES public.companies (id) ON DELETE SET NULL,
  referenced_name        TEXT,
  relationship           TEXT,
  note_en                TEXT,
  note_fr                TEXT,
  status                 TEXT        NOT NULL DEFAULT 'pending'
                                     CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Guard columns individually in case the table pre-exists from a partial run.
ALTER TABLE public.company_references
  ADD COLUMN IF NOT EXISTS company_id            UUID,
  ADD COLUMN IF NOT EXISTS referenced_company_id UUID,
  ADD COLUMN IF NOT EXISTS referenced_name       TEXT,
  ADD COLUMN IF NOT EXISTS relationship          TEXT,
  ADD COLUMN IF NOT EXISTS note_en               TEXT,
  ADD COLUMN IF NOT EXISTS note_fr               TEXT,
  ADD COLUMN IF NOT EXISTS status                TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Ensure the status CHECK exists even if the column was added above without it.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'company_references_status_check'
      AND conrelid = 'public.company_references'::regclass
  ) THEN
    ALTER TABLE public.company_references
      ADD CONSTRAINT company_references_status_check
      CHECK (status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

-- Ensure either an on-platform link or an off-platform name is present.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'company_references_target_present_check'
      AND conrelid = 'public.company_references'::regclass
  ) THEN
    ALTER TABLE public.company_references
      ADD CONSTRAINT company_references_target_present_check
      CHECK (referenced_company_id IS NOT NULL OR referenced_name IS NOT NULL);
  END IF;
END $$;

-- A company cannot reference itself.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'company_references_no_self_check'
      AND conrelid = 'public.company_references'::regclass
  ) THEN
    ALTER TABLE public.company_references
      ADD CONSTRAINT company_references_no_self_check
      CHECK (referenced_company_id IS NULL OR referenced_company_id <> company_id);
  END IF;
END $$;

COMMENT ON TABLE public.company_references IS
  'Network-of-trust references. A company vouches for an on-platform company (referenced_company_id) or an off-platform business (referenced_name). Trust-link renders publicly only when status=approved and the referenced on-platform company is itself verified.';

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS company_references_company_idx
  ON public.company_references (company_id);

CREATE INDEX IF NOT EXISTS company_references_referenced_company_idx
  ON public.company_references (referenced_company_id)
  WHERE referenced_company_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS company_references_approved_idx
  ON public.company_references (company_id, status)
  WHERE status = 'approved';

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.company_references ENABLE ROW LEVEL SECURITY;

-- Public read: only approved references whose trust-link is renderable.
-- Off-platform references (referenced_company_id IS NULL) are always shown when
-- approved. On-platform references are shown only when the referenced company is
-- itself a verified company.
DROP POLICY IF EXISTS "company_references_public_read" ON public.company_references;
CREATE POLICY "company_references_public_read"
  ON public.company_references FOR SELECT
  USING (
    status = 'approved'
    AND (
      referenced_company_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.companies rc
        WHERE rc.id = referenced_company_id
          AND rc.status = 'verified'
      )
    )
  );

-- Owner read: the vouching company's owner sees all their references in any
-- status; admins see everything.
DROP POLICY IF EXISTS "company_references_owner_read" ON public.company_references;
CREATE POLICY "company_references_owner_read"
  ON public.company_references FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = company_id AND c.owner_id = auth.uid()
    )
    OR public.is_admin()
  );

-- Owner insert: must own the vouching company and be email-verified. New rows
-- land in pending for admin moderation.
DROP POLICY IF EXISTS "company_references_owner_insert" ON public.company_references;
CREATE POLICY "company_references_owner_insert"
  ON public.company_references FOR INSERT TO authenticated
  WITH CHECK (
    public.is_email_verified()
    AND status IN ('pending', 'rejected')
    AND EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = company_id AND c.owner_id = auth.uid()
    )
  );

-- Owner update: can edit their own references while not yet approved. They may
-- not self-approve (status stays pending/rejected after their edit).
DROP POLICY IF EXISTS "company_references_owner_update" ON public.company_references;
CREATE POLICY "company_references_owner_update"
  ON public.company_references FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = company_id AND c.owner_id = auth.uid()
    )
    AND status IN ('pending', 'rejected')
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = company_id AND c.owner_id = auth.uid()
    )
    AND status IN ('pending', 'rejected')
  );

-- Owner delete: can remove their own references in any status.
DROP POLICY IF EXISTS "company_references_owner_delete" ON public.company_references;
CREATE POLICY "company_references_owner_delete"
  ON public.company_references FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = company_id AND c.owner_id = auth.uid()
    )
  );

-- Admin: full control (moderation, approval, rejection, deletion).
DROP POLICY IF EXISTS "company_references_admin_all" ON public.company_references;
CREATE POLICY "company_references_admin_all"
  ON public.company_references FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- updated_at trigger (reuses public.touch_updated_at() from 00004)
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS company_references_updated_at ON public.company_references;
CREATE TRIGGER company_references_updated_at
  BEFORE UPDATE ON public.company_references
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
