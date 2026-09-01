-- =============================================================================
-- TradeInDRC — Messaging performance hardening
-- Migration: 00024_messaging_indexes_and_activity.sql
-- =============================================================================
-- The messaging feature (conversations / conversation_participants / messages,
-- introduced in 00001) shipped without indexes on its hot foreign-key columns.
-- Postgres does NOT auto-index FK columns, so the thread read, the inbox list,
-- and the per-user rate-limit COUNT(*) all run sequential scans that degrade
-- linearly with total message volume.
--
-- This migration is additive and idempotent:
--   1. Indexes on the hot read/aggregate paths.
--   2. conversations.last_message_at — denormalized activity timestamp so the
--      inbox can order threads by real activity (the updated_at trigger does not
--      fire on a child message insert) and so the ordering column is indexable.
--   3. A SECURITY DEFINER trigger that bumps last_message_at on every message
--      insert. DEFINER is required: the conversations UPDATE policy is admin-only
--      (00001 conversations_admin_update), so a participant inserting a message
--      cannot update the parent row under their own RLS context.
--
-- GOVERNMENT PRODUCTION DB: applied via `supabase db push`. Every statement is
-- idempotent (IF NOT EXISTS / CREATE OR REPLACE / DROP ... IF EXISTS) and safe to
-- re-run on the live database.
-- Extends: 00001 (conversations, conversation_participants, messages,
-- update_updated_at()), 00012 (message content cap).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Indexes on the hot messaging paths
-- ---------------------------------------------------------------------------
-- Thread read: WHERE conversation_id = $1 ORDER BY created_at. Composite covers
-- both the filter and the sort in one index.
CREATE INDEX IF NOT EXISTS messages_conversation_id_created_at_idx
  ON public.messages (conversation_id, created_at);

-- Rate-limit aggregate (messaging/actions.ts isOverMessageRateLimit):
-- WHERE sender_id = $1 AND created_at >= $window. Runs on every send.
CREATE INDEX IF NOT EXISTS messages_sender_id_created_at_idx
  ON public.messages (sender_id, created_at);

-- Inbox list (use-messages.ts useConversations): WHERE user_id = $1.
CREATE INDEX IF NOT EXISTS conversation_participants_user_id_idx
  ON public.conversation_participants (user_id);

-- Thread reuse lookup + conversation rate-limit: WHERE initiator_id = $1
-- (also: UNIQUE (initiator_id, company_id) already indexes the pair, but a
-- standalone initiator_id index serves the time-windowed COUNT(*) better).
CREATE INDEX IF NOT EXISTS conversations_initiator_id_idx
  ON public.conversations (initiator_id);

-- Company-side lookups (conversations about a given company).
CREATE INDEX IF NOT EXISTS conversations_company_id_idx
  ON public.conversations (company_id);

-- ---------------------------------------------------------------------------
-- 2. conversations.last_message_at — denormalized activity timestamp
-- ---------------------------------------------------------------------------
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ;

-- Backfill from existing messages; fall back to the conversation's own
-- created_at for empty threads so the column is never NULL after this runs.
UPDATE public.conversations c
SET last_message_at = COALESCE(
  (SELECT MAX(m.created_at) FROM public.messages m WHERE m.conversation_id = c.id),
  c.created_at
)
WHERE c.last_message_at IS NULL;

-- New conversations default to their creation time until the first message lands.
ALTER TABLE public.conversations
  ALTER COLUMN last_message_at SET DEFAULT NOW();

-- Index the ordering column (inbox sorts by most-recent activity).
CREATE INDEX IF NOT EXISTS conversations_last_message_at_idx
  ON public.conversations (last_message_at DESC);

-- ---------------------------------------------------------------------------
-- 3. Trigger: bump last_message_at on each message insert
-- ---------------------------------------------------------------------------
-- SECURITY DEFINER (owned by the migration role, which bypasses RLS) so the
-- update succeeds even though conversations UPDATE is admin-only for normal
-- callers. search_path pinned to public per repo convention.
CREATE OR REPLACE FUNCTION public.bump_conversation_last_message_at()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  UPDATE public.conversations
    SET last_message_at = NEW.created_at
    WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS messages_bump_conversation_activity ON public.messages;
CREATE TRIGGER messages_bump_conversation_activity
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.bump_conversation_last_message_at();
