-- 00066_taxonomy_safeguards.sql
-- Makes the taxonomy (sectors, categories, HS codes, tags) safe to manage from
-- the staff console (/console/taxonomy):
--
--   1. a display order staff can change (sectors, categories);
--   2. the address identifier (slug / HS code) is frozen once created — pages,
--      links and static config point at it;
--   3. an entry still in use cannot be deleted (before, deleting a sector
--      silently removed its categories and their specification templates, and
--      left products and companies unclassified);
--   4. deleting is reserved to super-admins;
--   5. every change leaves a row in audit_log, whoever makes it and by whatever
--      path (console, API, SQL);
--   6. one staff-only function returns the whole tree with its usage counts.
--
-- Staff checks use public.is_admin() / public.is_super_admin() (00013).

-- ===========================================================================
-- 1. Display order
-- ===========================================================================
ALTER TABLE public.sectors    ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.sectors.sort_order IS
  'Display order (ascending, then name_en). Set from /console/taxonomy.';
COMMENT ON COLUMN public.categories.sort_order IS
  'Display order inside the sector (ascending, then name_en). Set from /console/taxonomy.';

-- Start from the order every list showed until now (alphabetical, English).
UPDATE public.sectors s
SET sort_order = r.position * 10
FROM (SELECT id, row_number() OVER (ORDER BY name_en) AS position FROM public.sectors) r
WHERE r.id = s.id AND s.sort_order = 0;

UPDATE public.categories c
SET sort_order = r.position * 10
FROM (
  SELECT id, row_number() OVER (PARTITION BY sector_id ORDER BY name_en) AS position
  FROM public.categories
) r
WHERE r.id = c.id AND c.sort_order = 0;

CREATE INDEX IF NOT EXISTS categories_sector_order_idx ON public.categories (sector_id, sort_order);

-- ===========================================================================
-- 2. Frozen identifiers
--    To rename one on purpose, a migration must disable the trigger first.
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.taxonomy_freeze_identifier()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_TABLE_NAME = 'hs_codes' THEN
    IF NEW.code IS DISTINCT FROM OLD.code THEN
      RAISE EXCEPTION 'taxonomy_identifier_frozen' USING ERRCODE = 'P0001';
    END IF;
  ELSIF NEW.slug IS DISTINCT FROM OLD.slug THEN
    RAISE EXCEPTION 'taxonomy_identifier_frozen' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sectors_freeze_slug ON public.sectors;
CREATE TRIGGER sectors_freeze_slug
  BEFORE UPDATE OF slug ON public.sectors
  FOR EACH ROW EXECUTE FUNCTION public.taxonomy_freeze_identifier();

DROP TRIGGER IF EXISTS categories_freeze_slug ON public.categories;
CREATE TRIGGER categories_freeze_slug
  BEFORE UPDATE OF slug ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.taxonomy_freeze_identifier();

DROP TRIGGER IF EXISTS tags_freeze_slug ON public.tags;
CREATE TRIGGER tags_freeze_slug
  BEFORE UPDATE OF slug ON public.tags
  FOR EACH ROW EXECUTE FUNCTION public.taxonomy_freeze_identifier();

DROP TRIGGER IF EXISTS hs_codes_freeze_code ON public.hs_codes;
CREATE TRIGGER hs_codes_freeze_code
  BEFORE UPDATE OF code ON public.hs_codes
  FOR EACH ROW EXECUTE FUNCTION public.taxonomy_freeze_identifier();

-- ===========================================================================
-- 3. No deletion while in use
--    SECURITY DEFINER: the check must see every row, including the ones RLS
--    hides from the caller (unpublished products, unverified companies).
--    A category's specification template is its own configuration and goes
--    with it; it does not block the deletion.
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.taxonomy_block_delete_in_use()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_used boolean := false;
BEGIN
  IF TG_TABLE_NAME = 'sectors' THEN
    v_used :=
         EXISTS (SELECT 1 FROM categories    WHERE sector_id = OLD.id)
      OR EXISTS (SELECT 1 FROM companies     WHERE sector_id = OLD.id)
      OR EXISTS (SELECT 1 FROM opportunities WHERE sector_id = OLD.id)
      OR EXISTS (SELECT 1 FROM content_items WHERE sector_id = OLD.id)
      OR EXISTS (SELECT 1 FROM reports       WHERE sector_id = OLD.id)
      OR EXISTS (SELECT 1 FROM price_series  WHERE sector_id = OLD.id)
      OR EXISTS (SELECT 1 FROM hs_codes      WHERE sector_id = OLD.id)
      OR EXISTS (SELECT 1 FROM sectors       WHERE parent_id = OLD.id);
  ELSIF TG_TABLE_NAME = 'categories' THEN
    v_used :=
         EXISTS (SELECT 1 FROM products WHERE category_id = OLD.id)
      OR EXISTS (SELECT 1 FROM services WHERE category_id = OLD.id);
  ELSIF TG_TABLE_NAME = 'hs_codes' THEN
    v_used :=
         EXISTS (SELECT 1 FROM company_hs_codes WHERE hs_code_id = OLD.id)
      OR EXISTS (SELECT 1 FROM hs_codes         WHERE parent_code = OLD.code);
  ELSIF TG_TABLE_NAME = 'tags' THEN
    v_used := EXISTS (SELECT 1 FROM company_tags WHERE tag_id = OLD.id);
  END IF;

  IF v_used THEN
    RAISE EXCEPTION 'taxonomy_in_use' USING ERRCODE = '23503';
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS sectors_block_delete_in_use ON public.sectors;
CREATE TRIGGER sectors_block_delete_in_use
  BEFORE DELETE ON public.sectors
  FOR EACH ROW EXECUTE FUNCTION public.taxonomy_block_delete_in_use();

