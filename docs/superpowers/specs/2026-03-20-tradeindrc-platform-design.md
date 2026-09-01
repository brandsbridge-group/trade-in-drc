# TradeInDRC Platform — Design Specification

## Overview

TradeInDRC is the official bilingual (English/French) online trade portal for the Democratic Republic of Congo. It connects international buyers with verified Congolese exporters through company profiles, product listings, RFQ boards, and a government-managed verification pipeline.

**Tech stack**: Next.js 16, Supabase (Auth, PostgreSQL, Storage, Realtime), Tailwind CSS v4, shadcn/ui (new-york), next-intl, Framer Motion. All open-source, self-hostable.

## Subsystem Decomposition

The platform is built in 6 sequential sub-projects, each with its own implementation cycle:

1. **Supabase Migration** — Replace Firebase with Supabase (Auth, DB, Storage, types)
2. **Company Registration & Verification** — Self-registration form, document uploads, admin verification
3. **Client Dashboard** — Company management, product editing, analytics counters
4. **Admin Dashboard** — Verification queue, company/user management, taxonomy, platform stats
5. **Messaging System** — Contact request → threaded conversations via Supabase Realtime
6. **RFQ System** — Supply/demand showcase board for verified companies

---

## 1. Architecture

### Approach: Supabase Direct

- Next.js Server Components query Supabase directly (no custom API layer)
- RLS policies are the single source of truth for authorization
- Supabase Realtime for messaging
- Supabase Storage for documents and images

### Supabase Client Variants

| Client | File | Context |
|---|---|---|
| Browser | `lib/supabase/client.ts` | Client components, hooks |
| Server | `lib/supabase/server.ts` | Server Components, Server Actions |
| Middleware | `lib/supabase/middleware.ts` | Route protection, session refresh |
| Admin | `lib/supabase/admin.ts` | Service role for privileged operations |

### Auth

- **Providers**: Email/password + Google OAuth
- **Session**: Supabase Auth with middleware-level session management
- **Roles**: `profiles.role` column (`user` | `admin`), checked server-side
- **Route protection**: Middleware checks session + role before rendering `/dashboard/*` and `/admin/*`

### Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# App
NEXT_PUBLIC_APP_URL=
```

---

## 2. Database Schema

### Core Tables

**profiles**
- `id` (uuid, FK auth.users, PK)
- `role` (text, default 'user') — `user` | `admin`
- `full_name` (text)
- `avatar_url` (text, nullable)
- `created_at`, `updated_at`

**companies**
- `id` (uuid, PK)
- `owner_id` (uuid, FK profiles)
- `name` (text)
- `description` (text)
- `sector_id` (uuid, FK sectors)
- `status` (text) — `pending` | `verified` | `rejected`
- `contact_email`, `contact_phone` (text)
- `website` (text, nullable)
- `address` (text)
- `city`, `province` (text)
- `logo_url` (text, nullable)
- `created_at`, `updated_at`

**company_documents**
- `id` (uuid, PK)
- `company_id` (uuid, FK companies)
- `type` (text) — `business_license` | `tax_registration` | `proof_of_address` | `logo` | `photo`
- `file_url` (text)
- `file_name` (text)
- `status` (text) — `pending` | `approved` | `rejected`
- `created_at`

**products**
- `id` (uuid, PK)
- `company_id` (uuid, FK companies)
- `name` (text)
- `description` (text)
- `category_id` (uuid, FK categories, nullable)
- `images` (text[], array of storage URLs)
- `specs` (jsonb, nullable)
- `created_at`, `updated_at`

**rfq_listings**
- `id` (uuid, PK)
- `company_id` (uuid, FK companies)
- `title` (text)
- `description` (text)
- `type` (text) — `supply` | `demand`
- `status` (text) — `active` | `expired` | `closed`
- `expires_at` (timestamptz)
- `created_at`, `updated_at`

**conversations**
- `id` (uuid, PK)
- `company_id` (uuid, FK companies) — the company being contacted
- `initiator_id` (uuid, FK profiles) — who started the conversation
- `subject` (text, nullable)
- `created_at`, `updated_at`

**conversation_participants**
- `conversation_id` (uuid, FK conversations)
- `user_id` (uuid, FK profiles)
- `last_read_at` (timestamptz, nullable)
- PK: (conversation_id, user_id)

**messages**
- `id` (uuid, PK)
- `conversation_id` (uuid, FK conversations)
- `sender_id` (uuid, FK profiles)
- `content` (text)
- `created_at`

**sectors**
- `id` (uuid, PK)
- `name_en` (text)
- `name_fr` (text)
- `slug` (text, unique)
- `parent_id` (uuid, FK sectors, nullable) — tree structure

**categories**
- `id` (uuid, PK)
- `name_en` (text)
- `name_fr` (text)
- `slug` (text, unique)
- `sector_id` (uuid, FK sectors)

**verification_reviews**
- `id` (uuid, PK)
- `company_id` (uuid, FK companies)
- `admin_id` (uuid, FK profiles)
- `decision` (text) — `approved` | `rejected` | `more_info_requested`
- `notes` (text, nullable)
- `created_at`

**analytics_events**
- `id` (uuid, PK)
- `entity_type` (text) — `company` | `product` | `rfq`
- `entity_id` (uuid)
- `event_type` (text) — `view` | `contact_request`
- `visitor_id` (text) — anonymous cookie-based ID
- `created_at`

### RLS Policy Summary

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| profiles | own row OR admin | own row (via trigger) | own row OR admin | — |
| companies | verified (public) OR own (owner) OR admin | auth'd user | owner OR admin | admin |
| company_documents | owner OR admin | owner | owner OR admin | owner OR admin |
| products | via verified company (public) OR owner OR admin | owner of company | owner | owner OR admin |
| rfq_listings | active + verified company (public) OR owner OR admin | owner of verified company | owner | owner OR admin |
| conversations | participant only OR admin | auth'd user | participant (last_read_at) | — |
| conversation_participants | own rows (for unread count) OR admin | system (via conversation creation) | own row (last_read_at only) | — |
| messages | participant of conversation OR admin | participant of conversation | — | — |
| sectors/categories | all (public) | admin | admin | admin |
| verification_reviews | company owner (own company reviews) OR admin | admin | — | — |
| analytics_events | admin | service role (anon inserts via server) | — | admin |

**Product visibility**: Products are only publicly visible when their parent `companies.status = 'verified'`. Products of pending/rejected companies are visible only to the owner and admins.

### Storage Bucket Policies

| Bucket | Upload | Read | Delete |
|---|---|---|---|
| `company-documents` | `auth.uid() = company.owner_id` | `auth.uid() = company.owner_id` OR admin | owner OR admin |
| `company-assets` | `auth.uid() = company.owner_id` | Public when `company.status = 'verified'`, else owner/admin | owner OR admin |
| `product-images` | `auth.uid() = company.owner_id` | Public when `company.status = 'verified'`, else owner/admin | owner OR admin |

Storage paths follow: `{bucket}/{company_id}/{filename}` for easy ownership verification.

### Storage Buckets

| Bucket | Purpose | Access |
|---|---|---|
| `company-documents` | License, tax reg, proof of address | Owner upload, admin read |
| `company-assets` | Logos, photos | Owner upload, public read (verified) |
| `product-images` | Product photos | Owner upload, public read (verified) |

### Database Trigger

`on_auth_user_created` — automatically creates a `profiles` row with `role: 'user'` when a new auth user signs up.

---

## 3. Folder Structure

```
src/
├── app/
│   ├── [locale]/
│   │   ├── layout.tsx              # root providers
│   │   ├── page.tsx                # homepage
│   │   ├── (public)/               # no-auth route group
│   │   │   ├── companies/          # company directory
│   │   │   │   └── [id]/           # company profile
│   │   │   ├── products/
│   │   │   │   └── [id]/
│   │   │   ├── rfq/                # RFQ board
│   │   │   ├── about/
│   │   │   ├── news/
│   │   │   ├── events/
│   │   │   ├── blog/
│   │   │   ├── sectors/
│   │   │   ├── contact/
│   │   │   ├── faq/
│   │   │   └── ...legal pages
│   │   ├── (auth)/                 # auth pages group
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── callback/
│   │   ├── dashboard/              # client (auth required)
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx            # overview
│   │   │   ├── companies/
│   │   │   │   └── [id]/edit/
│   │   │   ├── products/
│   │   │   ├── rfq/
│   │   │   ├── inbox/
│   │   │   │   └── [id]/           # conversation thread
│   │   │   ├── analytics/
│   │   │   └── settings/
│   │   └── admin/                  # admin (role required)
│   │       ├── layout.tsx
│   │       ├── page.tsx            # overview
│   │       ├── verifications/
│   │       │   └── [id]/           # review detail
│   │       ├── companies/
│   │       ├── users/
│   │       ├── taxonomy/
│   │       ├── analytics/
│   │       └── settings/
│   └── globals.css
│
├── components/
│   ├── ui/                         # shadcn primitives
│   ├── layout/                     # navbar, footer, page-header
│   ├── auth/                       # auth forms, guards
│   ├── dashboard/                  # client dashboard UI
│   ├── admin/                      # admin dashboard UI
│   ├── companies/                  # company cards, lists, profile
│   ├── messaging/                  # inbox, thread, compose
│   └── rfq/                        # RFQ cards, forms
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # browser client
│   │   ├── server.ts               # server component client
│   │   ├── middleware.ts            # middleware client
│   │   ├── admin.ts                # service role client
│   │   └── types.ts                # generated DB types
│   ├── auth/
│   │   └── auth-provider.tsx
│   ├── search/
│   └── utils.ts
│
├── hooks/
│   ├── use-auth.ts
│   ├── use-company.ts
│   └── use-messages.ts
│
├── config/
│   ├── site.ts
│   ├── navigation.ts
│   ├── locales.ts
│   └── messages/
│       ├── en.json
│       └── fr.json
│
├── i18n/
│   ├── routing.ts
│   └── request.ts
│
├── types/
│   ├── company.ts
│   ├── rfq.ts
│   └── messaging.ts
│
├── constants/
│   ├── routes.ts                   # all route paths
│   ├── storage.ts                  # bucket names
│   └── status.ts                   # status enums
│
└── middleware.ts                    # next-intl + auth + role checks

