-- 00014_taxonomy_hs_tags.sql  (cluster C3)
-- Taxonomy expansion: Harmonized System (HS) commodity codes + free-form tags,
-- plus join tables linking companies to HS codes and tags.
--
-- Idempotent + safe on a partially-migrated GOVERNMENT PRODUCTION database:
-- CREATE TABLE IF NOT EXISTS, ADD COLUMN IF NOT EXISTS, DROP POLICY IF EXISTS
-- before CREATE POLICY, CREATE INDEX IF NOT EXISTS, DROP TRIGGER IF EXISTS
-- before CREATE TRIGGER, and DO-block guards for FK constraints.
--
-- Reuses existing helpers/conventions:
--   public.is_admin()           -> 00002_add_is_admin_helper.sql
--   public.update_updated_at()  -> 00001_initial_schema.sql (updated_at trigger fn)
--   public.companies(id, owner_id), public.sectors(id) -> 00001_initial_schema.sql

-- ===========================================================================
-- hs_codes — Harmonized System commodity codes, self-referencing hierarchy,
-- optionally mapped to a sector. Public read, admin write.
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.hs_codes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text NOT NULL UNIQUE,
  name_en     text NOT NULL,
  name_fr     text NOT NULL,
  parent_code text REFERENCES public.hs_codes (code) ON DELETE SET NULL,
  sector_id   uuid REFERENCES public.sectors (id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Backfill columns if the table predated this migration.
ALTER TABLE public.hs_codes
  ADD COLUMN IF NOT EXISTS code        text,
  ADD COLUMN IF NOT EXISTS name_en     text,
  ADD COLUMN IF NOT EXISTS name_fr     text,
  ADD COLUMN IF NOT EXISTS parent_code text,
  ADD COLUMN IF NOT EXISTS sector_id   uuid,
  ADD COLUMN IF NOT EXISTS created_at  timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at  timestamptz NOT NULL DEFAULT now();

-- Ensure the self-referencing parent_code FK exists (guarded).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'hs_codes_parent_code_fkey'
  ) THEN
    ALTER TABLE public.hs_codes
      ADD CONSTRAINT hs_codes_parent_code_fkey
      FOREIGN KEY (parent_code) REFERENCES public.hs_codes (code) ON DELETE SET NULL;
  END IF;
END $$;

-- Ensure the sector FK exists (guarded).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'hs_codes_sector_id_fkey'
  ) THEN
    ALTER TABLE public.hs_codes
      ADD CONSTRAINT hs_codes_sector_id_fkey
      FOREIGN KEY (sector_id) REFERENCES public.sectors (id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS hs_codes_parent_code_idx ON public.hs_codes (parent_code);
CREATE INDEX IF NOT EXISTS hs_codes_sector_id_idx   ON public.hs_codes (sector_id);

DROP TRIGGER IF EXISTS hs_codes_updated_at ON public.hs_codes;
CREATE TRIGGER hs_codes_updated_at
  BEFORE UPDATE ON public.hs_codes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.hs_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS hs_codes_public_read ON public.hs_codes;
CREATE POLICY hs_codes_public_read
  ON public.hs_codes FOR SELECT
  USING (true);

DROP POLICY IF EXISTS hs_codes_admin_insert ON public.hs_codes;
CREATE POLICY hs_codes_admin_insert
  ON public.hs_codes FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS hs_codes_admin_update ON public.hs_codes;
CREATE POLICY hs_codes_admin_update
  ON public.hs_codes FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS hs_codes_admin_delete ON public.hs_codes;
CREATE POLICY hs_codes_admin_delete
  ON public.hs_codes FOR DELETE TO authenticated
  USING (public.is_admin());

-- ===========================================================================
-- tags — free-form taxonomy labels. Public read, admin write.
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.tags (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug       text NOT NULL UNIQUE,
  name_en    text NOT NULL,
  name_fr    text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tags
  ADD COLUMN IF NOT EXISTS slug       text,
  ADD COLUMN IF NOT EXISTS name_en    text,
  ADD COLUMN IF NOT EXISTS name_fr    text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS tags_updated_at ON public.tags;
CREATE TRIGGER tags_updated_at
  BEFORE UPDATE ON public.tags
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tags_public_read ON public.tags;
CREATE POLICY tags_public_read
  ON public.tags FOR SELECT
  USING (true);

DROP POLICY IF EXISTS tags_admin_insert ON public.tags;
CREATE POLICY tags_admin_insert
  ON public.tags FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS tags_admin_update ON public.tags;
CREATE POLICY tags_admin_update
  ON public.tags FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS tags_admin_delete ON public.tags;
CREATE POLICY tags_admin_delete
  ON public.tags FOR DELETE TO authenticated
  USING (public.is_admin());

-- ===========================================================================
-- company_hs_codes — join: companies <-> hs_codes.
-- Public read; write allowed to the company owner or an admin.
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.company_hs_codes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies (id) ON DELETE CASCADE,
  hs_code_id uuid NOT NULL REFERENCES public.hs_codes (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, hs_code_id)
);

CREATE INDEX IF NOT EXISTS company_hs_codes_company_idx ON public.company_hs_codes (company_id);
CREATE INDEX IF NOT EXISTS company_hs_codes_hs_code_idx ON public.company_hs_codes (hs_code_id);

DROP TRIGGER IF EXISTS company_hs_codes_updated_at ON public.company_hs_codes;
CREATE TRIGGER company_hs_codes_updated_at
  BEFORE UPDATE ON public.company_hs_codes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.company_hs_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS company_hs_codes_public_read ON public.company_hs_codes;
CREATE POLICY company_hs_codes_public_read
  ON public.company_hs_codes FOR SELECT
  USING (true);

DROP POLICY IF EXISTS company_hs_codes_owner_insert ON public.company_hs_codes;
CREATE POLICY company_hs_codes_owner_insert
  ON public.company_hs_codes FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.companies c
            WHERE c.id = company_id AND c.owner_id = auth.uid())
    OR public.is_admin()
  );

DROP POLICY IF EXISTS company_hs_codes_owner_update ON public.company_hs_codes;
CREATE POLICY company_hs_codes_owner_update
  ON public.company_hs_codes FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.companies c
            WHERE c.id = company_id AND c.owner_id = auth.uid())
    OR public.is_admin()
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.companies c
            WHERE c.id = company_id AND c.owner_id = auth.uid())
    OR public.is_admin()
  );

DROP POLICY IF EXISTS company_hs_codes_owner_delete ON public.company_hs_codes;
CREATE POLICY company_hs_codes_owner_delete
  ON public.company_hs_codes FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.companies c
            WHERE c.id = company_id AND c.owner_id = auth.uid())
    OR public.is_admin()
  );

-- ===========================================================================
-- company_tags — join: companies <-> tags.
-- Public read; write allowed to the company owner or an admin.
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.company_tags (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies (id) ON DELETE CASCADE,
  tag_id     uuid NOT NULL REFERENCES public.tags (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, tag_id)
);

CREATE INDEX IF NOT EXISTS company_tags_company_idx ON public.company_tags (company_id);
CREATE INDEX IF NOT EXISTS company_tags_tag_idx     ON public.company_tags (tag_id);

DROP TRIGGER IF EXISTS company_tags_updated_at ON public.company_tags;
CREATE TRIGGER company_tags_updated_at
  BEFORE UPDATE ON public.company_tags
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.company_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS company_tags_public_read ON public.company_tags;
CREATE POLICY company_tags_public_read
  ON public.company_tags FOR SELECT
  USING (true);

DROP POLICY IF EXISTS company_tags_owner_insert ON public.company_tags;
CREATE POLICY company_tags_owner_insert
  ON public.company_tags FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.companies c
            WHERE c.id = company_id AND c.owner_id = auth.uid())
    OR public.is_admin()
  );

DROP POLICY IF EXISTS company_tags_owner_update ON public.company_tags;
CREATE POLICY company_tags_owner_update
  ON public.company_tags FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.companies c
            WHERE c.id = company_id AND c.owner_id = auth.uid())
    OR public.is_admin()
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.companies c
            WHERE c.id = company_id AND c.owner_id = auth.uid())
    OR public.is_admin()
  );

DROP POLICY IF EXISTS company_tags_owner_delete ON public.company_tags;
CREATE POLICY company_tags_owner_delete
  ON public.company_tags FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.companies c
            WHERE c.id = company_id AND c.owner_id = auth.uid())
    OR public.is_admin()
  );
