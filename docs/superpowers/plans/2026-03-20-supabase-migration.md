# Supabase Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Firebase (Auth, Firestore, Storage) with Supabase (Auth, PostgreSQL, Storage) while preserving all existing functionality.

**Architecture:** Supabase Direct approach — 4 client variants (browser, server, middleware, admin). RLS policies enforce authorization at the database level. Middleware handles session refresh, locale routing, and role-based route protection.

**Tech Stack:** @supabase/supabase-js, @supabase/ssr, Supabase CLI (migrations), PostgreSQL, next-intl

**Task Dependencies:** Tasks must be executed in order. Task 1 → 2 → 3 → 4 → 5 → 6 → 7. Task 5 (Auth) must complete before Task 6 (Page Queries) since pages depend on `useAuth()`. Task 3 (Schema) must complete before Task 6 since queries depend on tables existing.

**Prerequisites:** Install Supabase CLI globally (`npm install -g supabase`) or use `npx supabase`. A Supabase project must be created (cloud or local via `supabase start`).

---

## File Structure

### Files to Create

| File | Responsibility |
|---|---|
| `src/lib/supabase/client.ts` | Browser Supabase client (singleton) |
| `src/lib/supabase/server.ts` | Server Component Supabase client (per-request) |
| `src/lib/supabase/middleware.ts` | Middleware Supabase client (session refresh) |
| `src/lib/supabase/admin.ts` | Service role client (privileged operations) |
| `src/lib/supabase/types.ts` | Generated database types (placeholder until gen) |
| `src/constants/status.ts` | Status enums (company, document, RFQ) |
| `src/constants/storage.ts` | Storage bucket name constants |
| `src/constants/routes.ts` | Route path constants |
| `.env.example` | Environment variable template |
| `supabase/config.toml` | Supabase local dev config |
| `supabase/migrations/00001_initial_schema.sql` | Core tables, RLS, triggers |
| `supabase/seed.sql` | Initial sectors, categories, admin user |

### Files to Modify

| File | Change |
|---|---|
| `src/middleware.ts` | Add Supabase session refresh + role-based route protection |
| `src/lib/auth/auth-provider.tsx` | Replace Firebase Auth with Supabase Auth |
| `src/components/auth/user-auth-form.tsx` | Replace Firebase auth methods with Supabase |
| `src/app/[locale]/layout.tsx` | Remove Firebase providers, keep structure |
| `src/app/[locale]/dashboard/page.tsx` | Replace Firestore queries with Supabase |
| `src/app/[locale]/dashboard/inbox/page.tsx` | Replace Firestore queries with Supabase |
| `src/app/[locale]/dashboard/analytics/page.tsx` | Replace Firestore queries with Supabase |
| `src/app/[locale]/dashboard/companies/[id]/edit/page.tsx` | Replace Firestore CRUD with Supabase |
| `src/app/[locale]/admin/page.tsx` | Replace Firestore queries with Supabase |
| `src/app/[locale]/admin/verifications/page.tsx` | Replace Firestore queries with Supabase |
| `src/app/[locale]/register/page.tsx` | Replace Firestore + Storage with Supabase |
| `src/components/layout/featured-companies.tsx` | Replace Firestore queries with Supabase |
| `src/components/messaging/contact-supplier-modal.tsx` | Replace Firestore with Supabase |
| `package.json` | Remove firebase deps, add supabase deps |

### Files to Delete

| File | Reason |
|---|---|
| `src/lib/firebase/config.ts` | Replaced by `src/lib/supabase/client.ts` |
| `src/lib/firebase/admin.ts` | Replaced by `src/lib/supabase/admin.ts` |

---

## Task 1: Install Dependencies & Environment Setup

**Files:**
- Modify: `package.json`
- Create: `.env.example`
- Create: `src/constants/status.ts`
- Create: `src/constants/storage.ts`
- Create: `src/constants/routes.ts`

- [ ] **Step 1: Remove Firebase dependencies**

```bash
npm uninstall firebase firebase-admin
```

