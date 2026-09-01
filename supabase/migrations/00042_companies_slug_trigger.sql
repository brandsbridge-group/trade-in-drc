-- ===========================================================================
-- P2-9: companies.slug is never generated on registration
-- ---------------------------------------------------------------------------
-- 00017_page_content.sql added companies.slug + a unique index, and backfilled
-- existing rows, but deliberately left NEW-ROW generation to the application
-- (see its comment at :204). register-company-actions.ts's insert has never
-- carried a `slug` key, so every company created since then has slug = NULL
-- and /trust/[companySlug] can never resolve for it — a cosmetic gap in the
-- design doc that is actually a hard registration/profile-page failure.
--
-- Fix: a BEFORE INSERT trigger that generates the slug in the database,
-- reusing the same slugify + numeric-suffix-on-collision approach as the
-- 00017 backfill, so app code and DB backfill can never drift out of sync.
-- Only fires when the caller didn't already supply a slug, so nothing here
-- changes if the app is later updated to pass one explicitly.
--
-- Improvement over the 00017 backfill's regexp: that one drops accented
-- characters straight to a hyphen (e.g. "Société Générale" -> "soci-t-g-n-rale"
-- instead of "societe-generale"), which is common in French company names —
-- the primary audience of this bilingual portal. This trigger transliterates
-- accented letters to their ASCII base via the standard `unaccent` contrib
-- extension (covers French/Portuguese/Spanish/German/Vietnamese, not just a
-- hand-picked table) before stripping whatever non-alphanumeric remains —
-- the same normalization the TS reference implementation in
-- src/lib/content/company-slug.ts documents and is tested against.
-- ===========================================================================

-- CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA extensions is NOT
-- enough on its own: IF NOT EXISTS matches on the extension NAME, not its
-- schema, so on any database where `unaccent` was already installed into
-- `public` (a common default before this project pinned `extensions`), the
-- statement below would silently no-op and leave unaccent in `public`.
-- extensions.unaccent(...) would then never resolve and every single
-- company INSERT would throw `function extensions.unaccent(text) does not
-- exist` — the exact failure this migration exists to prevent.
--
-- Handle all three states explicitly instead:
--   1. absent everywhere       -> CREATE EXTENSION into `extensions`
--   2. present in `extensions` -> no-op, already correct
--   3. present in another schema (e.g. `public`) -> relocate it there.
-- `unaccent` is a relocatable contrib extension (no RELOCATABLE = false in
-- its control file), so ALTER EXTENSION ... SET SCHEMA is safe and moves
-- both the extension's catalog entry and its function into `extensions`
-- without needing to drop/recreate it (which would risk breaking any other
-- object that already depends on it).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'unaccent') THEN
    CREATE EXTENSION unaccent WITH SCHEMA extensions;
  ELSIF (
    SELECT extnamespace::regnamespace::text
    FROM pg_extension
    WHERE extname = 'unaccent'
  ) <> 'extensions' THEN
    ALTER EXTENSION unaccent SET SCHEMA extensions;
  END IF;
END
$$;

-- STABLE (not IMMUTABLE): extensions.unaccent() itself is only STABLE
-- (its output depends on the server's loaded unaccent dictionary), so this
-- wrapper cannot be marked IMMUTABLE without risking incorrect results if it
-- were ever used to build an index.
--
-- SET search_path = public, extensions: on Supabase, `unaccent` normally
-- installs into the `extensions` schema, not `public`. Without an explicit
-- search_path, whether an unqualified `unaccent(...)` call resolves depends
-- on the search_path of whichever role performs the INSERT — if that role's
-- search_path doesn't include `extensions`, every company INSERT throws
-- `function unaccent(text) does not exist` and registration fails outright.
-- Fully qualifying the call as `extensions.unaccent(...)` plus pinning
-- search_path removes that dependency entirely.
CREATE OR REPLACE FUNCTION public.slugify_company_name(raw text)
RETURNS text
LANGUAGE sql
STABLE
SET search_path = public, extensions
AS $$
  SELECT trim(
    both '-' from
    regexp_replace(
      lower(extensions.unaccent(coalesce(raw, ''))),
      '[^a-z0-9]+', '-', 'g'
    )
  )
$$;

-- SECURITY DEFINER: today registration inserts via the service-role admin
-- client, which bypasses RLS entirely, so the collision-check SELECT below
-- sees every row regardless of this function's rights. But any FUTURE
-- insert made as `authenticated` would run this trigger under the
-- INSERTER's own RLS instead. The companies SELECT policy
-- (00013_rbac_roles.sql:148) is `status='verified' OR owner_id = auth.uid()
-- OR is_admin()`, so a non-admin inserter would be blind to other owners'
-- PENDING companies, could pick an already-taken slug, and would then die
-- on the unique index. SECURITY DEFINER makes the collision check run with
-- this function owner's (table owner's) privileges, which — like the
-- service-role path already relies on — see every row regardless of RLS,
-- so the slug it picks is always actually free.
--
-- SET search_path = public, extensions is mandatory here, not just
-- convenient: PostgreSQL SECURITY DEFINER functions execute with the
-- DEFINING role's privileges but (unless pinned) the CALLING session's
-- search_path. A caller could otherwise create a same-named function or
-- table earlier in their own search_path to have it silently substituted
-- for `public.companies` / `public.slugify_company_name` inside this
-- function's body — a classic search_path-hijack privilege-escalation
-- vector for SECURITY DEFINER routines. Pinning search_path removes that
-- attack surface entirely.
CREATE OR REPLACE FUNCTION public.set_company_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  base_slug  text;
  candidate  text;
  suffix     integer;
