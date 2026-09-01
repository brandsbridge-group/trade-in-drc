# Foundation schema contracts (from migrations 00011–00021)

Non-obvious truths the feature/verification agents MUST honor. Sourced from the migration authors' notes.

## Verification / trust (00011)
- **No `companies.verified` boolean exists.** Trust state = `companies.verification_tier` (`none|basic|verified|premium`, public/canonical) + `companies.status` (`pending|verified|rejected`, legacy workflow).
- **Column-level `REVOKE UPDATE`** on `companies(status, verification_tier, verified_at, verification_summary)` from `authenticated`/`anon`/`PUBLIC`. Consequences:
  - **Owner** company-edit updates MUST omit those 4 columns (else "permission denied for column").
  - **Admin** verification writes MUST use the **service-role admin client** (`src/lib/supabase/admin.ts`) — PostgREST as `authenticated` is denied at grant level even for admins.
- Canonical KYB doc column is **`company_documents.type`** (NOT `doc_type`). Allowed values: `business_license | tax_registration | proof_of_address | logo | photo`. Code's `EXPECTED_DOC_TYPES` must mirror these.
- Storage path contract (private `company-documents` bucket): first folder segment = a `companies.id` the uploader owns → `<companyId>/<filename>`. Registration must create the company row BEFORE uploading; store the storage PATH (not a public URL).

## Messaging / PII (00012)
- `companies` is **single-language** (one `name`, one `description`) — do NOT expect `name_en/name_fr` on companies.
- View **`companies_public`** (security_invoker) = `status='verified'`, excludes `contact_email`/`contact_phone`. Public pages read from it.
- `companies.contact_visibility` ∈ `direct|obfuscated|login_required`.
- `messages.content` CHECK ≤ 5000 chars.
- `conversations(company_id, initiator_id)`; `conversation_participants(conversation_id, user_id)`; tightened insert RLS (self / owned company / admin only).

## Products / marketplace (00018)
- **Products ARE bilingual**: `name_en/name_fr/description_en/description_fr` added (keep legacy `name/description`); plus `video_embed`.
- Company rich profile cols: `production_capacity, moq, lead_time, markets[], spoken_languages[], certifications[]`.

## RBAC (00013–00015)
- `profiles.account_type` (`congolese_company|international_business`) + `profiles.staff_role` (`moderator|super_admin`); legacy `profiles.role` kept. `is_admin()` hardened with `SET search_path`; `is_moderator()`/`is_super_admin()` added. Owner update has WITH CHECK forbidding trust-column changes.
- `audit_log`, `hs_codes`, `tags`, `company_hs_codes`, `company_tags`.

## Analytics (00021)
- `analytics_events` event_type CHECK widened to also allow: `rfq_board, contact_request, profile_view, search_appearance, search_query`.
