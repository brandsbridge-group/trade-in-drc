-- =============================================================================
-- TradeInDRC — Per-opportunity conversation threading
-- Migration: 00025_conversation_opportunity_threading.sql
-- =============================================================================
-- Conversations (introduced in 00001) carried a single UNIQUE (initiator_id,
-- company_id) constraint, which capped a user to exactly ONE thread per company.
-- That is too coarse: a buyer engaging a company about several distinct trade
-- opportunities had every message collapsed into one thread, losing the link to
-- the opportunity that prompted the outreach.
--
-- This migration lets a user hold:
--   * at most ONE company-level thread (opportunity_id IS NULL), and
--   * at most ONE thread PER opportunity (opportunity_id = <opportunity>).
--
-- We add a nullable opportunity_id FK, drop the old whole-table UNIQUE
-- constraint, and replace it with two indexes:
--   1. A composite UNIQUE index on (initiator_id, company_id, opportunity_id) —
--      this enforces one thread per (user, company, opportunity) tuple. NOTE:
--      Postgres treats NULLs as distinct in a UNIQUE index by default, so this
--      alone would NOT cap the company-level (NULL) threads to one.
--   2. A partial UNIQUE index on (initiator_id, company_id) WHERE
--      opportunity_id IS NULL — this restores the "one company-level thread"
--      guarantee that the original constraint provided.
--
-- RLS is unchanged: the existing conversations policies (00001
-- conversations_auth_insert / conversations_admin_update, plus the participant
-- read policy) key off initiator_id / participation, not the dropped constraint,
-- so no policy depends on it and none needs to change.
--
-- GOVERNMENT PRODUCTION DB: applied via `supabase db push`. Every statement is
-- idempotent (ADD COLUMN IF NOT EXISTS / DROP CONSTRAINT IF EXISTS / CREATE
-- INDEX IF NOT EXISTS) and safe to re-run on the live database.
-- Extends: 00001 (conversations, UNIQUE(initiator_id, company_id)),
-- 00007 (opportunities).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Per-opportunity link column
-- ---------------------------------------------------------------------------
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS opportunity_id UUID NULL
    REFERENCES public.opportunities (id) ON DELETE CASCADE;

-- ---------------------------------------------------------------------------
-- 2. Replace the coarse company-level uniqueness with opportunity-aware rules
-- ---------------------------------------------------------------------------
-- Drop the original table-level UNIQUE (initiator_id, company_id) from 00001.
-- Postgres named it with the default <table>_<cols>_key convention.
ALTER TABLE public.conversations
  DROP CONSTRAINT IF EXISTS conversations_initiator_id_company_id_key;

-- One thread per (user, company, opportunity). Distinct opportunities — and the
-- NULL company-level slot — are separate rows here; the partial index below
-- handles the NULL-collapsing the company-level thread requires.
CREATE UNIQUE INDEX IF NOT EXISTS conversations_initiator_company_opportunity_key
  ON public.conversations (initiator_id, company_id, opportunity_id);

-- At most one company-level thread (opportunity_id IS NULL) per (user, company).
CREATE UNIQUE INDEX IF NOT EXISTS conversations_company_level_unique
  ON public.conversations (initiator_id, company_id)
  WHERE opportunity_id IS NULL;

-- ---------------------------------------------------------------------------
-- 3. Index the new FK for per-opportunity thread lookups
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS conversations_opportunity_id_idx
  ON public.conversations (opportunity_id);