- [ ] **Step 2: Install Supabase dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr
```

- [ ] **Step 3: Create `.env.example`**

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

- [ ] **Step 4: Create `src/constants/status.ts`**

```typescript
export const COMPANY_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
} as const;

export const DOCUMENT_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export const DOCUMENT_TYPE = {
  BUSINESS_LICENSE: 'business_license',
  TAX_REGISTRATION: 'tax_registration',
  PROOF_OF_ADDRESS: 'proof_of_address',
  LOGO: 'logo',
  PHOTO: 'photo',
} as const;

export const RFQ_TYPE = {
  SUPPLY: 'supply',
  DEMAND: 'demand',
} as const;

export const RFQ_STATUS = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  CLOSED: 'closed',
} as const;

export const USER_ROLE = {
  USER: 'user',
  ADMIN: 'admin',
} as const;

export type CompanyStatus = (typeof COMPANY_STATUS)[keyof typeof COMPANY_STATUS];
export type DocumentStatus = (typeof DOCUMENT_STATUS)[keyof typeof DOCUMENT_STATUS];
export type DocumentType = (typeof DOCUMENT_TYPE)[keyof typeof DOCUMENT_TYPE];
export type RfqType = (typeof RFQ_TYPE)[keyof typeof RFQ_TYPE];
export type RfqStatus = (typeof RFQ_STATUS)[keyof typeof RFQ_STATUS];
export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];
```

- [ ] **Step 5: Create `src/constants/storage.ts`**

```typescript
export const STORAGE_BUCKETS = {
  COMPANY_DOCUMENTS: 'company-documents',
  COMPANY_ASSETS: 'company-assets',
  PRODUCT_IMAGES: 'product-images',
} as const;
```

- [ ] **Step 6: Create `src/constants/routes.ts`**

```typescript
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  AUTH_CALLBACK: '/callback',
  DASHBOARD: '/dashboard',
  DASHBOARD_COMPANIES: '/dashboard/companies',
  DASHBOARD_PRODUCTS: '/dashboard/products',
  DASHBOARD_RFQ: '/dashboard/rfq',
  DASHBOARD_INBOX: '/dashboard/inbox',
  DASHBOARD_ANALYTICS: '/dashboard/analytics',
  DASHBOARD_SETTINGS: '/dashboard/settings',
  ADMIN: '/admin',
  ADMIN_VERIFICATIONS: '/admin/verifications',
  ADMIN_COMPANIES: '/admin/companies',
  ADMIN_USERS: '/admin/users',
  ADMIN_TAXONOMY: '/admin/taxonomy',
  ADMIN_ANALYTICS: '/admin/analytics',
  ADMIN_SETTINGS: '/admin/settings',
  COMPANIES: '/companies',
  PRODUCTS: '/products',
  RFQ: '/rfq',
} as const;

export const PROTECTED_ROUTES = [ROUTES.DASHBOARD] as const;
export const ADMIN_ROUTES = [ROUTES.ADMIN] as const;
```

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json .env.example src/constants/
git commit -m "chore: swap Firebase for Supabase deps, add constants"
```

---

## Task 2: Supabase Client Setup

**Files:**
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/middleware.ts`
- Create: `src/lib/supabase/admin.ts`
- Create: `src/lib/supabase/types.ts`
- Delete: `src/lib/firebase/config.ts`
- Delete: `src/lib/firebase/admin.ts`

- [ ] **Step 1: Create browser client `src/lib/supabase/client.ts`**

```typescript
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 2: Create server client `src/lib/supabase/server.ts`**

```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from './types';

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from Server Component — ignore
          }
        },
      },
    }
  );
}
```

- [ ] **Step 3: Create middleware client `src/lib/supabase/middleware.ts`**

```typescript
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from './types';

export async function updateSession(request: NextRequest, response: NextResponse) {
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  return { supabase, user, response };
}
```

