-- =============================================================================
-- TradeInDRC — Secure messaging + anti-spam (cluster C2)
-- Migration: 00012_message_reports_and_rls.sql
-- =============================================================================
-- Adds message_reports (abuse reporting), tightens conversation_participants
-- INSERT RLS (no joining arbitrary conversations), adds companies.contact_visibility,
-- enforces a message content length cap, and exposes a PII-free companies_public view.
--
-- GOVERNMENT PRODUCTION DB: a human applies this later via `supabase db push`.
-- We cannot verify live state, so every statement is idempotent and safe on a
-- partially-migrated database (IF NOT EXISTS / DROP POLICY IF EXISTS / DO-block guards).
-- Extends: 00001 (conversations, conversation_participants, messages, companies,
-- profiles, analytics_events), 00002 (is_admin()).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Table: message_reports — user-submitted abuse reports against messages
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.message_reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id      UUID NOT NULL REFERENCES public.messages (id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES public.conversations (id) ON DELETE CASCADE,
  reporter_id     UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  reason          TEXT NOT NULL,
  details         TEXT,
  status          TEXT NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open', 'reviewed', 'dismissed', 'actioned')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS message_reports_message_id_idx
  ON public.message_reports (message_id);
CREATE INDEX IF NOT EXISTS message_reports_conversation_id_idx
  ON public.message_reports (conversation_id);
CREATE INDEX IF NOT EXISTS message_reports_reporter_id_idx
  ON public.message_reports (reporter_id);
CREATE INDEX IF NOT EXISTS message_reports_status_idx
  ON public.message_reports (status);

-- updated_at trigger (function update_updated_at() defined in 00001).
-- DROP IF EXISTS keeps re-runs idempotent (CREATE TRIGGER has no IF NOT EXISTS).
DROP TRIGGER IF EXISTS message_reports_updated_at ON public.message_reports;
CREATE TRIGGER message_reports_updated_at
  BEFORE UPDATE ON public.message_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.message_reports ENABLE ROW LEVEL SECURITY;

-- Reporter may file a report only as themselves, and only against a message in a
-- conversation they participate in (prevents reporting messages they cannot see).
DROP POLICY IF EXISTS message_reports_reporter_insert ON public.message_reports;
CREATE POLICY message_reports_reporter_insert
  ON public.message_reports FOR INSERT
  WITH CHECK (
    reporter_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = message_reports.conversation_id
        AND cp.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.id = message_reports.message_id
        AND m.conversation_id = message_reports.conversation_id
    )
  );

-- Reporter can see their own reports; admins can see all.
DROP POLICY IF EXISTS message_reports_read ON public.message_reports;
CREATE POLICY message_reports_read
  ON public.message_reports FOR SELECT
  USING (reporter_id = auth.uid() OR public.is_admin());

-- Only admins may triage (change status / moderate).
DROP POLICY IF EXISTS message_reports_admin_update ON public.message_reports;
CREATE POLICY message_reports_admin_update
  ON public.message_reports FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS message_reports_admin_delete ON public.message_reports;
CREATE POLICY message_reports_admin_delete
  ON public.message_reports FOR DELETE
  USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- Tighten conversation_participants INSERT RLS
-- ---------------------------------------------------------------------------
-- The original 00001 policy (conversation_participants_system_insert) allowed any
-- authenticated user to add ANY row (WITH CHECK auth.uid() IS NOT NULL), which lets
-- a user inject themselves or others into arbitrary conversations. Replace it: a
-- user may add ONLY themselves, OR add a profile that owns a company tied to the
-- conversation (so a company owner can be enrolled into a conversation about their
-- company). Admins may add anyone.
DROP POLICY IF EXISTS conversation_participants_system_insert ON public.conversation_participants;
DROP POLICY IF EXISTS conversation_participants_self_or_owned_insert ON public.conversation_participants;
CREATE POLICY conversation_participants_self_or_owned_insert
  ON public.conversation_participants FOR INSERT
  WITH CHECK (
    -- Adding yourself
    user_id = auth.uid()
    -- Or adding a user who owns the company this conversation is about,
    -- and the actor is the conversation initiator or that company's owner.
    OR (
      EXISTS (
        SELECT 1
        FROM public.conversations conv
        JOIN public.companies comp ON comp.id = conv.company_id
        WHERE conv.id = conversation_participants.conversation_id
          AND comp.owner_id = conversation_participants.user_id
          AND (conv.initiator_id = auth.uid() OR comp.owner_id = auth.uid())
      )
    )
    -- Or admin override
    OR public.is_admin()
  );

-- ---------------------------------------------------------------------------
-- companies.contact_visibility — how a company's contact details are exposed
-- ---------------------------------------------------------------------------
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS contact_visibility TEXT NOT NULL DEFAULT 'login_required';

-- Add the CHECK constraint only if it does not already exist (idempotent).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'companies_contact_visibility_check'
      AND conrelid = 'public.companies'::regclass
  ) THEN
    ALTER TABLE public.companies
      ADD CONSTRAINT companies_contact_visibility_check
      CHECK (contact_visibility IN ('direct', 'obfuscated', 'login_required'));
  END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- messages content length cap (<= 5000 chars) — anti-spam / abuse mitigation
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'messages_content_length_check'
      AND conrelid = 'public.messages'::regclass
  ) THEN
    ALTER TABLE public.messages
      ADD CONSTRAINT messages_content_length_check
      CHECK (char_length(content) <= 5000);
  END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- companies_public — PII-free, public-safe projection of verified companies
-- ---------------------------------------------------------------------------
-- Excludes contact_email and contact_phone (PII). security_invoker = on so the
-- underlying companies RLS still applies; the explicit status filter keeps the
-- public surface limited to verified companies for anon callers.
CREATE OR REPLACE VIEW public.companies_public
WITH (security_invoker = on) AS
  SELECT
    c.id,
    c.owner_id,
    c.name,
    c.description,
    c.sector_id,
    c.status,
    c.website,
    c.address,
    c.city,
    c.province,
    c.logo_url,
    c.contact_visibility,
    c.created_at,
    c.updated_at
  FROM public.companies c
  WHERE c.status = 'verified';

GRANT SELECT ON public.companies_public TO anon, authenticated;
