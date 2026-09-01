# TradeInDRC — Consolidated Spec Digest (audit reference)

Merged from `docs/DASHBOARD.pdf` (14 components), `docs/superpowers/specs/2026-05-17-master-roadmap-design.md` (S1–S9), and `docs/about/tradeindrc requirementsc.v.1.0.md` (15 MVP modules). This is the **target state**. Auditors compare it against the actual code.

## What the platform IS
Official bilingual (EN/FR; later TR/ZH/ES) government-backed B2B trade portal for the DRC. Verified Congolese & international companies meet, browse a directory, list products/services, post & answer trade opportunities, read market intelligence, and message securely. Government admins moderate & verify.

## DASHBOARD.pdf — 14 components (stakeholder mental model)
1. **LOGO** — ancient/original logo (replace placeholder).
2. **Home** — short intro of the platform.
3. **About us** — short description ("Brandsbridge"/TradeInDRC).
4. **Directory** — company profiles, contact persons, sectors. Register & browse. (Visibility)
5. **Market/Marketplace** — Products, Services, Manufacturers, Importers, Exporters, Finance, Government, Public Corporations, logistics chains, facilitation. (Transactions)
6. **Opportunities Board** — Tenders, PPP projects, investment calls, offers, demands, quotations, Requests, Partner searches, project launches. (Growth)
7. **Data Hub / Data Intelligence** — Market reports, price trends, legal guides, Regulations. (Decision)
8. **Trust Center** — Verification badges, audit reports, KYB, KYP, KYC, Assistances, Inspections, market research. (Security)
9. **News & Events** — economic & commercial international & national news and events.
10. **Blog** — business articles, publications, texts, resources.
11. **Research** — browse all platform content & beyond (global search).
12. **Languages** — EN, FR, TR, ZH, ES (5).
13. **Registration** — registration & verification.
14. **Login** — users login to their dashboard.

## Requirements v1.0 — 15 MVP modules (detailed acceptance)
1. **Registration & Verification** — email + OTP registration, optional SMS OTP, password reset, session mgmt, **one user can manage multiple companies**, verification via uploaded legal docs (tax ID, registration number, certificates), admin approval workflow, **"Verified by Ministry" badge**.
2. **User Roles & Permissions** — Visitor, Congolese Company, International Business, Admin/Moderator, Super-Admin with RBAC.
3. **Company Profiles** — rich editable pages (capacity, lead time, MOQ, categories/HS codes, certifications, markets, languages, locations, media, tags).
4. **Media Management** — logo upload, gallery, video embed, brochures (PDF) with validation & quotas.
5. **Search & Filters** — full-text search across names/tags/descriptions; faceted filters (sector, location, certifications, readiness); sorting (relevance, A–Z, newest); shareable search links; profile cards.
6. **Contact & Anti-Spam** — configurable contact reveal (direct, obfuscated, login-required); anti-scraping (rate-limit, click-to-reveal, CAPTCHA); **spam reporting queue**.
7. **Internationalization & Branding** — complete FR/EN UI & content; SEO sitemaps; gov colors/logo/accessibility; **CMS for About, How It Works, Sectors, News, Events, FAQ, Contact, Terms, Privacy, Cookies**.
8. **Admin Console & Dashboard** — moderation queues with **timestamps & audit trails**; KPI dashboards (verification status, sector distribution, search queries, top profiles); taxonomy mgmt (sectors, HS codes, tags); **homepage carousels & featured profiles**.
9. **Integrations** — email provider for transactional + OTP; optional SMS provider w/ logs; search; CAPTCHA.
10. **Training & Documentation** — admin manual + runbook PDF (out of code scope).
11. **Analytics Dashboard for Businesses** — each company sees: profile views, search-result appearances, **top search terms that led to their profile**, plus commerce news/events/success stories.
12. **Secure Messaging** — no raw email shown; **"Contact Supplier/Buyer" button** → secure contact form → private in-platform **inbox**.
13. **Mini RFQ** — public page where verified buyers/sellers post products/services or an "Opportunity"; verified companies respond via secure messaging.
14. **Help Center** — Help Center section inside the CMS (module 7).
15. **Verified References** — a verified company adds "Partnership References"; if the referenced company is also verified, a link renders → **visible network of trust**.

## Master roadmap data model deltas (S1–S9) — already migrated (00001–00010)
- S1 auth polish + admin guard; S2 trust center + verification tiers (`companies.verification_tier`); S3 `content_items` (news/event/blog, TipTap JSON, EN/FR); S4 marketplace segments + `services` + `company_segments`; S5 `opportunities` (categories: tender/ppp/investment_call/offer/demand/quotation/partner_search/project_launch); S6 data hub (`reports`, `price_series`, `price_points`); S7 global search (FTS); S8 logo/brand; S9 TR/ZH/ES.

## Guiding principles
Open-source/self-hostable only (gov). Bilingual-first EN/FR. RLS is source of truth for authz; frontend guards are UX. Dense/compact UI, brand-color CTAs, info-dense cards. Zustand (client) + React Query (server). Every new table: uuid pk, created_at, updated_at, RLS, (name_en, name_fr). Motion per `docs/MOTION.md` (Emil Kowalski restraint: hover ≤200ms, mount ≤300ms, marketing ≤500ms; respect prefers-reduced-motion).

## "DONE" means
A flow is complete only if a real user can complete it end-to-end through the UI with data persisting via Supabase, RLS enforced, both EN/FR strings present, loading/empty/error states handled, and the admin counterpart (where applicable) can moderate it. "UI shell exists" or "page renders mock data" is NOT done.
