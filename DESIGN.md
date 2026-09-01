# TradeInDRC — Design Overhaul Spec

**Status:** Approved direction. Implementation plan generated separately by `superpowers:writing-plans`.
**Date:** 2026-05-17
**Source inspiration:** `inspiration-images/` — TurkishExporter.com.tr (12+ screenshots).
**Source product spec:** `docs/DASHBOARD.pdf`, `docs/superpowers/specs/2026-05-17-master-roadmap-design.md`.

> This is a **visual overhaul**, not a product pivot. The 14-module IA from `DASHBOARD.pdf` does not change. Navbar items do not change. RLS/security/i18n contracts do not change.

---

## 1. North star

TradeInDRC must read like a serious, dense, government-grade B2B trade portal — modeled on the visual grammar of TurkishExporter but in DRC's color palette and tone. Information-first, white-background, brand-blue accents, tight rows, minimal padding. No marketing fluff, no AI-template gradient blobs.

**Three rules every component obeys:**

1. **White background.** Brand color (`--primary`, DRC blue `#0047AB`) only on CTAs, links, key tags, and section banners.
2. **Compact density.** 12–14 px body. 32–36 px row height in dense lists. Padding scale: `2/3/4` (≈8/12/16 px) is default. `6/8` (24/32 px) reserved for top-level page headers and hero only.
3. **One screen, one purpose.** Each page leads with the user's job. List pages = filter sidebar + cards. Detail pages = headline + meta + body. No carousel-of-features bloat.

---

## 2. Design system — primitives we'll build (ship before pages)

Lives under `src/components/design/` (so we never confuse them with shadcn `ui/` primitives).

