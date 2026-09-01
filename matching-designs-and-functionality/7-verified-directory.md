# Verified Companies Directory — design 7 vs current app

## Sources

- Design PDF: `/private/tmp/claude-501/-Users-mehmetsemihbabacan-dev-work-lumio-studio-web-apps-tradeindrc/b6d766d1-9bf6-4b52-91a1-35a1a9770c78/scratchpad/designs/7.pdf`
- Design analysis: `/Users/mehmetsemihbabacan/dev/work/lumio-studio/web-apps/tradeindrc/latest-designs/7-verified-companies-directory.md`
- App routes (split match):
  - `/companies` → `/Users/mehmetsemihbabacan/dev/work/lumio-studio/web-apps/tradeindrc/src/app/[locale]/companies/page.tsx`
  - `/trust` → `/Users/mehmetsemihbabacan/dev/work/lumio-studio/web-apps/tradeindrc/src/app/[locale]/trust/page.tsx`
- Key components:
  - `/Users/mehmetsemihbabacan/dev/work/lumio-studio/web-apps/tradeindrc/src/components/design/company-row.tsx`
  - `/Users/mehmetsemihbabacan/dev/work/lumio-studio/web-apps/tradeindrc/src/components/trust/verification-badge.tsx`
  - `/Users/mehmetsemihbabacan/dev/work/lumio-studio/web-apps/tradeindrc/src/components/list-pages/verification-filter.tsx`
  - `/Users/mehmetsemihbabacan/dev/work/lumio-studio/web-apps/tradeindrc/src/components/list-pages/location-filter.tsx`
  - `/Users/mehmetsemihbabacan/dev/work/lumio-studio/web-apps/tradeindrc/src/components/design/list-page-shell.tsx`, `page-header.tsx`

## THE DESIGN SPEC

A trust-first company directory, breadcrumbed **"Home > Local Contacts Directory > verified companies directory"**. English only in the mockup. Blue-led corporate palette: deep navy `#0B2A4A`/`#0D3057`, brand blue `#1B75BB`, with yellow `#F5B21A` (register CTA / premium), red `#D62E2E` (the single search CTA), green `#2E9E4F` (verified checks), page gray `#F0F3F7`, white cards with soft `0 2px 8px rgba(13,48,87,.08)` shadows and 1px `#E3E8EF` borders.

```
[logo "Trade in DRC · Connect–Invest–Grow"]     [Powered by BrandsBridge Group]
[Home Companies Opportunities Marketplace Local Contacts Market intelligence
 Promote Your Business Contact]        [Register Your Company][Request a Partner]
[breadcrumb: Home > Local Contacts Directory > verified companies directory]
+---------------------------------------------------------+
| HERO navy→Kinshasa photo   Verified Companies Directory |
|                            2-line trust subcopy         |
|   +--[ Understanding Our Verification Badges ]-------+  |
|   | [🛡 Registered] | [✔ Verified] | [🏅 Premium ]    |  |
+---+--------------------------------------------------+--+
| [🔍|Sector v|Province v|Type v| Premium ◯ | Intl ◯ |[Search Companies →(red)]]
| Showing 1-12 of 284 verified companies   Sort by: Recently Added |
| [card][card][card][card]                                |
| [card][card][card][card]        (4-col white cards)     |
| +--------- Our Verification Approach ----------------+  |
| | ①→②→③→④→⑤  dashed-arrow stepper                    |  |
| +----------------------------------------------------+  |
| FOOTER navy: brand + 4 link cols + BrandsBridge + social|
+---------------------------------------------------------+
```

Section-by-section inventory:

