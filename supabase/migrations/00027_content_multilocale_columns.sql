-- =============================================================================
-- TradeInDRC — Multi-locale content columns (TR / ZH / ES)
-- Migration: 00027_content_multilocale_columns.sql
-- =============================================================================
-- The platform shipped bilingual (_en/_fr) content columns. Roadmap slice S9
-- adds Turkish, Simplified Chinese, and Spanish. Rather than hand-listing every
-- pair (answer, body, commodity, cta_label, description, excerpt, name, note,
-- price_indication, question, subtitle, summary, title — across ~12 tables), this
-- migration INTROSPECTS the schema: for every base table column named `<base>_en`
-- that has a matching `<base>_fr`, it adds `<base>_tr`, `<base>_zh`, `<base>_es`
-- of the EXACT same type, NULLABLE, IF NOT EXISTS.
--
-- Nullable + EN fallback in the app (src/lib/i18n/pick-localized.ts) means
-- existing rows stay valid and untranslated content gracefully shows English.
-- Fully idempotent and safe to re-run on the LIVE GOVERNMENT PROD DB.
-- Extends: 00001/00005/00006/00007/00008/00014/00016/00017/00018/00019/00020.
-- =============================================================================

DO $$
DECLARE
  r RECORD;
  loc TEXT;
  newcol TEXT;
BEGIN
  FOR r IN
    SELECT c.relname AS tbl,
           a.attname AS col,
           format_type(a.atttypid, a.atttypmod) AS typ
    FROM pg_attribute a
    JOIN pg_class c       ON c.oid = a.attrelid
    JOIN pg_namespace n   ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'           -- ordinary tables only (not views)
      AND a.attnum > 0
      AND NOT a.attisdropped
      AND a.attname LIKE '%\_en'
      AND EXISTS (                  -- only genuine bilingual pairs
        SELECT 1 FROM pg_attribute a2
        WHERE a2.attrelid = a.attrelid
          AND a2.attname = left(a.attname, length(a.attname) - 3) || '_fr'
          AND NOT a2.attisdropped
      )
  LOOP
    FOREACH loc IN ARRAY ARRAY['tr', 'zh', 'es']
    LOOP
      newcol := left(r.col, length(r.col) - 3) || '_' || loc;
      EXECUTE format(
        'ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS %I %s',
        r.tbl, newcol, r.typ
      );
    END LOOP;
  END LOOP;
END
$$;
