-- 00015_audit_log.sql  (cluster C3)
-- Generic admin audit trail. Every privileged admin action (verifications,
-- taxonomy edits, user role changes, content moderation, etc.) writes one row.
--
-- Write path: SECURITY DEFINER server actions / the service-role key ONLY.
-- Both bypass RLS, so this table intentionally has NO insert/update/delete
-- policy for the `authenticated` role. Read path: admins only, via is_admin().
--
-- Idempotent + safe on a partially-migrated DB (uses IF NOT EXISTS and
-- DROP POLICY IF EXISTS guards). Do NOT apply while the Supabase project is
-- paused — run `supabase db push` after unpause.

-- ---------------------------------------------------------------------------
-- Table: audit_log
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_log (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id     UUID        REFERENCES public.profiles (id) ON DELETE SET NULL,
  action       TEXT        NOT NULL,
  entity_type  TEXT        NOT NULL,
  entity_id    UUID,
  summary      TEXT,
  metadata     JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.audit_log IS
  'Append-only admin audit trail. Written exclusively by SECURITY DEFINER server actions / the service-role key (both bypass RLS). Readable only by admins.';
COMMENT ON COLUMN public.audit_log.actor_id IS
  'profiles.id of the admin who performed the action. NULL if the actor was deleted or the action was system-initiated.';
COMMENT ON COLUMN public.audit_log.action IS
  'Verb-style action key, e.g. company.verify, taxonomy.sector.update, user.role.change.';
COMMENT ON COLUMN public.audit_log.entity_type IS
  'Logical table/entity the action targeted, e.g. companies, sectors, profiles, opportunities.';
COMMENT ON COLUMN public.audit_log.entity_id IS
  'Primary key of the affected row, when applicable. NULL for non-row-scoped actions.';
COMMENT ON COLUMN public.audit_log.summary IS
  'Short human-readable description of the change (not bilingual — internal admin tooling only).';
COMMENT ON COLUMN public.audit_log.metadata IS
  'Structured diff / context payload. Never store secrets or unhashed PII here.';

-- ---------------------------------------------------------------------------
-- Index: lookups by entity, newest first
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS audit_log_entity_idx
  ON public.audit_log (entity_type, entity_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- RLS: admins read; nobody writes via the API (service role / SECURITY DEFINER
-- bypass RLS). No INSERT/UPDATE/DELETE policy is defined on purpose.
-- ---------------------------------------------------------------------------
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_log_admin_read" ON public.audit_log;
CREATE POLICY "audit_log_admin_read" ON public.audit_log
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- updated_at trigger (project convention; touch_updated_at() from 00004).
-- Audit rows are append-only in practice, but the trigger keeps the column
-- honest for any future correction path.
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS audit_log_updated_at ON public.audit_log;
CREATE TRIGGER audit_log_updated_at
  BEFORE UPDATE ON public.audit_log
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