1. **White utility bar** — "Trade in DRC" blue-gradient logo + orange tagline "Connect – invest – Grow" left; "Power by BrandsBridge Group" lockup right. Purpose: co-brand credibility.
2. **Navy primary nav** — 8 links (Home, Companies, Opportunities, Marketplace, Local Contacts, Market intelligence, Promote Your Business, Contact) + two full-pill CTAs: solid yellow "Register Your Company" (navy text) and blue "Request a Partner" (white text).
3. **Breadcrumb strip** — darker navy, small white crumbs with arrow separators; yellow active-tab underline detail at right.
4. **Hero band (~260px)** — navy gradient blending into a Kinshasa/Congo-river skyline photo (cool blue tint, fades right). Left-aligned white H1 "Verified Companies Directory" (~40–44px bold), subcopy: "Connect with reviewed and verified business profiles in the DRC." + "Every company listed here has been reviewed for legitimacy, credibility and business activity to help you build trusted partnerships with confidence." — "with confidence." carries a yellow underline accent. No hero CTA; the filter bar is the action.
5. **Verification badges explainer card** — white, radius ~14px, soft shadow, overlapping the hero's bottom edge. Centered notched-tab title "Understanding Our Verification Badges" breaking the top border. Three hairline-divided columns, each: outlined-circle icon (blue shield / green shield-check / gold medal-crown), bold title, 2-line gray description, tinted pill: gray "Basic Profile", green "Verified", gold "Premium Partner". Tiers verbatim: **Registered Company** ("registered on the platform and provided basic business information"), **Verified Company** ("reviewed and verified for legitimacy and business activity"), **Premium Verified Local Partner** ("High-trust local partner with deeper verification and proven track record").
6. **Horizontal filter bar** — one white rounded strip (radius ~12px, shadow): magnifier icon; three icon+label dropdowns ("Select a sector / All Sectors", "Select a province / All Provinces", "Type of partnership / All Types") separated by hairlines; two toggle switches (star "Premium Only", globe "International Business Ready"); far-right solid **red** "Search Companies →" button (radius ~8px) — the only red on the page.
7. **Results meta row** — "Showing 1–12 of 284 verified companies" left; bordered "Sort by: Recently Added" select right.
8. **Company card grid** — 4 columns × 2 rows, equal-height white cards (radius ~12px, 1px border, soft shadow). Each card: 56px circular logo/monogram with thin gray ring; company name (semibold navy, green check or gold crown inline); blue category line ("Mining & Minerals", "Agriculture & Agro-Industry"…); pin + location line ("Lubumbashi, Haut-Katanga"); 2–3 line gray description; divider; footer row = tier pill left (green "✔ Verified" / gold "Premium Partner") + small navy "View Profile →" button right. Companies drawn: Katanga Industrial Supply SARL (premium), Agro Futur SARL, Congo Energy Solutions SA, Digital Telecom DRC SARL (premium), Vert Congo SARL, BuildTech DRC SA, Congo Logistics Group SARL, MedCare DRC SARL.
9. **"Our Verification Approach" stepper card** — white card, 5 steps joined by dashed arrows; each step = ~56px blue-outlined circle line icon (document, phone, checklist, map pin, shield-check) + bold numbered title + 2-line caption: "1. Documents Submitted", "2. Official Contact Confirmed", "3. Documentation Reviewed", "4. Sector & Location Classified", "5. Profile Published".
10. **Navy footer** — brand block + mission line left; "Quick Links" (with **Verified Companies** highlighted yellow as current page), "Resources", "Company" columns; BrandsBridge lockup + 4 circular social icons right; sub-bar: "© 2024 Trade in DRC. All rights reserved." / tagline / "www.tradeindrc.com".

## Element-by-element scorecard

| Design element | Visual spec (short) | In app? | Where in app | How the app version differs |
|---|---|---|---|---|
| Hero band with photo + navy gradient | ~260px, Kinshasa skyline, white H1 40px+, yellow underline accent | ❌ | — | App uses a plain `PageHeader` (2xl dark text on white card), no photo, no navy band |
| H1 + trust subcopy | "Verified Companies Directory" + 2-line reassurance copy | 🟡 | `companies/page.tsx` via `PageHeader` (`Companies.title/subtitle`) | Generic "Companies" title/subtitle; not the verified-trust framing, no emphasis underline |
| Breadcrumb "Home > Local Contacts Directory > …" | dark strip, white crumbs | ❌ | — | No breadcrumb on either route; no "Local Contacts" IA exists |
| Badges explainer 3-column card | notched-tab title, 3 hairline columns, icon circles, tinted pills | 🟡 | `trust/page.tsx` (tiers section) + `verification-badge.tsx` | Lives on a **separate** `/trust` page, not on the directory; renders 4 plain badges in a row (none/basic/verified/premium), no icon circles, no per-tier descriptions in that section, no notched-tab card |
| Tier pill colors gray/green/gold | "Basic Profile" gray, "Verified" green, "Premium Partner" gold | 🟡 | `src/components/trust/verification-badge.tsx` | Verified = emerald (close), but **premium = indigo + Sparkles icon**, not gold crown; extra "none" tier the design doesn't show |
| Horizontal filter bar (1 strip) | search + 3 dropdowns + 2 toggles + red "Search Companies →" | 🟡 | `FilterSidebar` + `SearchBox` in `companies/page.tsx` | Filters exist but as a **left sidebar of link lists** (sector, segment, tier, province, certification), not a horizontal dropdown strip; no toggles; no red submit CTA (filtering is instant via URL params) |
| Sector filter | dropdown "All Sectors" | ✅ fn / 🟡 look | `list-pages/sectors-filter.tsx` | Sidebar link list, not an icon dropdown |
| Province filter | dropdown "All Provinces" | ✅ fn / 🟡 look | `list-pages/location-filter.tsx` (from `companies_public`) | Sidebar list; data-driven, matches intent |
| "Type of partnership" filter | dropdown "All Types" | ❌ | — | No partnership-type facet anywhere (closest is `SegmentsFilter`, a different concept) |
| "Premium Only" toggle | star icon + switch | 🟡 | `verification-filter.tsx` (`tier=premium`) | Achievable via tier filter link, but no switch UI |
| "International Business Ready" toggle | globe icon + switch | ❌ | — | No such attribute or filter in schema/UI |
| Results count "Showing 1–12 of 284 verified companies" | plain meta text | ❌ | — | No count row; query has no `count: 'exact'` |
| Sort by: Recently Added | bordered select | ✅ | `list-pages/sort-control.tsx` (az / newest / relevance) | Present; wording differs, look close enough |
| 4-column company card grid | white cards, logo circle, category, location, blurb, tier pill, "View Profile →" | 🟡 | `design/company-row.tsx` | App renders **full-width horizontal rows**, not a 4-col card grid; row has logo (rounded-square, not ringed circle), name, badge, description, cert tag chips — but **no sector/category line, no province/pin line, no "View Profile" button** (whole row is the link) |
| Green check / gold crown on card name | inline verification mark | 🟡 | `verification-badge.tsx` inline in row | Rendered as a labeled pill next to the name; premium is indigo, not gold |
| Pagination (implied by 284 results) | page control | ❌ | — | Query fetches all matching rows, no limit/pagination |
| "Our Verification Approach" 5-step dashed stepper | 5 icon circles + dashed arrows | ❌ | `/trust` has 3 KYB/KYP/KYC pillar cards instead | No stepper anywhere; the trust pillars are a different, text-only construct |
| Verified-only listing guarantee | every listed company is verified | ✅ | `companies/page.tsx` `.eq("status","verified")` | Matches the design's core promise |
| Nav: Marketplace / Local Contacts / Market intelligence / Promote Your Business + yellow Register + blue Request pills | navy bar, pill CTAs | ❌ (this IA) | `src/config/navigation.ts` (different IA) | Current nav/mega-menu differs; no yellow/blue pill CTA pair, no BrandsBridge co-brand |
| "Powered by BrandsBridge Group" co-brand (header + footer) | logo lockup | ❌ | — | Absent site-wide |
| Navy footer w/ "Verified Companies" highlighted link, socials, www.tradeindrc.com | 4-col navy footer | 🟡 | global footer component | A footer exists site-wide but not this navy/BrandsBridge/current-page-highlight treatment |

