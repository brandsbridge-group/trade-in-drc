-- =============================================================================
-- TradeInDRC — Ensure pgcrypto extension
-- Migration: 00045_ensure_pgcrypto.sql
-- =============================================================================
-- 00001_initial_schema.sql already runs CREATE EXTENSION IF NOT EXISTS pgcrypto,
-- but seed.sql's gen_salt()/crypt() calls fail with 42883 on this remote project,
-- meaning the extension never actually got installed there even though the
-- migration history marks 00001 as applied. Re-assert it explicitly.

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