BEGIN
  -- Never overwrite a slug the caller already provided.
  IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN
    RETURN NEW;
  END IF;

  base_slug := public.slugify_company_name(NEW.name);

  IF base_slug IS NULL OR base_slug = '' THEN
    base_slug := 'company-' || replace(gen_random_uuid()::text, '-', '');
  END IF;

  -- Serialize concurrent inserts. A BEFORE INSERT trigger cannot catch its
  -- own row's unique-violation with an exception handler — the unique
  -- index is checked by the executor AFTER this function returns NEW, so
  -- by the time the violation would fire, this function has already
  -- committed to its answer and there is nothing here left to retry.
  -- Locking is therefore the only option, and it must be keyed on
  -- something that two DIFFERENT base slugs can still collide on: e.g.
  -- registering "Acme" (base `acme`, taken -> picks `acme-2`) concurrently
  -- with "Acme 2" (base `acme-2`, free -> picks `acme-2`) takes DIFFERENT
  -- locks under a base_slug-keyed scheme, so both collision-check loops
  -- can run before either commits, both land on `acme-2`, and the second
  -- INSERT dies on the unique index anyway. A single constant lock key for
  -- ALL slug generation closes that gap: every insert into `companies`
  -- serializes here regardless of which base_slug it computed, so the
  -- second inserter always waits for the first to commit and sees its row
  -- before picking a candidate. Company registration is low-volume (a
  -- government trade portal, not a high-throughput signup funnel), so
  -- lock-per-table beats the complexity of a narrower scheme. The lock is
  -- transaction-scoped and released automatically at transaction end.
  PERFORM pg_advisory_xact_lock(hashtext('public.companies:slug_generation'));

  candidate := base_slug;
  suffix := 1;

  -- Numeric-suffix collision loop, same shape as the 00017 backfill.
  WHILE EXISTS (
    SELECT 1 FROM public.companies WHERE slug = candidate
  ) LOOP
    suffix := suffix + 1;
    candidate := base_slug || '-' || suffix::text;
  END LOOP;

  NEW.slug := candidate;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_company_slug_trigger ON public.companies;
CREATE TRIGGER set_company_slug_trigger
  BEFORE INSERT ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.set_company_slug();

-- Backfill any rows created between 00017 and this migration that still
-- have no slug (i.e. everything registered since the app-side generation
-- 00017 assumed would exist, never did). Same collision-safe loop.
DO $$
DECLARE
  rec        record;
  base_slug  text;
  candidate  text;
  suffix     integer;
BEGIN
  FOR rec IN
    SELECT id, name
    FROM public.companies
    WHERE slug IS NULL
    ORDER BY created_at, id
  LOOP
    base_slug := public.slugify_company_name(rec.name);

    IF base_slug IS NULL OR base_slug = '' THEN
      base_slug := 'company-' || replace(rec.id::text, '-', '');
    END IF;

    candidate := base_slug;
    suffix := 1;

    WHILE EXISTS (
      SELECT 1 FROM public.companies
      WHERE slug = candidate AND id <> rec.id
    ) LOOP
      suffix := suffix + 1;
      candidate := base_slug || '-' || suffix::text;
    END LOOP;

    UPDATE public.companies SET slug = candidate WHERE id = rec.id;
  END LOOP;
END
$$;
