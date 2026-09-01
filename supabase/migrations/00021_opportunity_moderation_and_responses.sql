-- 00021_opportunity_moderation_and_responses.sql
-- Cluster C10: Opportunities moderation audit + poster-visible responses + analytics fix.
--
-- 1. opportunity_moderation_events — admin-only audit trail of approve/reject/changes
--    decisions on an opportunity (who, what, why). Mirrors verification_reviews intent.
-- 2. opportunity_responses — lets a buyer/company respond to a published opportunity so
--    the poster (opportunity owner) can see interest (Req 13). Optionally linked to a
--    conversation thread for follow-up messaging.
-- 3. analytics_events.event_type CHECK — extend to also allow the new RFQ-board /
--    discovery event types without dropping the existing allowed values.
--
-- Every statement is idempotent and safe to re-run on a partially-migrated DB.
-- Reuses existing helpers: public.is_admin() (00002), public.touch_updated_at() (00004).

-- ===========================================================================
-- Table: opportunity_moderation_events  (admin-only moderation audit trail)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.opportunity_moderation_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id  uuid NOT NULL REFERENCES public.opportunities (id) ON DELETE CASCADE,
  actor_id        uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  action          text NOT NULL CHECK (action IN ('approved', 'rejected', 'requested_changes')),
  reason          text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS opportunity_moderation_events_opportunity_idx
  ON public.opportunity_moderation_events (opportunity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS opportunity_moderation_events_actor_idx
  ON public.opportunity_moderation_events (actor_id);

ALTER TABLE public.opportunity_moderation_events ENABLE ROW LEVEL SECURITY;

-- Admin-only: read.
DROP POLICY IF EXISTS "opportunity_moderation_events_admin_read"
  ON public.opportunity_moderation_events;
CREATE POLICY "opportunity_moderation_events_admin_read"
  ON public.opportunity_moderation_events FOR SELECT TO authenticated
  USING (public.is_admin());

-- Admin-only: insert (actor must be the acting admin).
DROP POLICY IF EXISTS "opportunity_moderation_events_admin_insert"
  ON public.opportunity_moderation_events;
CREATE POLICY "opportunity_moderation_events_admin_insert"
  ON public.opportunity_moderation_events FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() AND actor_id = auth.uid());

-- Admin-only: update.
DROP POLICY IF EXISTS "opportunity_moderation_events_admin_update"
  ON public.opportunity_moderation_events;
CREATE POLICY "opportunity_moderation_events_admin_update"
  ON public.opportunity_moderation_events FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Admin-only: delete.
DROP POLICY IF EXISTS "opportunity_moderation_events_admin_delete"
  ON public.opportunity_moderation_events;
CREATE POLICY "opportunity_moderation_events_admin_delete"
  ON public.opportunity_moderation_events FOR DELETE TO authenticated
  USING (public.is_admin());

DROP TRIGGER IF EXISTS opportunity_moderation_events_updated
  ON public.opportunity_moderation_events;
CREATE TRIGGER opportunity_moderation_events_updated
  BEFORE UPDATE ON public.opportunity_moderation_events
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ===========================================================================
-- Table: opportunity_responses  (Req 13 — poster sees responses to their post)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.opportunity_responses (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id  uuid NOT NULL REFERENCES public.opportunities (id) ON DELETE CASCADE,
  responder_id    uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  company_id      uuid REFERENCES public.companies (id) ON DELETE SET NULL,
  message         text NOT NULL,
  conversation_id uuid REFERENCES public.conversations (id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS opportunity_responses_opportunity_idx
  ON public.opportunity_responses (opportunity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS opportunity_responses_responder_idx
  ON public.opportunity_responses (responder_id);
CREATE INDEX IF NOT EXISTS opportunity_responses_conversation_idx
  ON public.opportunity_responses (conversation_id);

ALTER TABLE public.opportunity_responses ENABLE ROW LEVEL SECURITY;

-- Responder reads their own responses; the opportunity owner reads responses to
-- their opportunity; admins read all.
DROP POLICY IF EXISTS "opportunity_responses_read" ON public.opportunity_responses;
CREATE POLICY "opportunity_responses_read"
  ON public.opportunity_responses FOR SELECT TO authenticated
  USING (
    responder_id = auth.uid()
    OR public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.opportunities o
      JOIN public.companies c ON c.id = o.company_id
      WHERE o.id = opportunity_responses.opportunity_id
        AND c.owner_id = auth.uid()
    )
  );

-- Responder inserts their own response. Email-verified gate, consistent with
-- opportunities_owner_insert (00007). Cannot respond to your own opportunity.
DROP POLICY IF EXISTS "opportunity_responses_responder_insert"
  ON public.opportunity_responses;
CREATE POLICY "opportunity_responses_responder_insert"
  ON public.opportunity_responses FOR INSERT TO authenticated
  WITH CHECK (
    responder_id = auth.uid()
    AND public.is_email_verified()
    AND (
      company_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.companies c
        WHERE c.id = company_id AND c.owner_id = auth.uid()
      )
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.opportunities o
      JOIN public.companies c ON c.id = o.company_id
      WHERE o.id = opportunity_responses.opportunity_id
        AND c.owner_id = auth.uid()
    )
  );

-- Responder edits/deletes their own response; admin can moderate (delete).
DROP POLICY IF EXISTS "opportunity_responses_responder_update"
  ON public.opportunity_responses;
CREATE POLICY "opportunity_responses_responder_update"
  ON public.opportunity_responses FOR UPDATE TO authenticated
  USING (responder_id = auth.uid())
  WITH CHECK (responder_id = auth.uid());

DROP POLICY IF EXISTS "opportunity_responses_delete" ON public.opportunity_responses;
CREATE POLICY "opportunity_responses_delete"
  ON public.opportunity_responses FOR DELETE TO authenticated
  USING (responder_id = auth.uid() OR public.is_admin());

DROP TRIGGER IF EXISTS opportunity_responses_updated
  ON public.opportunity_responses;
CREATE TRIGGER opportunity_responses_updated
  BEFORE UPDATE ON public.opportunity_responses
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ===========================================================================
-- Fix: analytics_events.event_type CHECK
-- ---------------------------------------------------------------------------
-- 00001 created event_type with CHECK IN ('view', 'contact_request').
-- Drop the existing CHECK (by inferred name, handling both the default Postgres
-- name and any custom name) and recreate it preserving the original values plus
-- the new RFQ-board / discovery event types. Idempotent: only acts if the table
-- exists, and DROP IF EXISTS on the named constraint is a no-op when absent.
-- ===========================================================================
DO $$
DECLARE
  con record;
BEGIN
  IF to_regclass('public.analytics_events') IS NULL THEN
    RAISE NOTICE 'analytics_events does not exist yet; skipping event_type CHECK fix.';
    RETURN;
  END IF;

  -- Drop every CHECK constraint on analytics_events that references event_type.
  -- Postgres' default name is analytics_events_event_type_check, but we match by
  -- definition to be robust against custom names.
  FOR con IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'analytics_events'
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%event_type%'
  LOOP
    EXECUTE format(
      'ALTER TABLE public.analytics_events DROP CONSTRAINT %I',
      con.conname
    );
  END LOOP;

  -- Recreate with the original values preserved plus the new ones (deduped).
  ALTER TABLE public.analytics_events
    ADD CONSTRAINT analytics_events_event_type_check
    CHECK (event_type IN (
      'view',
      'contact_request',
      'rfq_board',
      'profile_view',
      'search_appearance',
      'search_query'
    ));
END $$;