| Primitive | What it does | Used by |
|---|---|---|
| `<PageHeader title subtitle action>` | Page title (text-2xl) + subtitle (text-sm muted) + optional right-side action button. | Every list and content page |
| `<ListPageShell sidebar>` | Two-column grid: narrow sidebar (~260 px) + main column, both scroll independently. | Companies, Products, Opportunities, Market, Data Hub lists |
| `<FilterSidebar>` + `<FilterGroup label>` | Compact sidebar with collapsible groups; renders categories/sectors/countries/segments as a tight bulleted list with optional counts. | All list pages |
| `<FilterChip onRemove>` | Active-filter pill above results (e.g. `Country: Türkiye ×`). | All list pages |
| `<CompanyRow company actions>` | Logo (left, 56 px square) + name + verification badge + years pill + 2-line description + tag chips + 5-thumb strip on the right. Total height ~120 px. | Companies list, segment lists |
| `<OpportunityCard opportunity>` | Country flag + category pill + view-count + age + bold title + 1-line summary + tag chips. Compact card; ~140 px tall. | Opportunities, Data Hub featured strip |
| `<ProductCard product>` | Square image + name (sm bold, two lines max) + company name (xs in `--primary`). Used in 5-col grids. | Products list, market shelves |
| `<FeaturedOpportunityStrip items>` | Top-of-page row of 5 cards + "Add Free RFQ" tile at the end. Brand-blue tile for the CTA at the right. | `/opportunities`, `/data-hub` |
| `<RfqCtaBanner>` | Full-width brand-color banner with white headline + right-aligned button (e.g. "Contact every verified company on this page → Send RFQ"). | Between sections on list pages |
| `<TagChip>` | Pill, `bg-slate-100 text-slate-700 text-xs`. Multi-line wrap-friendly. | Cards everywhere |
| `<Stat label value icon>` | Tight inline metric (e.g. `2 days ago · 65 views`). | Cards |
| `<BrandLogoCarousel logos>` | Horizontal scrollable rail of verified-company logos with prev/next arrows + dot indicator. | Home, Trust Center |
| `<NewsletterSignup>` | Email field + Subscribe button + KVKK-style consent checkbox + small "Privacy Policy" link. Right-aligned in footer. | Footer |
| `<HeroSearch tabs activeTab onTabChange placeholder onSubmit>` | Hero card: 4-tab switcher (Importers / Exporters / Opportunities / Products) over a single search field with a black-filled "Search" button. | Home only |
| `<HeroMockupCard>` | Right-side companion card in hero — illustrated trade-flow / DRC map graphic (replaces TurkishExporter's iOS app card; we have no mobile app). | Home only |
| `<EmptyState icon title body action>` | Compact empty / no-results state. | Every list page |

All primitives:
- Are **server components** by default (`<HeroSearch>`, `<NewsletterSignup>` need `"use client"`).
- Read i18n via `useTranslations` / `getTranslations`.
- Have a **single** density variant — no `<Card size="lg|md|sm">` overload.

---

## 3. Page-by-page overhaul

### 3.1 Home (`src/app/[locale]/page.tsx`) — full rewrite, current is "shit"

Sections, top to bottom (each ~one screen on desktop):

1. **Slim alert ribbon** (3 px tall, brand-blue): "Verified Congolese exporters · Send RFQs free" in white, dismissible. (Mirrors TurkishExporter's e-gazete top strip but informational, not advertorial.)
2. **Hero (~360 px)**: brand-blue background + DRC trade map illustration faded behind. Left: `<HeroSearch>`. Right: `<HeroMockupCard>` showing a stylized "Opportunity feed" preview.
3. **`<FeaturedOpportunityStrip>` of 5 published opportunities** + Add RFQ tile.
4. **Tabbed product/company explorer** — left rail = top 8 sectors; right = 5×2 grid of latest products. Tabs above: Products / Importers / Exporters / Opportunities. (Each tab swaps the right grid in place — no full route change.)
5. **Two-column block**: "Latest products" carousel (1 hero product image w/ dots) + "Latest databank" (RFQ-style feed of 3 items with country flags).
6. **`<RfqCtaBanner>`**: "Submit your RFQ — receive offers from verified DRC companies → Send Request".
7. **`<BrandLogoCarousel>`** of verified exporters (S2 verification_tier ≥ verified).
8. **FAQ block** — small "FAQ" tag + bold "Some things you might want to know" + 2-col accordion of 5 questions.
9. **Footer** (see §3.10).

Kill: every existing landing component (`Hero`, `Stats`, `Features`, `RisingPotential`, `RfqFeed`, `SupplierSpotlight`, etc.) that doesn't fit this layout. Salvage their copy/data into the new sections.

### 3.2 Companies list (`/companies`)

`<ListPageShell>` layout:
- **Sidebar:** Categories search input → list of sectors with counts; Segments group (S4); Verification group; Countries (DRC-only for now). All collapsible.
- **Main:** `<PageHeader>` ("Companies — Verified Congolese exporters"). Active `<FilterChip>` row. `<RfqCtaBanner>` — "Send RFQ to all companies on this page". List of `<CompanyRow>` (10–20 per page) with pagination.
- Selection checkboxes per row → "Selected N · Send RFQ" sticky bottom action bar.

Drop the current hero on `/companies` if any. Pure utility.

### 3.3 Company detail (`/companies/[id]`)

- `<PageHeader>` with company name + `<VerificationBadge>` (S2) + segments (S4) as chips on a single line.
- Three-row meta strip: country/city · founded · website link.
- Tabs (kept from S4): Overview / Products / Services / Segments.
- Right side: contact-card with "Send RFQ", "Message company", "View trust report".
- Below: `<BrandLogoCarousel>` of "Similar verified exporters" (optional, if results > 4).

### 3.4 Products list (`/products`)

`<ListPageShell>`:
- Sidebar: Categories (counts), Sectors, Country (DRC), Sort (newest/popular).
- Main: 5-col `<ProductCard>` grid (responsive: 2/3/4/5 cols at sm/md/lg/xl).

### 3.5 Product detail (`/products/[id]`)

Two-column: left = large image gallery; right = product name + company link + specs table + RFQ button + "Add to inquiry list" toggle.

### 3.6 Opportunities list (`/opportunities`)

- `<FeaturedOpportunityStrip>` of 5 highest-priority opportunities + Add Free RFQ tile.
- `<ListPageShell>` with sidebar: Category radios (S5), Country, Sector, Deadline window.
- Cards via `<OpportunityCard>`. Active filter chips above. Pagination at bottom.

### 3.7 Opportunity detail (`/opportunities/[category]/[slug]`)

Already structured well (S5). Apply the new typography + tag-chip styles. Replace existing buttons with the design-system primitives.

### 3.8 Marketplace (`/market`) and `/market/[segment]`

Skinned per `<ListPageShell>` for the segment page; the `/market` landing keeps its 8-tile shelf grid but tiles get tighter padding + flat brand-blue title bars.

### 3.9 Trust Center (`/trust`)

- Three-pillar grid (existing). Apply new typography.
- ADD: `<BrandLogoCarousel>` of currently-verified companies under the pillars.
- ADD: `<RfqCtaBanner>` at bottom: "Want your company verified? → Apply".

### 3.10 News / Events / Blog (S3)

- List pages: `<ListPageShell>` with sidebar = Tags + Sectors.
- Card style: small thumbnail (left, 80×80) + title + 1-line excerpt + date + tag chips. Compact rows, not big magazine cards.

### 3.11 Data Hub (`/data-hub`)

- Landing: 4-pillar grid stays. Apply new typography + flat tiles + chip-style "View →" links.
- `/data-hub/reports/[kind]`: `<ListPageShell>` (sidebar = sectors, sort).
- `/data-hub/prices`: List of series → detail uses our existing `<PriceChart>` (S6), now with a `<PageHeader>` + meta row.

### 3.12 Search (`/search`)

Keep S7 structure. Apply new chip styles, denser facet bar at top.

### 3.13 Dashboard (`/dashboard`)

- Layout shell: narrow left sidebar (kept) + main scrollable column.
- Pages: every list (Products, RFQ, Opportunities, Companies, Inbox) uses the same dense card style as public list pages. No "card with shadow + 64 px padding" — `bg-card border rounded-md p-4`.

### 3.14 Admin (`/admin`)

Reuse dashboard layout grammar. Tables already lean. Tighten paddings + adopt `<PageHeader>` everywhere.

### 3.15 Auth pages (`/login`, `/register`, `/verify-email`, `/forgot-password`, `/reset-password`, `/dashboard/settings/account`)

Adopt the TurkishExporter sign-up layout:
- Centered single column (max-w-md).
- Brand-blue side mockup on desktop (left) — illustrated DRC outline + small "Verified · Bilingual · Secure" check-row.
- Form card on the right.
- Inline-icon inputs (`h-10`).
- KVKK-style consent block below the form with linked text.
- Below CTA: "If you have an account → Sign in" (links in `--primary`).

### 3.16 About / FAQ / legal pages

- About: TurkishExporter has a clean "FAQ-block + footer" pattern. Adopt for our About + Contact pages. Tag-and-title prelude before each h2.
- Legal (Privacy, Terms, Cookies): single-column long-form with our `<MarkdownView>`. Keep narrow `max-w-2xl`.

### 3.17 Footer (every page)

Two rows:
- **Row 1**: brand logo + 4 social icons (left), 4-column link grid (center), `<NewsletterSignup>` (right).
- **Row 2**: copyright + "DRC bilingual portal" tagline + link to Privacy / Terms / Cookies. Tiny gray text.

Remove every existing footer block that doesn't match.

---

## 4. Tokens (no new colors — reuse from `docs/branding/branding.md`)

| Token | Use |
|---|---|
| `--primary` `#0047AB` | CTAs, links, active tab background, section banner background, focus ring |
| `--primary-foreground` `#FFFFFF` | Text on `--primary` surfaces |
| `--background` `#FFFFFF` | Default page background |
| `--card` `#FFFFFF` | Card background |
| `--foreground` `#0F172A` | Default body text |
| `--muted` `#F8FAFC` | Sidebar surface, hover row |
| `--muted-foreground` `#64748B` | Captions, meta, descriptions |
| `--accent` `#F7D618` | Reserved for promotional accents (e.g. "Premium" badges in pricing) — sparingly |
| `--destructive` `#CE1021` | Errors, "Reject" button — sparingly |
| `--border` (existing) | All thin lines + card borders |

**Type scale** (Tailwind aliases):
- `text-xs` 12 px — meta, chips, captions
- `text-sm` 14 px — body, table rows, sidebar items
- `text-base` 16 px — card titles, link labels
- `text-lg` 18 px — section sub-headers
- `text-xl` 20 px — section headers
- `text-2xl` 24 px — page headers
- `text-3xl` 30 px — hero title only
- `text-4xl` / `text-5xl` — hero very-large heading (FAQ-style "Some things you might want to know" pattern). Used 0–1 times per page.

**Spacing scale (paddings/margins):** prefer `2/3/4` (8/12/16 px). Step to `6/8` (24/32 px) only at page-level container y-padding and hero. Anything larger triggers a self-review.

**Radius:**
- `rounded-2xl` (16 px) on **big content containers** that group sidebar + grid (the home explorer, news/databank pair, market shelf wrappers, list-page main panels).
- `rounded-xl` (12 px) on **standard cards** (CompanyRow, ProductCardDesign, OpportunityCardDesign, ReportCard, ContentCard, news/event rows).
- `rounded-md` (6 px) on **inputs**, **tab buttons**, **small admin tables**.
- `rounded-full` on **chips, pills, CTAs ("More products →" style buttons), tag chips**.
- No `rounded-3xl` or higher.

**Borders:**
- `border border-slate-200` (light grey) is the default visual border for cards and containers.
- The shadcn `border` token stays for high-contrast surfaces (admin tables, dialogs).
- 1 px only. No `border-2`.

**Padding scale:**
- Card inner: `p-3` (12 px) for standard, `p-4` (16 px) for forms.
- Section vertical: `py-6` (24 px) default; `py-8` reserved for the home hero.
- Page top: `py-4` to `py-6`. No `py-10` or `py-12`.

**Density rule:**
- When two cards conceptually belong together (sidebar + grid, latest-products + latest-databank), wrap them in one `rounded-2xl border border-slate-200` outer container so they read as a single connected block. Cards inside the container use `border-b` separators or no border at all.

**Drop shadows:** none (we never use shadow-* in this redesign).

---

## 5. Layout grid

- Top-level container: `max-w-7xl mx-auto px-4` for most pages; `max-w-3xl` for legal/long-form; `max-w-md` for auth forms.
- `<ListPageShell>` grid: `grid-cols-[260px_1fr] gap-6` at md+, single column at sm.
- Card grids: `grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5` (products); `grid gap-3 sm:grid-cols-2 md:grid-cols-3` (opportunities); list-row layout (no grid) for companies.

---

## 6. Patterns we explicitly DROP from the current TradeInDRC

- Big multi-paragraph hero descriptions ("Welcome to TradeInDRC, the leading…") — replace with a single tagline + the search component.
- Gradient backgrounds / blurred blobs / decorative SVGs that don't carry information.
- Oversized stat cards on the homepage ("10K+ companies, 500+ products"). If we keep stats, they go in a tight 4-up strip below the hero, `text-2xl` numbers, no card backgrounds.
- Multi-column "Features" grid on the home page — TurkishExporter doesn't have one; we don't need one.
- `Cards with shadow + 32 px padding` — replaced everywhere by `border + 12 px padding`.

## 7. Patterns we explicitly DROP from TurkishExporter

- Gamified "1 Credit = 1$ — Login now" promo card. (Off-brand for a gov portal.)
- Multi-tier paid membership comparison table.
- Aggressive black `e-Gazete` advertorial ribbon at the very top.
- "Sponsored" post type radio in the databank sidebar.
- Bank account list with IBAN block (not relevant for our model).

## 8. Accessibility & i18n

- All new primitives accept `aria-label` props where the label is icon-only.
- Color contrast: any `text-muted-foreground` paired with `bg-white` or `bg-muted` must clear AA. (Our token #64748B on white = 5.07:1 ✓.)
- Tabs in the hero must be keyboard navigable (← / →).
- Every primitive's user-facing text comes from i18n keys. We add a new `Design.*` namespace in `src/config/messages/{en,fr}.json` for the strings the primitives themselves render (e.g. `Design.viewAll`, `Design.sendRfq`, `Design.subscribe`).
- Brand-blue + white-text contrast on `<RfqCtaBanner>`: #0047AB on #FFFFFF text → 8.59:1 ✓.

## 9. Performance constraints

- No new heavy dependency. Reuse `framer-motion`, `lucide-react`, `recharts`, `react-markdown` already installed.
- `<BrandLogoCarousel>` is a CSS scroll-snap rail; no Swiper/Embla unless we hit a limit.
- Hero illustration: inline SVG, no PNG.

## 10. What ships in what order

The implementation plan generated by `superpowers:writing-plans` will follow this order:

1. **Phase 1 — Design system primitives** (no page changes yet). Build every primitive listed in §2; export from `@/components/design`.
2. **Phase 2 — Home page full rewrite** (the explicit "shit page"). Compose new home from primitives only.
3. **Phase 3 — Public list pages** (Companies, Products, Opportunities, Market, News/Events/Blog, Data Hub).
4. **Phase 4 — Public detail pages** (Company, Product, Opportunity, Trust, Data Hub detail).
5. **Phase 5 — Auth pages** (Sign in, sign up, verify-email, forgot/reset, account settings).
6. **Phase 6 — Dashboard skin pass** (dense card style, `<PageHeader>` everywhere).
7. **Phase 7 — Admin skin pass.**
8. **Phase 8 — Footer + slim alert ribbon + final cleanups.** Ship the FAQ block, newsletter signup, BrandLogoCarousel data, page-level audit.

Each phase ends with the same gate: `vitest run && next build && eslint --quiet` on touched files, then ship-wreck-check, then a single commit on `main`.

---

## 11. Non-goals

- Mobile app screenshots in hero (we don't have one).
- Pricing/membership pages (no monetization in scope).
- Replacing the cookie consent (we already have one).
- Changing the navbar items (per user instruction).
- Re-translating existing content into TR/ZH/ES (deferred to S9).
- Replacing the verification logic or any DB tables.

---

## 12. Definition of done

The website "feels TurkishExporter-dense but DRC-blue-on-white" when:

- The home page loads, the only thing above the fold is a brand-blue hero with one search and a featured strip — no scroll-bait section.
- Every list page has the same shell: thin sidebar left, dense rows right, chips above, banner between sections, pagination bottom.
- A user can describe any page on the site in one sentence ("Companies list with sector + segment filters and verified badges per row").
- No page uses `shadow-` or `rounded-2xl`. No page uses padding larger than `py-8`.
- Lighthouse Performance ≥ 90 on the home page on production.
