-- 00005_content_items.sql
-- Polymorphic content table for News, Events, and Blog posts.

CREATE TABLE IF NOT EXISTS public.content_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('news','event','blog')),
  slug text NOT NULL,
  title_en text NOT NULL,
  title_fr text NOT NULL,
  excerpt_en text,
  excerpt_fr text,
  body_en text NOT NULL DEFAULT '',
  body_fr text NOT NULL DEFAULT '',
  cover_url text,
  author_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  published_at timestamptz,
  -- event-only fields (null for news/blog)
  event_start_at timestamptz,
  event_end_at timestamptz,
  event_location text,
  -- common metadata
  tags text[] NOT NULL DEFAULT '{}',
  sector_id uuid REFERENCES public.sectors(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (type, slug)
);

CREATE INDEX IF NOT EXISTS content_items_type_status_published_at_idx
  ON public.content_items (type, status, published_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS content_items_event_start_idx
  ON public.content_items (event_start_at)
  WHERE type = 'event';

ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;

-- Public read: only published items.
CREATE POLICY "content_items_public_read_published"
  ON public.content_items FOR SELECT
  USING (status = 'published');

-- Admin full read/write.
CREATE POLICY "content_items_admin_all"
  ON public.content_items FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- updated_at trigger (touch_updated_at created in 00004).
DROP TRIGGER IF EXISTS content_items_updated ON public.content_items;
CREATE TRIGGER content_items_updated BEFORE UPDATE ON public.content_items
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Ensure published_at gets set when transitioning to 'published'.
CREATE OR REPLACE FUNCTION public.content_items_published_at_guard()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'published' AND NEW.published_at IS NULL THEN
    NEW.published_at = now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS content_items_published_at ON public.content_items;
CREATE TRIGGER content_items_published_at BEFORE INSERT OR UPDATE
  ON public.content_items
  FOR EACH ROW EXECUTE FUNCTION public.content_items_published_at_guard();