- [ ] **Step 4: Create admin client `src/lib/supabase/admin.ts`**

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
```

- [ ] **Step 5: Create placeholder types `src/lib/supabase/types.ts`**

```typescript
// Generated by: npx supabase gen types typescript --local > src/lib/supabase/types.ts
// This is a placeholder until the database schema is created and types are generated.

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: 'user' | 'admin';
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: 'user' | 'admin';
          full_name?: string | null;
          avatar_url?: string | null;
        };
        Update: {
          role?: 'user' | 'admin';
          full_name?: string | null;
          avatar_url?: string | null;
        };
      };
      companies: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          description: string;
          sector_id: string;
          status: 'pending' | 'verified' | 'rejected';
          contact_email: string;
          contact_phone: string;
          website: string | null;
          address: string;
          city: string;
          province: string;
          logo_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          description: string;
          sector_id: string;
          status?: 'pending' | 'verified' | 'rejected';
          contact_email: string;
          contact_phone: string;
          website?: string | null;
          address: string;
          city: string;
          province: string;
          logo_url?: string | null;
        };
        Update: {
          name?: string;
          description?: string;
          sector_id?: string;
          status?: 'pending' | 'verified' | 'rejected';
          contact_email?: string;
          contact_phone?: string;
          website?: string | null;
          address?: string;
          city?: string;
          province?: string;
          logo_url?: string | null;
        };
      };
      sectors: {
        Row: {
          id: string;
          name_en: string;
          name_fr: string;
          slug: string;
          parent_id: string | null;
        };
        Insert: {
          id?: string;
          name_en: string;
          name_fr: string;
          slug: string;
          parent_id?: string | null;
        };
        Update: {
          name_en?: string;
          name_fr?: string;
          slug?: string;
          parent_id?: string | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
```

- [ ] **Step 6: Delete Firebase files**

```bash
rm src/lib/firebase/config.ts src/lib/firebase/admin.ts
rmdir src/lib/firebase
```

- [ ] **Step 7: Commit**

```bash
git add src/lib/supabase/ src/lib/firebase/
git commit -m "feat: add Supabase client variants, remove Firebase config"
```

---

## Task 3: Database Schema & Migrations

**Files:**
- Create: `supabase/migrations/00001_initial_schema.sql`
- Create: `supabase/seed.sql`
- Create: `supabase/config.toml`

- [ ] **Step 0: Initialize Supabase CLI (if not already installed)**

```bash
npx supabase init
```

This creates the `supabase/` directory with `config.toml`. If already initialized, skip this step.

- [ ] **Step 1: Update `supabase/config.toml`**

Ensure it contains:

```toml
[project]
id = "tradeindrc"

[api]
port = 54321

[db]
port = 54322

[studio]
port = 54323
```

- [ ] **Step 2: Create initial migration `supabase/migrations/00001_initial_schema.sql`**

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON public.profiles FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Trigger: auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- SECTORS
-- ============================================================
CREATE TABLE public.sectors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_en TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  parent_id UUID REFERENCES public.sectors(id) ON DELETE SET NULL
);

ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sectors are publicly readable"
  ON public.sectors FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage sectors"
  ON public.sectors FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_en TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  sector_id UUID NOT NULL REFERENCES public.sectors(id) ON DELETE CASCADE
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are publicly readable"
  ON public.categories FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage categories"
  ON public.categories FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- ============================================================
-- COMPANIES
-- ============================================================
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  sector_id UUID NOT NULL REFERENCES public.sectors(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  website TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  province TEXT NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Verified companies are publicly readable"
  ON public.companies FOR SELECT
  USING (status = 'verified');

CREATE POLICY "Owners can read own companies"
  ON public.companies FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Authenticated users can create companies"
  ON public.companies FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update own companies"
  ON public.companies FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Admins have full access to companies"
  ON public.companies FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE TRIGGER companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- COMPANY DOCUMENTS
-- ============================================================
CREATE TABLE public.company_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('business_license', 'tax_registration', 'proof_of_address', 'logo', 'photo')),
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.company_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage own company documents"
  ON public.company_documents FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.companies WHERE id = company_id AND owner_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all company documents"
  ON public.company_documents FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  images TEXT[] DEFAULT '{}',
  specs JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products of verified companies are publicly readable"
  ON public.products FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.companies WHERE id = company_id AND status = 'verified'
  ));

CREATE POLICY "Owners can manage own products"
  ON public.products FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.companies WHERE id = company_id AND owner_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all products"
  ON public.products FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- RFQ LISTINGS
-- ============================================================
CREATE TABLE public.rfq_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('supply', 'demand')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'closed')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rfq_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active RFQs of verified companies are publicly readable"
  ON public.rfq_listings FOR SELECT
  USING (
    status = 'active'
    AND expires_at > now()
    AND EXISTS (
      SELECT 1 FROM public.companies WHERE id = company_id AND status = 'verified'
    )
  );

CREATE POLICY "Owners can manage own RFQs"
  ON public.rfq_listings FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.companies WHERE id = company_id AND owner_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all RFQs"
  ON public.rfq_listings FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE TRIGGER rfq_listings_updated_at
  BEFORE UPDATE ON public.rfq_listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- CONVERSATIONS
-- ============================================================
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  initiator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(initiator_id, company_id)
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can read own conversations"
  ON public.conversations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = id AND user_id = auth.uid()
  ));

CREATE POLICY "Authenticated users can create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() = initiator_id);

CREATE POLICY "Admins can read all conversations"
  ON public.conversations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE TRIGGER conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- CONVERSATION PARTICIPANTS
-- ============================================================
CREATE TABLE public.conversation_participants (
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ,
  PRIMARY KEY (conversation_id, user_id)
);

ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own participation"
  ON public.conversation_participants FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own last_read_at"
  ON public.conversation_participants FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can insert participants"
  ON public.conversation_participants FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- MESSAGES
-- ============================================================
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can read messages"
  ON public.messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
  ));

CREATE POLICY "Participants can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
    )
  );

-- ============================================================
-- VERIFICATION REVIEWS
-- ============================================================
CREATE TABLE public.verification_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES public.profiles(id),
  decision TEXT NOT NULL CHECK (decision IN ('approved', 'rejected', 'more_info_requested', 'resubmitted')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.verification_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company owners can read own reviews"
  ON public.verification_reviews FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.companies WHERE id = company_id AND owner_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all reviews"
  ON public.verification_reviews FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- ============================================================
-- ANALYTICS EVENTS
-- ============================================================
CREATE TABLE public.analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('company', 'product', 'rfq')),
  entity_id UUID NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'contact_request')),
  visitor_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read analytics"
  ON public.analytics_events FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Service role inserts analytics (no user-facing insert policy)

-- Index for analytics queries
CREATE INDEX idx_analytics_entity ON public.analytics_events (entity_type, entity_id);
CREATE INDEX idx_analytics_created ON public.analytics_events (created_at);

-- ============================================================
-- STORAGE BUCKETS (run via Supabase Dashboard or SQL)
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES
  ('company-documents', 'company-documents', false),
  ('company-assets', 'company-assets', true),
  ('product-images', 'product-images', true);

-- Storage RLS: company-documents (private)
CREATE POLICY "Company owners can upload documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'company-documents'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.companies WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Company owners can read own documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'company-documents'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.companies WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can read all documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'company-documents'
    AND EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Storage RLS: company-assets (public read for verified)
CREATE POLICY "Company owners can upload assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'company-assets'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.companies WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can read verified company assets"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'company-assets'
  );

-- Storage RLS: product-images (public read for verified)
CREATE POLICY "Company owners can upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.companies WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can read product images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'product-images'
  );

-- Storage delete policies (owner + admin)
CREATE POLICY "Owners can delete own storage objects"
  ON storage.objects FOR DELETE
  USING (
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.companies WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete any storage object"
  ON storage.objects FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

- [ ] **Step 3: Create seed data `supabase/seed.sql`**

```sql
-- Seed sectors
INSERT INTO public.sectors (name_en, name_fr, slug) VALUES
  ('Mining & Minerals', 'Mines et Minéraux', 'mining-minerals'),
  ('Agriculture', 'Agriculture', 'agriculture'),
  ('Forestry & Timber', 'Foresterie et Bois', 'forestry-timber'),
  ('Oil & Gas', 'Pétrole et Gaz', 'oil-gas'),
  ('Manufacturing', 'Industrie Manufacturière', 'manufacturing'),
  ('Textiles & Apparel', 'Textiles et Habillement', 'textiles-apparel'),
  ('Food & Beverages', 'Alimentation et Boissons', 'food-beverages'),
  ('Construction', 'Construction', 'construction'),
  ('Technology', 'Technologie', 'technology'),
  ('Energy', 'Énergie', 'energy');

-- Seed categories (example for Mining)
INSERT INTO public.categories (name_en, name_fr, slug, sector_id) VALUES
  ('Copper', 'Cuivre', 'copper', (SELECT id FROM public.sectors WHERE slug = 'mining-minerals')),
  ('Cobalt', 'Cobalt', 'cobalt', (SELECT id FROM public.sectors WHERE slug = 'mining-minerals')),
  ('Gold', 'Or', 'gold', (SELECT id FROM public.sectors WHERE slug = 'mining-minerals')),
  ('Diamonds', 'Diamants', 'diamonds', (SELECT id FROM public.sectors WHERE slug = 'mining-minerals')),
  ('Coltan', 'Coltan', 'coltan', (SELECT id FROM public.sectors WHERE slug = 'mining-minerals')),
  ('Coffee', 'Café', 'coffee', (SELECT id FROM public.sectors WHERE slug = 'agriculture')),
  ('Cocoa', 'Cacao', 'cocoa', (SELECT id FROM public.sectors WHERE slug = 'agriculture')),
  ('Palm Oil', 'Huile de Palme', 'palm-oil', (SELECT id FROM public.sectors WHERE slug = 'agriculture')),
  ('Rubber', 'Caoutchouc', 'rubber', (SELECT id FROM public.sectors WHERE slug = 'agriculture')),
  ('Teak', 'Teck', 'teak', (SELECT id FROM public.sectors WHERE slug = 'forestry-timber')),
  ('Mahogany', 'Acajou', 'mahogany', (SELECT id FROM public.sectors WHERE slug = 'forestry-timber'));
```

- [ ] **Step 4: Commit**

```bash
git add supabase/
git commit -m "feat: add Supabase schema, RLS policies, seed data"
```

---

## Task 4: Middleware — Session + Auth + Locale

**Files:**
- Modify: `src/middleware.ts`

- [ ] **Step 1: Rewrite middleware to combine next-intl + Supabase session**

```typescript
import { NextResponse, type NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { updateSession } from '@/lib/supabase/middleware';
import { PROTECTED_ROUTES, ADMIN_ROUTES, ROUTES } from '@/constants/routes';
import { USER_ROLE } from '@/constants/status';

const intlMiddleware = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  // Run next-intl middleware first (handles locale detection/redirect)
  const intlResponse = intlMiddleware(request);
  const response = intlResponse || NextResponse.next();

  // Refresh Supabase session
  const { supabase, user } = await updateSession(request, response);

  const pathname = request.nextUrl.pathname;
  // Strip locale prefix for route matching
  const pathnameWithoutLocale = pathname.replace(/^\/(en|fr)/, '') || '/';

  // Check if route requires auth
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathnameWithoutLocale.startsWith(route)
  );
  const isAdminRoute = ADMIN_ROUTES.some((route) =>
    pathnameWithoutLocale.startsWith(route)
  );

  if (isProtectedRoute && !user) {
    const locale = pathname.split('/')[1] || 'en';
    const loginUrl = new URL(`/${locale}${ROUTES.LOGIN}`, request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminRoute) {
    if (!user) {
      const locale = pathname.split('/')[1] || 'en';
      return NextResponse.redirect(new URL(`/${locale}${ROUTES.LOGIN}`, request.url));
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== USER_ROLE.ADMIN) {
      const locale = pathname.split('/')[1] || 'en';
      return NextResponse.redirect(new URL(`/${locale}`, request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/', '/(fr|en)/:path*'],
};
```

- [ ] **Step 2: Verify build passes**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: combine next-intl and Supabase session in middleware"
```

---

## Task 5: Auth Provider Migration

**Files:**
- Modify: `src/lib/auth/auth-provider.tsx`
- Modify: `src/components/auth/user-auth-form.tsx`
- Create: `src/app/[locale]/(auth)/callback/route.ts`

- [ ] **Step 1: Rewrite auth provider `src/lib/auth/auth-provider.tsx`**

```typescript
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "@/i18n/routing";
import type { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

- [ ] **Step 2: Rewrite auth form `src/components/auth/user-auth-form.tsx`**

Replace all Firebase auth calls with Supabase equivalents:
- `signInWithEmailAndPassword` → `supabase.auth.signInWithPassword`
- `createUserWithEmailAndPassword` → `supabase.auth.signUp`
- `sendPasswordResetEmail` → `supabase.auth.resetPasswordForEmail`
- Add Google OAuth: `supabase.auth.signInWithOAuth({ provider: 'google' })`
- Map Supabase error messages to user-friendly strings

- [ ] **Step 3: Create auth callback route `src/app/[locale]/(auth)/callback/route.ts`**

```typescript
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const redirect = searchParams.get('redirect') || '/';

  if (code) {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}${redirect}`);
}
```

- [ ] **Step 4: Update layout `src/app/[locale]/layout.tsx`**

Remove any Firebase-specific imports. The `AuthProvider` import stays the same — it now uses Supabase internally.

- [ ] **Step 5: Verify auth flow works**

```bash
npm run dev
```

Test: sign up, sign in, sign out in browser.

- [ ] **Step 6: Commit**

```bash
git add src/lib/auth/ src/components/auth/ src/app/[locale]/layout.tsx src/app/[locale]/(auth)/
git commit -m "feat: migrate auth from Firebase to Supabase"
```

---

## Task 6: Migrate Page Queries (Firestore → Supabase)

**Files:**
- Modify: `src/app/[locale]/dashboard/page.tsx`
- Modify: `src/app/[locale]/dashboard/inbox/page.tsx`
- Modify: `src/app/[locale]/dashboard/analytics/page.tsx`
- Modify: `src/app/[locale]/dashboard/companies/[id]/edit/page.tsx`
- Modify: `src/app/[locale]/admin/page.tsx`
- Modify: `src/app/[locale]/admin/verifications/page.tsx`
- Modify: `src/app/[locale]/register/page.tsx`
- Modify: `src/components/layout/featured-companies.tsx`
- Modify: `src/components/messaging/contact-supplier-modal.tsx`

- [ ] **Step 1: Migrate dashboard page**

Replace Firestore query pattern:
```typescript
// OLD: Firebase
import { db } from "@/lib/firebase/config";
import { collection, getDocs, query, where } from "firebase/firestore";
const q = query(collection(db, "companies"), where("ownerId", "==", user.uid));
const snapshot = await getDocs(q);
const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

// NEW: Supabase
import { createClient } from "@/lib/supabase/client";
const supabase = createClient();
const { data, error } = await supabase
  .from('companies')
  .select('id, name, sector_id, status')
  .eq('owner_id', user.id);
```

Apply this pattern to `src/app/[locale]/dashboard/page.tsx`.

- [ ] **Step 2: Migrate admin page**

Convert `src/app/[locale]/admin/page.tsx` — replace Firestore `getDocs` with `supabase.from('companies').select()`.

- [ ] **Step 3: Migrate admin verifications page**

Convert `src/app/[locale]/admin/verifications/page.tsx`.

- [ ] **Step 4: Migrate register page**

Convert `src/app/[locale]/register/page.tsx`:
- Replace `addDoc(collection(db, "companies"), ...)` → `supabase.from('companies').insert()`
- Replace Firebase Storage uploads → `supabase.storage.from('company-documents').upload()`

- [ ] **Step 5: Migrate company edit page**

Convert `src/app/[locale]/dashboard/companies/[id]/edit/page.tsx`:
- Replace `getDoc(doc(db, ...))` → `supabase.from('companies').select().eq('id', id).single()`
- Replace `updateDoc(...)` → `supabase.from('companies').update().eq('id', id)`

- [ ] **Step 6: Migrate inbox page**

Convert `src/app/[locale]/dashboard/inbox/page.tsx` — Firestore messages queries → Supabase.

- [ ] **Step 7: Migrate analytics page**

Convert `src/app/[locale]/dashboard/analytics/page.tsx`.

- [ ] **Step 8: Migrate featured companies component**

Convert `src/components/layout/featured-companies.tsx`:

```typescript
// OLD: Firebase
const q = query(collection(db, "companies"), where("verified", "==", true), limit(6), orderBy("createdAt", "desc"));
const snapshot = await getDocs(q);

// NEW: Supabase
import { createClient } from "@/lib/supabase/client";
const supabase = createClient();
const { data: companies } = await supabase
  .from('companies')
  .select('id, name, description, sector_id, logo_url, city, province')
  .eq('status', 'verified')
  .order('created_at', { ascending: false })
  .limit(6);
```

- [ ] **Step 9: Migrate contact supplier modal**

Convert `src/components/messaging/contact-supplier-modal.tsx`:

```typescript
// OLD: Firebase
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
await addDoc(collection(db, "messages"), {
  senderId: user.uid, senderEmail: user.email,
  receiverId, companyId, companyName, subject, body,
  read: false, createdAt: serverTimestamp()
});

// NEW: Supabase — create conversation + first message
import { createClient } from "@/lib/supabase/client";
const supabase = createClient();

// Check for existing conversation
const { data: existing } = await supabase
  .from('conversations')
  .select('id')
  .eq('initiator_id', user.id)
  .eq('company_id', companyId)
  .single();

let conversationId = existing?.id;

if (!conversationId) {
  // Create conversation + add participants
  const { data: conversation } = await supabase
    .from('conversations')
    .insert({ initiator_id: user.id, company_id: companyId, subject })
    .select('id')
    .single();
  conversationId = conversation!.id;

  // Add both participants (initiator + company owner)
  await supabase.from('conversation_participants').insert([
    { conversation_id: conversationId, user_id: user.id },
    { conversation_id: conversationId, user_id: companyOwnerId },
  ]);
}

// Send the message
await supabase.from('messages').insert({
  conversation_id: conversationId,
  sender_id: user.id,
  content: body,
});
```

- [ ] **Step 10: Verify build and lint**

```bash
npm run build && npm run lint
```

- [ ] **Step 11: Commit**

```bash
git add src/app/ src/components/
git commit -m "feat: migrate all page queries from Firestore to Supabase"
```

---

## Task 7: Final Cleanup & Verification

**Files:**
- Modify: `CLAUDE.md` (update Firebase references to Supabase)

- [ ] **Step 1: Search for any remaining Firebase references**

```bash
grep -r "firebase" src/ --include="*.ts" --include="*.tsx" -l
```

Expected: no results. If any remain, migrate them.

- [ ] **Step 2: Verify no Firebase imports remain**

```bash
grep -r "from.*firebase" src/ --include="*.ts" --include="*.tsx"
```

Expected: no results.

- [ ] **Step 3: Update CLAUDE.md**

Replace the Firebase section with Supabase documentation (client variants, env vars, schema).

- [ ] **Step 4: Full build + lint check**

```bash
npm run build && npm run lint
```

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md for Supabase migration"
```

- [ ] **Step 6: Push all changes**

```bash
git push
```

---

## Summary

| Task | Description | Est. Files |
|---|---|---|
| 1 | Dependencies & Constants | 5 new, 1 modified |
| 2 | Supabase Client Setup | 5 new, 2 deleted |
| 3 | Database Schema & Migrations | 3 new |
| 4 | Middleware (session + auth + locale) | 1 modified |
| 5 | Auth Provider Migration | 2 modified, 1 new |
| 6 | Page Query Migration | 9 modified |
| 7 | Final Cleanup | 1 modified |

**Total: 14 new files, 13 modified files, 2 deleted files, 7 commits**
