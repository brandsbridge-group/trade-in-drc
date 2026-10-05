-- =============================================================================
-- TradeInDRC — Product specification templates, per category
-- Migration: 00055_category_spec_fields.sql
-- =============================================================================
-- A product's specifications depend on what it is: coffee has a variety and an
-- altitude, copper a purity and a form. `products.specs` (jsonb, 00001) already
-- stores them as a flat `{ key: value }` object and the marketplace already
-- prints it — but nothing told the seller WHICH characteristics to give, so
-- every company named them its own way (or gave none), and nothing could be
-- compared or filtered.
--
-- This table is the template: the fields staff define for a category. In the
-- product form the seller fills those fields, then adds free lines for anything
-- else. Both land in `products.specs`, still a flat object:
--   - a template field  → specs[<key>]   = text | number | boolean | option value
--   - a free line       → specs[<label>] = text
-- so every existing reader and every existing product keeps working. A number
-- is stored raw (no unit): the unit lives on the template, which is what will
-- let the marketplace filter on it.
--
-- `key` is the stable identifier written into products.specs — it must never
-- change once products use it; the labels can be edited freely.

CREATE TABLE IF NOT EXISTS public.category_spec_fields (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.categories (id) ON DELETE CASCADE,
  key         text NOT NULL CHECK (key ~ '^[a-z][a-z0-9_]{0,59}$'),
  label_en    text NOT NULL CHECK (length(btrim(label_en)) > 0),
  label_fr    text NOT NULL CHECK (length(btrim(label_fr)) > 0),
  field_type  text NOT NULL DEFAULT 'text' CHECK (field_type IN ('text', 'number', 'select', 'boolean')),
  -- Shown after a number ("kg", "%", "m"). Ignored by the other types.
  unit        text CHECK (unit IS NULL OR length(unit) <= 20),
  -- Choices of a `select`: [{ "value": "washed", "label_en": "Washed", "label_fr": "Lavé" }, …]
  options     jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(options) = 'array'),
  required    boolean NOT NULL DEFAULT false,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (category_id, key)
);

CREATE INDEX IF NOT EXISTS category_spec_fields_category_idx
  ON public.category_spec_fields (category_id, sort_order);

DROP TRIGGER IF EXISTS category_spec_fields_updated_at ON public.category_spec_fields;
CREATE TRIGGER category_spec_fields_updated_at
  BEFORE UPDATE ON public.category_spec_fields
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE public.category_spec_fields ENABLE ROW LEVEL SECURITY;

-- Read: everyone. The template is needed by the seller's form and by the
-- public product page (to print the localized label and the unit).
DROP POLICY IF EXISTS "category_spec_fields_public_read" ON public.category_spec_fields;
CREATE POLICY "category_spec_fields_public_read"
  ON public.category_spec_fields FOR SELECT
  USING (true);

-- Write: staff only, like the rest of the taxonomy.
DROP POLICY IF EXISTS "category_spec_fields_staff_insert" ON public.category_spec_fields;
CREATE POLICY "category_spec_fields_staff_insert"
  ON public.category_spec_fields FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "category_spec_fields_staff_update" ON public.category_spec_fields;
CREATE POLICY "category_spec_fields_staff_update"
  ON public.category_spec_fields FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "category_spec_fields_staff_delete" ON public.category_spec_fields;
CREATE POLICY "category_spec_fields_staff_delete"
  ON public.category_spec_fields FOR DELETE
  TO authenticated
  USING (public.is_admin());

GRANT SELECT ON public.category_spec_fields TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.category_spec_fields TO authenticated;

COMMENT ON TABLE public.category_spec_fields IS
  'Specification template of a product category: the fields a seller fills in the product form. Values are stored in products.specs under `key`.';
