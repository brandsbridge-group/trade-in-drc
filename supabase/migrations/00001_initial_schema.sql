-- =============================================================================
-- TradeInDRC — Initial Schema
-- Migration: 00001_initial_schema.sql
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Helper: updated_at trigger function
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- Helper: create profile on new auth user
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- Table: profiles
-- ---------------------------------------------------------------------------
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  full_name   TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_read_own"
  ON profiles FOR SELECT
  USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

-- Trigger: create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ---------------------------------------------------------------------------
-- Table: sectors
-- ---------------------------------------------------------------------------
CREATE TABLE sectors (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en   TEXT NOT NULL,
  name_fr   TEXT NOT NULL,
  slug      TEXT NOT NULL UNIQUE,
  parent_id UUID REFERENCES sectors (id) ON DELETE SET NULL
);

ALTER TABLE sectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sectors_public_read"
  ON sectors FOR SELECT
  USING (true);

CREATE POLICY "sectors_admin_insert"
  ON sectors FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "sectors_admin_update"
  ON sectors FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "sectors_admin_delete"
  ON sectors FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- ---------------------------------------------------------------------------
-- Table: categories
-- ---------------------------------------------------------------------------
CREATE TABLE categories (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en   TEXT NOT NULL,
  name_fr   TEXT NOT NULL,
  slug      TEXT NOT NULL UNIQUE,
  sector_id UUID NOT NULL REFERENCES sectors (id) ON DELETE CASCADE
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_public_read"
  ON categories FOR SELECT
  USING (true);

CREATE POLICY "categories_admin_insert"
  ON categories FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "categories_admin_update"
  ON categories FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "categories_admin_delete"
  ON categories FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- ---------------------------------------------------------------------------
-- Table: companies
-- ---------------------------------------------------------------------------
CREATE TABLE companies (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  sector_id       UUID REFERENCES sectors (id) ON DELETE SET NULL,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  contact_email   TEXT,
  contact_phone   TEXT,
  website         TEXT,
  address         TEXT,
  city            TEXT,
  province        TEXT,
  logo_url        TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "companies_public_read_verified"
  ON companies FOR SELECT
  USING (status = 'verified' OR owner_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "companies_owner_insert"
  ON companies FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "companies_owner_update"
  ON companies FOR UPDATE
  USING (owner_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "companies_admin_delete"
  ON companies FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- ---------------------------------------------------------------------------
-- Table: company_documents
-- ---------------------------------------------------------------------------
CREATE TABLE company_documents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES companies (id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('business_license', 'tax_registration', 'proof_of_address', 'logo', 'photo')),
  file_url    TEXT NOT NULL,
  file_name   TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE company_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_documents_owner_select"
  ON company_documents FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM companies WHERE id = company_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "company_documents_owner_insert"
  ON company_documents FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM companies WHERE id = company_id AND owner_id = auth.uid())
  );

CREATE POLICY "company_documents_owner_update"
  ON company_documents FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM companies WHERE id = company_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "company_documents_admin_delete"
  ON company_documents FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM companies WHERE id = company_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ---------------------------------------------------------------------------
-- Table: products
-- ---------------------------------------------------------------------------
CREATE TABLE products (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES companies (id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories (id) ON DELETE SET NULL,
  images      TEXT[] NOT NULL DEFAULT '{}',
  specs       JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_public_read_verified_company"
  ON products FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM companies WHERE id = company_id AND status = 'verified')
    OR EXISTS (SELECT 1 FROM companies WHERE id = company_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "products_owner_insert"
  ON products FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM companies WHERE id = company_id AND owner_id = auth.uid())
  );

CREATE POLICY "products_owner_update"
  ON products FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM companies WHERE id = company_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "products_owner_admin_delete"
  ON products FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM companies WHERE id = company_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ---------------------------------------------------------------------------
-- Table: rfq_listings
-- ---------------------------------------------------------------------------
CREATE TABLE rfq_listings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES companies (id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  type        TEXT NOT NULL CHECK (type IN ('supply', 'demand')),
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'closed')),
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER rfq_listings_updated_at
  BEFORE UPDATE ON rfq_listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE rfq_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rfq_listings_public_read_active_verified"
  ON rfq_listings FOR SELECT
  USING (
    (status = 'active' AND EXISTS (SELECT 1 FROM companies WHERE id = company_id AND status = 'verified'))
    OR EXISTS (SELECT 1 FROM companies WHERE id = company_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "rfq_listings_owner_insert"
  ON rfq_listings FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM companies WHERE id = company_id AND owner_id = auth.uid())
  );

CREATE POLICY "rfq_listings_owner_update"
  ON rfq_listings FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM companies WHERE id = company_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "rfq_listings_owner_admin_delete"
  ON rfq_listings FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM companies WHERE id = company_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ---------------------------------------------------------------------------
-- Table: conversations
-- ---------------------------------------------------------------------------
CREATE TABLE conversations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   UUID NOT NULL REFERENCES companies (id) ON DELETE CASCADE,
  initiator_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  subject      TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (initiator_id, company_id)
);