DROP TRIGGER IF EXISTS categories_block_delete_in_use ON public.categories;
CREATE TRIGGER categories_block_delete_in_use
  BEFORE DELETE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.taxonomy_block_delete_in_use();

DROP TRIGGER IF EXISTS hs_codes_block_delete_in_use ON public.hs_codes;
CREATE TRIGGER hs_codes_block_delete_in_use
  BEFORE DELETE ON public.hs_codes
  FOR EACH ROW EXECUTE FUNCTION public.taxonomy_block_delete_in_use();

DROP TRIGGER IF EXISTS tags_block_delete_in_use ON public.tags;
CREATE TRIGGER tags_block_delete_in_use
  BEFORE DELETE ON public.tags
  FOR EACH ROW EXECUTE FUNCTION public.taxonomy_block_delete_in_use();

-- ===========================================================================
-- 4. Deleting is a super-admin act (moderators still add and edit)
-- ===========================================================================
DROP POLICY IF EXISTS sectors_admin_delete ON public.sectors;
CREATE POLICY sectors_admin_delete
  ON public.sectors FOR DELETE TO authenticated
  USING (public.is_super_admin());

DROP POLICY IF EXISTS categories_admin_delete ON public.categories;
CREATE POLICY categories_admin_delete
  ON public.categories FOR DELETE TO authenticated
  USING (public.is_super_admin());

DROP POLICY IF EXISTS hs_codes_admin_delete ON public.hs_codes;
CREATE POLICY hs_codes_admin_delete
  ON public.hs_codes FOR DELETE TO authenticated
  USING (public.is_super_admin());

DROP POLICY IF EXISTS tags_admin_delete ON public.tags;
CREATE POLICY tags_admin_delete
  ON public.tags FOR DELETE TO authenticated
  USING (public.is_super_admin());

-- ===========================================================================
-- 5. Audit trail
--    One audit_log row per created, changed or deleted entry. A change of
--    display order alone is not logged (moving one entry renumbers the list).
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.taxonomy_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old     jsonb := CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END;
  v_new     jsonb := CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END;
  v_row     jsonb;
  v_changes jsonb := '{}'::jsonb;
  v_actor   uuid;
  v_key     text;
BEGIN
  v_row := coalesce(v_new, v_old);

  IF TG_OP = 'UPDATE' THEN
    FOR v_key IN SELECT jsonb_object_keys(v_new) LOOP
      IF v_key NOT IN ('updated_at', 'sort_order')
         AND (v_new -> v_key) IS DISTINCT FROM (v_old -> v_key) THEN
        v_changes := v_changes
          || jsonb_build_object(v_key, jsonb_build_object('from', v_old -> v_key, 'to', v_new -> v_key));
      END IF;
    END LOOP;
    IF v_changes = '{}'::jsonb THEN
      RETURN NULL;
    END IF;
  END IF;

  -- NULL when the change does not come from a signed-in staff member (migration, script).
  SELECT id INTO v_actor FROM profiles WHERE id = auth.uid();

  INSERT INTO audit_log (actor_id, action, entity_type, entity_id, summary, metadata)
  VALUES (
    v_actor,
    'taxonomy.' || TG_TABLE_NAME || '.' || lower(TG_OP),
    TG_TABLE_NAME,
    (v_row ->> 'id')::uuid,
    coalesce(v_row ->> 'name_en', v_row ->> 'label_en'),
    jsonb_strip_nulls(jsonb_build_object(
      'identifier',  coalesce(v_row ->> 'slug', v_row ->> 'code', v_row ->> 'key'),
      'category_id', v_row -> 'category_id',
      'sector_id',   v_row -> 'sector_id',
      'changes',     CASE WHEN TG_OP = 'UPDATE' THEN v_changes END
    ))
  );
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS sectors_audit ON public.sectors;
CREATE TRIGGER sectors_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.sectors
  FOR EACH ROW EXECUTE FUNCTION public.taxonomy_audit();

DROP TRIGGER IF EXISTS categories_audit ON public.categories;
CREATE TRIGGER categories_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.taxonomy_audit();

DROP TRIGGER IF EXISTS hs_codes_audit ON public.hs_codes;
CREATE TRIGGER hs_codes_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.hs_codes
  FOR EACH ROW EXECUTE FUNCTION public.taxonomy_audit();