supabase/
├── migrations/                     # versioned SQL migrations
├── seed.sql                        # initial sectors, categories, admin user
└── config.toml                     # local dev config
```

---

## 4. Registration & Verification Pipeline

### Flow

1. **Sign Up** — Email/password or Google OAuth → `auth.users` row → trigger creates `profiles` row
2. **Register Company** — Multi-step form (6 steps):
   - ① Basic Info (name, sector, description)
   - ② Contact Details (phone, email, address, website)
   - ③ Products (initial product listings)
   - ④ Documents (business license, tax registration, proof of address)
   - ⑤ Logo & Photos (company branding)
   - ⑥ Review & Submit
   - Creates `companies` (status: pending), `company_documents`, `products` rows
3. **Admin Review** — Admin sees pending companies in verification queue:
   - View company details and documents
   - Add notes
   - Decision: Approve / Reject / Request More Info
   - Creates `verification_reviews` row, updates `companies.status`
4. **Outcome**:
   - **Verified** → company visible publicly, can post RFQs, can receive messages
   - **Rejected** → reason shown to owner, can resubmit with fixes
   - **Pending** → dashboard shows current status

### Form Behavior

- Progress bar showing current step (1-6)
- Back/Continue navigation
- Form state persisted in React state (not saved to DB until submit)
- Validation per step using Zod schemas
- Final submit is a two-phase operation:
  1. Upload documents/images to Supabase Storage, collect returned URLs
  2. Create all DB rows (company, documents, products) in a single Supabase RPC transaction
  3. If DB insert fails, delete orphaned storage files via cleanup function
- This prevents orphaned files in storage

### Rejection & Resubmission Flow

- When admin rejects a company, `companies.status` is set to `rejected`
- The existing company row is preserved (not deleted)
- Owner sees rejection reason (from `verification_reviews.notes`) in their dashboard
- Owner can edit the company details and documents, then click "Resubmit for Review"
- Resubmit sets `companies.status` back to `pending` and creates a new `verification_reviews` row with `decision: 'resubmitted'`
- Admin sees resubmitted companies highlighted in the verification queue
- State transitions: `pending` → `verified` | `rejected` → `pending` (resubmit) → `verified` | `rejected`

### "Request More Info" Flow

- Admin selects "Request More Info" with notes explaining what's needed
- `companies.status` stays `pending` (not a separate state — avoids complexity)
- A `verification_reviews` row is created with `decision: 'more_info_requested'` and `notes`
- Owner sees the request in their dashboard with admin notes
- Owner updates their company/documents and the company remains in the verification queue for re-review
- No separate resubmit action needed — it's already pending

---

## 5. Client Dashboard

### Layout

Sidebar navigation (left) + main content area. Light theme.

### Sidebar Items

- Overview (default)
- My Companies
- Products
- RFQ Listings
- Inbox (with unread count badge)
- Analytics
- Settings

### Overview Page

- Stats row: Profile Views, Product Views, Contact Requests, Active RFQs (compact, inline — not oversized cards)
- Company list with status badges (Verified/Pending/Rejected) and Edit/View actions

### Key Pages

- **My Companies** — list of owner's companies with status, edit link
- **Company Edit** — edit company details, manage documents, update products
- **Products** — CRUD for products under owner's companies
- **RFQ Listings** — create/manage supply and demand listings
- **Inbox** — conversation list (left panel) + thread view (right panel)
- **Analytics** — basic counters: profile views, product views, contact requests (aggregated monthly)

---

## 6. Admin Dashboard

### Layout

Sidebar navigation (left) + main content area. Light theme. Slate sidebar.

### Sidebar Items

- Overview
- Verifications (with pending count badge)
- Companies
- Users
- Taxonomy (sectors/categories)
- Analytics
- Settings

### Security Model

- **Middleware** — on every request to `/admin/*`, creates a Supabase server client, calls `getUser()` (which validates the JWT with Supabase Auth server), then queries `profiles.role`. This ensures the role check uses fresh server-side data, not stale JWT claims.
- **RLS policies** — admin-only tables use a helper function `is_admin()` that checks `auth.uid()` against `profiles.role = 'admin'` in the database (not JWT metadata), ensuring role revocation takes effect immediately at the DB level.
- **Session refresh** — middleware refreshes the session on each request via `supabase.auth.getUser()`. If a user's role is revoked, the next request will fail the role check and redirect to `/`.
- **Audit trail** — every verification decision logged with `admin_id`, timestamp, notes in `verification_reviews`
- **Server-side only** — role is never read from or trusted on the client

### Verification Queue

- Table view: Company name, contact, sector, submitted date, document status (dot indicators), action button
- Filter tabs: All / New / Resubmitted
- Resubmitted rows highlighted
- Review detail page: full company info, document viewer, decision panel (approve/reject/request more info + notes)

### Other Admin Pages

- **Companies** — full list of all companies (all statuses), search, filter, detail view
- **Users** — registered users list, role management
- **Taxonomy** — CRUD for sectors and categories (bilingual name_en/name_fr)
- **Analytics** — platform-wide stats (total companies, verified count, registered users, active RFQs)

---

## 7. Messaging System

### Flow

1. Visitor clicks "Contact" on a company profile or RFQ listing
2. If not logged in → redirect to login, then return to the same page
3. System checks if a conversation already exists between this user and this company's **owner** — if yes, reuse it
4. If no existing conversation: create a `conversation` row with `company_id` context, add **initiator** and **company owner** (`companies.owner_id`) as `conversation_participants`
5. Redirect to the conversation thread in `/dashboard/inbox/[id]`
6. Messages delivered via Supabase Realtime subscriptions on the `messages` table (filter by `conversation_id`)

### Participant Model

- Conversations are **1:1** — between the initiator and the company owner
- The company owner is auto-added as a participant when the conversation is created
- If company ownership changes in the future, existing conversations remain with the original owner
- Both participants can read the full `conversation_participants` table for their own conversations (needed for unread count computation via `last_read_at`)

### Unread Count

- `conversation_participants.last_read_at` is updated when a user opens a conversation thread
- Unread count = messages in conversation where `created_at > last_read_at` and `sender_id != current_user`
- RLS: users can SELECT their own `conversation_participants` rows and UPDATE `last_read_at` on their own rows

### Inbox UI

- **Left panel**: conversation list with latest message preview, timestamp, company context, unread indicator
- **Right panel**: threaded message view with sent/received bubbles, read status, timestamps
- **Input**: text input + send button at bottom of thread

### Data Model

- `conversations` — one per unique (initiator_id, company_id) pair
- `conversation_participants` — exactly 2 rows per conversation (initiator + company owner), tracks `last_read_at`
- `messages` — ordered by `created_at`, `sender_id` identifies direction

---

## 8. RFQ Board

### Route: `/rfq` (separate page from `/companies`)

### Display

- List of active RFQ listings from verified companies only
- Each listing shows: type badge (Supply/Demand), title, company name, post date, expiry date
- Filter tabs: All / Supply / Demand
- Contact action → triggers messaging flow

### RFQ Expiration

- Public RFQ queries filter by `status = 'active' AND expires_at > now()` — no background job needed
- A Supabase database function `expire_rfq_listings()` runs via `pg_cron` daily to set `status = 'expired'` on listings past their `expires_at`. This is for data cleanliness, not for access control (the query filter handles that in real-time).

### Client Dashboard: RFQ Management

- Create new listing: title, description, type (supply/demand), expiry date
- Edit/close existing listings
- Only verified companies can create RFQ listings

---

## 9. Public Pages

### Dynamic (Supabase-connected)

- `/companies` — verified company directory, filterable by sector, searchable, paginated
- `/companies/[id]` — company profile with description, products, contact button
- `/products/[id]` — product detail page
- `/rfq` — RFQ board (active listings from verified companies)

### Static (unchanged for now)

- Homepage, About, News, Events, Blog, Sectors, Contact, FAQ, legal pages
- These remain static/mock content, to be connected to a CMS in a future phase

### Analytics Tracking

- Each public profile/product/RFQ view creates an `analytics_events` row via a Server Action (not client-side insert — avoids exposing the insert to the browser)
- `visitor_id` is a UUID stored in an HttpOnly, Secure, SameSite=Lax cookie with 1-year TTL, set by middleware on first visit
- The cookie identifies repeat visitors without authentication — no PII is stored
- Raw events stored for future detailed analytics; client dashboard shows aggregated counters via `count()` queries grouped by month

---

## 10. Design Principles

- **Light theme** for all dashboards and pages
- **Compact layout** — small paddings, small text, information density prioritized
- **Icons** — Lucide outline style only, single brand color throughout the app
- **CTAs** — use TradeInDRC primary brand/logo color
- **Typography** — clear hierarchy, professional/official government feel
- **shadcn/ui** — new-york style, properly configured with brand colors
- **Localization** — all user-facing text via next-intl (en/fr), including form labels, status badges, navigation

---

## 11. Internationalization

- **Locales**: `en` (default), `fr`
- **Routing**: `[locale]` segment via next-intl middleware
- **Messages**: `src/config/messages/en.json` and `fr.json`
- **Database content**: sectors and categories have `name_en` and `name_fr` columns. When querying, select the appropriate column based on the current locale (e.g., `name_${locale}`). Company/product names and descriptions are entered once by the owner (not bilingual) — translation of user-generated content is out of scope.
- **Search/filter on bilingual fields**: sector/category filters use the locale-appropriate column. Full-text search on company names uses a single `name` column (user-entered language).
- **Navigation**: locale-aware `Link`, `useRouter`, `usePathname` from `@/i18n/routing`

---

## 12. Implementation Order

1. **Supabase Migration** — remove Firebase, set up Supabase clients, schema, RLS, auth, storage buckets, types generation
2. **Company Registration & Verification** — registration form, document upload, admin verification queue
3. **Client Dashboard** — overview, company management, product CRUD, analytics counters
4. **Admin Dashboard** — full admin UI, user management, taxonomy CRUD, platform stats
5. **Messaging** — contact request flow, conversations, Realtime subscriptions
6. **RFQ System** — listing CRUD, public board, filtering

Each sub-project is independently deployable. Later sub-projects build on earlier ones but don't require rework.