CREATE TRIGGER conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Note: conversations_participants_read policy is created AFTER conversation_participants table

CREATE POLICY "conversations_auth_insert"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = initiator_id);

CREATE POLICY "conversations_admin_update"
  ON conversations FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- ---------------------------------------------------------------------------
-- Table: conversation_participants
-- ---------------------------------------------------------------------------
CREATE TABLE conversation_participants (
  conversation_id UUID NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  last_read_at    TIMESTAMPTZ,
  PRIMARY KEY (conversation_id, user_id)
);

ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversation_participants_read_own"
  ON conversation_participants FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "conversation_participants_update_own_last_read"
  ON conversation_participants FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "conversation_participants_system_insert"
  ON conversation_participants FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Deferred policy: requires conversation_participants to exist
CREATE POLICY "conversations_participants_read"
  ON conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = id AND user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ---------------------------------------------------------------------------
-- Table: messages
-- ---------------------------------------------------------------------------
CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  content         TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_participants_read"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "messages_participants_insert"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Table: verification_reviews
-- ---------------------------------------------------------------------------
CREATE TABLE verification_reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES companies (id) ON DELETE CASCADE,
  admin_id    UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  decision    TEXT NOT NULL CHECK (decision IN ('approved', 'rejected', 'more_info_requested', 'resubmitted')),
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE verification_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "verification_reviews_owner_read"
  ON verification_reviews FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM companies WHERE id = company_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "verification_reviews_admin_insert"
  ON verification_reviews FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "verification_reviews_admin_update"
  ON verification_reviews FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "verification_reviews_admin_delete"
  ON verification_reviews FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- ---------------------------------------------------------------------------
-- Table: analytics_events
-- ---------------------------------------------------------------------------
CREATE TABLE analytics_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('company', 'product', 'rfq')),
  entity_id   UUID NOT NULL,
  event_type  TEXT NOT NULL CHECK (event_type IN ('view', 'contact_request')),
  visitor_id  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX analytics_events_entity_idx ON analytics_events (entity_type, entity_id);
CREATE INDEX analytics_events_created_at_idx ON analytics_events (created_at);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "analytics_events_admin_read"
  ON analytics_events FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "analytics_events_service_role_insert"
  ON analytics_events FOR INSERT
  WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- Storage buckets
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public) VALUES
  ('company-documents', 'company-documents', false),
  ('company-assets',    'company-assets',    true),
  ('product-images',    'product-images',    true);

-- ---------------------------------------------------------------------------
-- Storage RLS: company-documents (private)
-- ---------------------------------------------------------------------------
CREATE POLICY "company_documents_bucket_owner_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'company-documents'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM companies
      WHERE id::text = (storage.foldername(name))[1]
        AND owner_id = auth.uid()
    )
  );

CREATE POLICY "company_documents_bucket_owner_read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'company-documents'
    AND (
      EXISTS (
        SELECT 1 FROM companies
        WHERE id::text = (storage.foldername(name))[1]
          AND owner_id = auth.uid()
      )
      OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

CREATE POLICY "company_documents_bucket_owner_admin_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'company-documents'
    AND (
      EXISTS (
        SELECT 1 FROM companies
        WHERE id::text = (storage.foldername(name))[1]
          AND owner_id = auth.uid()
      )
      OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- ---------------------------------------------------------------------------
-- Storage RLS: company-assets (public read)
-- ---------------------------------------------------------------------------
CREATE POLICY "company_assets_bucket_owner_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'company-assets'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM companies
      WHERE id::text = (storage.foldername(name))[1]
        AND owner_id = auth.uid()
    )
  );

CREATE POLICY "company_assets_bucket_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'company-assets');

CREATE POLICY "company_assets_bucket_owner_admin_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'company-assets'
    AND (
      EXISTS (
        SELECT 1 FROM companies
        WHERE id::text = (storage.foldername(name))[1]
          AND owner_id = auth.uid()
      )
      OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- ---------------------------------------------------------------------------
-- Storage RLS: product-images (public read)
-- ---------------------------------------------------------------------------
CREATE POLICY "product_images_bucket_owner_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM companies
      WHERE id::text = (storage.foldername(name))[1]
        AND owner_id = auth.uid()
    )
  );

CREATE POLICY "product_images_bucket_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "product_images_bucket_owner_admin_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-images'
    AND (
      EXISTS (
        SELECT 1 FROM companies
        WHERE id::text = (storage.foldername(name))[1]
          AND owner_id = auth.uid()
      )
      OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );
