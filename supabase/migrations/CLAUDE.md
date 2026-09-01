# Migration conventions

- Filename: `NNNNN_short_kebab_description.sql`, monotonically increasing (next free: 00010).
- Every table: `id uuid primary key default gen_random_uuid()`, `created_at timestamptz not null default now()`, `updated_at timestamptz not null default now()`, and an `updated_at` trigger.
- RLS: `alter table X enable row level security;` immediately after `create table`. Add explicit policies — no "FOR ALL TO public USING (true)".
- Bilingual columns: pair `name_en text not null` with `name_fr text not null` (and `_en/_fr` for any user-facing field). Slugs: `slug text unique not null`.
- Helper SQL functions go in `public`, marked `security definer set search_path = public` only when strictly needed (see `is_admin()` and `is_email_verified()`).
- Never edit a shipped migration — write a new one. Migrations are append-only history.
