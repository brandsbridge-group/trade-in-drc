-- 00006_marketplace_segments.sql
-- Marketplace expansion: canonical segments, company-segment join, services table.

-- ---------------------------------------------------------------------------
-- Table: segments (reference / seed table)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.segments (
  key           text        PRIMARY KEY CHECK (key IN (
                              'manufacturer','importer','exporter','finance',
                              'logistics','government','public_corp','facilitation'
                            )),
  name_en       text        NOT NULL,
  name_fr       text        NOT NULL,
  description_en text,
  description_fr text,
  sort_order    int         NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "segments_public_read" ON public.segments
  FOR SELECT USING (true);

CREATE POLICY "segments_admin_write" ON public.segments
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Seed 8 canonical segments; re-runs refresh translations safely.
INSERT INTO public.segments (key, name_en, name_fr, sort_order) VALUES
  ('manufacturer', 'Manufacturers',        'Fabricants',              1),
  ('importer',     'Importers',            'Importateurs',            2),
  ('exporter',     'Exporters',            'Exportateurs',            3),
  ('finance',      'Finance & Banking',    'Finance et banque',       4),
  ('logistics',    'Logistics & Shipping', 'Logistique et transport', 5),
  ('government',   'Government bodies',    'Organismes publics',      6),
  ('public_corp',  'Public corporations',  'Entreprises publiques',   7),
  ('facilitation', 'Trade facilitation',   'Facilitation commerciale',8)
ON CONFLICT (key) DO UPDATE
  SET name_en     = EXCLUDED.name_en,
      name_fr     = EXCLUDED.name_fr,
      sort_order  = EXCLUDED.sort_order;

-- ---------------------------------------------------------------------------
-- Table: company_segments (company ↔ segment join)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.company_segments (
  company_id  uuid NOT NULL REFERENCES public.companies (id) ON DELETE CASCADE,
  segment_key text NOT NULL REFERENCES public.segments   (key) ON DELETE RESTRICT,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (company_id, segment_key)
);

ALTER TABLE public.company_segments ENABLE ROW LEVEL SECURITY;

-- Public read when parent company is verified.
CREATE POLICY "company_segments_public_read" ON public.company_segments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = company_id AND c.status = 'verified'
    )
  );

-- Owner or admin can write.
CREATE POLICY "company_segments_owner_write" ON public.company_segments
  FOR ALL TO authenticated
  USING (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = company_id AND c.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = company_id AND c.owner_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS company_segments_segment_idx
  ON public.company_segments (segment_key);

-- ---------------------------------------------------------------------------
-- Table: services (non-physical offerings, mirrors products)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.services (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id           uuid        NOT NULL REFERENCES public.companies (id) ON DELETE CASCADE,
  name_en              text        NOT NULL,
  name_fr              text        NOT NULL,
  description_en       text,
  description_fr       text,
  category_id          uuid        REFERENCES public.categories (id) ON DELETE SET NULL,
  service_type         text        NOT NULL DEFAULT 'consulting'
                                   CHECK (service_type IN (
                                     'consulting','logistics','finance',
                                     'legal','custom','other'
                                   )),
  delivery_mode        text        NOT NULL DEFAULT 'on_request'
                                   CHECK (delivery_mode IN (
                                     'on_request','subscription','one_off','retainer'
                                   )),
  price_indication_en  text,
  price_indication_fr  text,
  status               text        NOT NULL DEFAULT 'active'
                                   CHECK (status IN ('active','paused','archived')),
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Public read: only active services from verified companies.
CREATE POLICY "services_public_read_active_verified" ON public.services
  FOR SELECT USING (
    status = 'active' AND EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = company_id AND c.status = 'verified'
    )
  );

-- Owner or admin full access; owner INSERT requires email-verified (mirrors 00003 pattern).
CREATE POLICY "services_owner_all" ON public.services
  FOR ALL TO authenticated
  USING (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = company_id AND c.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_admin() OR (
      public.is_email_verified() AND EXISTS (
        SELECT 1 FROM public.companies c
        WHERE c.id = company_id AND c.owner_id = auth.uid()
      )
    )
  );

CREATE INDEX IF NOT EXISTS services_company_idx ON public.services (company_id);
CREATE INDEX IF NOT EXISTS services_status_idx  ON public.services (status);

DROP TRIGGER IF EXISTS services_updated ON public.services;
CREATE TRIGGER services_updated
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