DROP TRIGGER IF EXISTS tags_audit ON public.tags;
CREATE TRIGGER tags_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.tags
  FOR EACH ROW EXECUTE FUNCTION public.taxonomy_audit();

DROP TRIGGER IF EXISTS category_spec_fields_audit ON public.category_spec_fields;
CREATE TRIGGER category_spec_fields_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.category_spec_fields
  FOR EACH ROW EXECUTE FUNCTION public.taxonomy_audit();

-- ===========================================================================
-- 6. The whole tree with its usage counts, for the console
--    Counted here, not in the browser: RLS and the 1000-row cap would make the
--    counts wrong, and a wrong count would let a used entry look deletable.
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.console_taxonomy_overview()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not_authorized' USING ERRCODE = '42501';
  END IF;

  RETURN jsonb_build_object(
    'can_delete', public.is_super_admin(),
    'companies_without_sector', (SELECT count(*) FROM companies WHERE sector_id IS NULL),
    'sectors', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'id', s.id, 'slug', s.slug, 'sort_order', s.sort_order,
        'name_en', s.name_en, 'name_fr', s.name_fr,
        'name_es', s.name_es, 'name_tr', s.name_tr, 'name_zh', s.name_zh,
        'usage', jsonb_build_object(
          'categories',    (SELECT count(*) FROM categories    c WHERE c.sector_id = s.id),
          'companies',     (SELECT count(*) FROM companies     c WHERE c.sector_id = s.id),
          'opportunities', (SELECT count(*) FROM opportunities o WHERE o.sector_id = s.id),
          'content',       (SELECT count(*) FROM content_items i WHERE i.sector_id = s.id),
          'reports',       (SELECT count(*) FROM reports       r WHERE r.sector_id = s.id),
          'prices',        (SELECT count(*) FROM price_series  p WHERE p.sector_id = s.id),
          'hs_codes',      (SELECT count(*) FROM hs_codes      h WHERE h.sector_id = s.id),
          'sub_sectors',   (SELECT count(*) FROM sectors       x WHERE x.parent_id = s.id)
        )
      ) ORDER BY s.sort_order, s.name_en)
      FROM sectors s
    ), '[]'::jsonb),
    'categories', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'id', c.id, 'slug', c.slug, 'sort_order', c.sort_order, 'sector_id', c.sector_id,
        'name_en', c.name_en, 'name_fr', c.name_fr,
        'name_es', c.name_es, 'name_tr', c.name_tr, 'name_zh', c.name_zh,
        'usage', jsonb_build_object(
          'products',    (SELECT count(*) FROM products             p WHERE p.category_id = c.id),
          'services',    (SELECT count(*) FROM services             v WHERE v.category_id = c.id),
          'spec_fields', (SELECT count(*) FROM category_spec_fields f WHERE f.category_id = c.id)
        )
      ) ORDER BY c.sort_order, c.name_en)
      FROM categories c
    ), '[]'::jsonb),
    'hs_codes', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'id', h.id, 'code', h.code, 'parent_code', h.parent_code, 'sector_id', h.sector_id,
        'name_en', h.name_en, 'name_fr', h.name_fr,
        'name_es', h.name_es, 'name_tr', h.name_tr, 'name_zh', h.name_zh,
        'usage', jsonb_build_object(
          'companies', (SELECT count(*) FROM company_hs_codes j WHERE j.hs_code_id = h.id),
          'sub_codes', (SELECT count(*) FROM hs_codes         x WHERE x.parent_code = h.code)
        )
      ) ORDER BY h.code)
      FROM hs_codes h
    ), '[]'::jsonb),
    'tags', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'id', t.id, 'slug', t.slug,
        'name_en', t.name_en, 'name_fr', t.name_fr,
        'name_es', t.name_es, 'name_tr', t.name_tr, 'name_zh', t.name_zh,
        'usage', jsonb_build_object(
          'companies', (SELECT count(*) FROM company_tags j WHERE j.tag_id = t.id)
        )
      ) ORDER BY t.name_en)
      FROM tags t
    ), '[]'::jsonb),
    'history', coalesce((
      SELECT jsonb_agg(to_jsonb(recent) ORDER BY recent.created_at DESC)
      FROM (
        SELECT a.id, a.action, a.entity_type, a.entity_id, a.summary, a.metadata, a.created_at,
               p.full_name AS actor_name
        FROM audit_log a
        LEFT JOIN profiles p ON p.id = a.actor_id
        WHERE a.action LIKE 'taxonomy.%'
        ORDER BY a.created_at DESC
        LIMIT 50
      ) recent
    ), '[]'::jsonb)
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.console_taxonomy_overview() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.console_taxonomy_overview() FROM anon;
GRANT  EXECUTE ON FUNCTION public.console_taxonomy_overview() TO authenticated;

COMMENT ON FUNCTION public.console_taxonomy_overview() IS
  'Staff console taxonomy tree (is_admin() only): sectors, categories, HS codes and tags with usage counts, the last taxonomy changes, and whether the caller may delete (00066).';