## ❌ Design elements the app lacks entirely

**Directory page surface**
- Hero band (photo + navy gradient + trust copy) — pure UI, no backend.
- Breadcrumb / "Local Contacts Directory" IA — needs a route/nav concept for "Local Contacts".
- On-page badge-tier explainer card (3 columns, notched tab) — content exists conceptually in `/trust`; needs merging onto the directory.
- Results count + pagination — needs `count: 'exact'` + `range()` in the Supabase query.

**Filters**
- Horizontal filter bar with dropdowns + explicit red "Search Companies" submit — UI restructure of existing facets.
- "Type of partnership" facet — implies a new `companies` column or relation (partnership type).
- "International Business Ready" toggle — implies a new boolean flag on `companies`.

**Trust storytelling**
- "Our Verification Approach" 5-step dashed stepper — static content, no backend.
- Gold "Premium Partner" visual identity (crown/medal, amber pills) — token/asset change; tier data already exists (`verification_tier`).

**Chrome**
- BrandsBridge co-branding (utility bar + footer), yellow/blue nav pill CTAs, navy footer with current-page highlight — global layout work.

## 🎨 Visual-language delta

The design is a **navy/blue institutional page with a photographic hero, saturated accent CTAs (yellow, red) and a gold premium tier**; the app's directory is a **flat, light, slate-toned utility list** — white/gray content inside gray-bordered `rounded-2xl` panels, no navy anywhere on the page, no photography, no red or yellow accents. Card language differs structurally (design: compact vertical cards in a 4-col grid with explicit navy "View Profile →" buttons; app: full-width clickable rows with tag chips). The badge palette diverges most visibly: design premium = gold crown, app premium = indigo Sparkles. Typography is flatter in the app (24px page title vs ~40px hero H1; no section-title underline accents). Density model differs too: the design floats separate white cards on a gray page; the app nests everything inside two big bordered panels (sidebar + main).

## 🔷 App features the design omits (regression watch-list)

- Full-text search with relevance ranking (`SearchBox`, `ftsEntityIds`, relevance sort).
- Segment facet (`SegmentsFilter` / `company_segments`) and Certification facet with cert tag chips on rows.
- Active-filters chip bar (`ActiveFiltersBar`) and "any/none/basic" tier options.
- RFQ CTA banner linking to `/dashboard/opportunities/new`.
- `/trust` page's KYB/KYP/KYC pillars and per-company trust route (`/trust/[companySlug]`, `trust-summary-card.tsx`).
- Bilingual EN/FR (mockup is EN-only).

## Verdict

**matchScore: 38**

The functional skeleton is genuinely there — verified-only listing, sector/province/tier filtering, sorting, and a tier badge system backed by `verification_tier` — but almost none of it looks like the design, and the design's signature trust-narrative elements are missing. The hero, the on-page badge explainer with notched tab, the horizontal filter strip with red search CTA, the 4-column card grid with category/location lines and "View Profile" buttons, the results count/pagination, and the 5-step verification stepper are all absent. The tier explainer exists but on a separate `/trust` page with a 4-tier model and indigo (not gold) premium styling. Two implied data attributes are unmodeled: partnership type and "International Business Ready". Treating the design as spec, this reads as roughly one-third delivered: right data plumbing, wrong page.
