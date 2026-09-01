# Local Contacts Landing — design 3 vs current app

## Sources

- Design PDF: `/private/tmp/claude-501/-Users-mehmetsemihbabacan-dev-work-lumio-studio-web-apps-tradeindrc/b6d766d1-9bf6-4b52-91a1-35a1a9770c78/scratchpad/designs/3.pdf`
- Design analysis: `/Users/mehmetsemihbabacan/dev/work/lumio-studio/web-apps/tradeindrc/latest-designs/3-local-contacts-landing.md`
- App route (closest match — no dedicated Local Contacts hub exists):
  - `/Users/mehmetsemihbabacan/dev/work/lumio-studio/web-apps/tradeindrc/src/app/[locale]/companies/page.tsx` (companies directory)
  - Related surfaces: `src/app/[locale]/contact-points/page.tsx` (mock institutional contact points), `src/app/[locale]/(public)/request/` (Request a Partner flow), `src/app/[locale]/page.tsx` (home with `HeroSearch`)
  - Key components: `src/components/design/list-page-shell.tsx`, `page-header.tsx`, `company-row.tsx`, `rfq-cta-banner.tsx`, `hero-search.tsx`; `src/components/list-pages/search-box.tsx`, `sectors-filter.tsx`, `location-filter.tsx`, `segments-filter.tsx`, `verification-filter.tsx`, `certification-filter.tsx`

## THE DESIGN SPEC

A marketing-led, search-forward landing page for the **Local Contacts** vertical — top of the matchmaking funnel. Dark-navy frame (header + footer + CTA band), white body, DRC-flag palette (navy `#0A2A5C`, yellow `#F5A800`, red `#D6232A`, royal blue `#1E63D0`).

```
┌──────────────────────────────────────────────────────────────┐
│ TOPBAR (navy): logo "Trade in DRC / Connect–invest–Grow"     │
│                                  Power by ◆ BrandsBridge Grp │
├──────────────────────────────────────────────────────────────┤
│ NAVBAR (navy): Home Companies Opportunities Marketplace      │
│ Local Contacts Market intelligence Promote… Contact          │
│                 [Register Your Company][Request a Partner]   │
├──────────────────────────────────────────────────────────────┤
│ HERO (photo: Kinshasa skyline + bridge, dark overlay left)   │
│  H1 "Find Trusted Local Business Contacts …"                 │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ 🔍 keywords | Select a sector ▾ | Select a province ▾  │  │
│  │  | Type of contact ▾ | [Search contacts →] (red)       │  │
│  └────────────────────────────────────────────────────────┘  │
│  [Request a Local Partner] [⎔ Register as a Local Contact]   │
├──────────────────────────────────────────────────────────────┤
│ "What Type of Local Contact Are You Looking For?"  (6 cards) │
├──────────────────────────────────────────────────────────────┤
│ "Explore Local Contacts by Strategic Sector"       (6 cards) │
├──────────────────────────────────────────────────────────────┤
│ VALUE STRIP (grey): ◎ Discover | 🛡 Verify | 👥 Connect      │
├──────────────────────────────────────────────────────────────┤
│ CTA BAND (navy, rounded): "Entering the DRC Market? …"       │
│           [🤝 Request a Local Partner →] + Africa-map motif  │
├──────────────────────────────────────────────────────────────┤
│ FOOTER (navy): brand | Quick Links | Resources | Company |   │
│ BrandsBridge + social · © bar with tagline + URL             │
└──────────────────────────────────────────────────────────────┘
```

Section-by-section inventory:

1. **Topbar** (navy, ~56px, flat): DRC-map logo mark (blue/red) + "Trade in DRC" + tagline "Connect – invest – Grow" (yellow/blue); right "Power by BrandsBridge Group" with diamond logo.
2. **Navbar** (navy, ~48px): 8 links — Home, Companies, Opportunities, Marketplace, **Local Contacts**, Market intelligence, Promote Your Business, Contact; right CTAs: yellow filled "Register Your Company" (navy text) + royal-blue "Request a Partner" (white text), radius ~6–8px.
3. **Hero** (~30% page height): full-bleed Kinshasa aerial photo (high-rise, river, bridge with traffic), left-anchored navy gradient overlay (~70%→0%). H1 ExtraBold white ~44–52px over 4 lines: "Find Trusted Local Business Contacts in the Democratic Republic of Congo". Sub: "Connect with verified suppliers, distributors, representatives, service providers and institutional contacts across the DRC."
4. **Faceted search bar** (signature element, floats over hero bottom edge): one white rounded bar (radius ~8px, only element with a soft drop shadow), 4 fields split by hairline dividers — magnifier + "Enter keywords, company name product or service", "Select a sector ▾", "Select a province ▾", "Type of contact ▾" — ending in a full-height **red** "Search contacts →" button.
5. **Hero secondary CTAs**: yellow filled "Request a Local Partner" + transparent ghost "Register as a Local Contact" with person icon and 2px white outline.
6. **Contact-type row** — heading "What Type of Local Contact Are You Looking For?" + 6 white cards (1px `#E2E6EC` border, radius ~8px, flat): Suppliers (stacked boxes), Distributors (truck), Local Representatives (headset person), Service Providers (gear/hand), Institutional Contacts (bank columns), Investment Partners (globe+handshake). Duotone line icons ~48px, navy stroke + one flat accent color. Whole card clickable, no CTA text.
7. **Sector row** — heading "Explore Local Contacts by Strategic Sector" + 6 cards, same shell plus live counts and a navy pill button "Explore Sector" (white text, full pill radius): Mining & Minerals **416 Companies**, Energy & Electricity **269**, Construction & Infrastructure **358**, Agriculture & Agro-Industry **276**, Logistics & Transport **198**, Digital & Telecom **142**.
8. **Value strip** (light-grey `#F4F6F9` full-width band, 3 columns, icon-beside-text): "Discover — Easily find local contacts across provinces and sectors with advanced search and smart filters." / "Verify — All contacts are verified for legitimacy, credibility and business activity." / "Connect — Connect directly and build trusted relationships that drive real business outcomes."
9. **CTA band**: inset navy rounded rectangle (radius ~12px): "Entering the DRC Market? Start with the Right Local Contact." + "Request a local partner to get market insights, introductions and on-the-ground support." Right: yellow "Request a Local Partner →" with handshake icon; faint yellow Africa-continent watermark far right.
10. **Footer** (navy, 5-zone): brand block + mission blurb; Quick Links (Companies, Opportunities, Products, Local Contacts); Resources (Market Intelligence, Promote Your Business, News & Insights, Help Center); Company (About Us, Terms of Use, Privacy Policy, Contact Us); BrandsBridge logo + 4 circular-outline social icons (LinkedIn, Twitter, YouTube, Email). Darker bottom bar: "© 2024 Trade in DRC. All rights reserved." · "Trade in DRC — Connecting international business with local opportunities." · "www.tradeindrc.com".

Typography: single geometric sans (Montserrat/Poppins-like); hierarchy carried by weight + size + color only. Radius system 8px (cards/inputs) / 12px (band) / full pill (mini-buttons). Cards flat; only the search bar has a shadow.

## Element-by-element scorecard

| Design element | Visual spec (short) | In app? | Where in app | How the app version differs |
|---|---|---|---|---|
| Local Contacts hub route | Dedicated landing at "Local Contacts" nav item | ❌ | — | No `/local-contacts` route; closest is `/companies` directory + `/contact-points` mock page |
| Navy topbar + "Power by BrandsBridge" | Flat navy strip, dual-logo lockup | ❌ | — | App navbar is light theme, no BrandsBridge attribution |
| Nav CTAs "Register Your Company" (yellow) / "Request a Partner" (blue) | Filled rounded-rects in DRC-flag colors | 🟡 | `src/config/navigation.ts`, navbar; `(public)/request` exists | Request flow exists as a page, but no paired yellow/blue CTA buttons in a navy navbar |
| Hero photo + gradient + H1 "Find Trusted Local Business Contacts…" | Kinshasa aerial, navy overlay, ExtraBold white H1 | ❌ | — | `/companies` opens with a plain `PageHeader` (2xl semibold on white, border-b) — no imagery, no marketing headline |
| 4-field faceted search bar (keyword + sector + province + contact type + red "Search contacts →") | Single white bar, hairline dividers, red submit | 🟡 | `list-pages/search-box.tsx` + `FilterSidebar` (sector/region filters); `design/hero-search.tsx` on home | Functionality split: keyword box on top, sector/province as left-sidebar facets. No unified bar, no "Type of contact" facet, no red submit button |
| Hero CTAs "Request a Local Partner" / "Register as a Local Contact" | Yellow filled + white ghost pair | 🟡 | `(public)/request` page; auth modal `components/auth/user-auth-modal.tsx` | Destinations exist; the paired hero CTA presentation does not |
| Contact-type cards ×6 (Suppliers…Investment Partners) | White bordered icon cards, duotone icons | ❌ | (`SegmentsFilter` is nearest concept) | No contact-type taxonomy or card grid anywhere; segments filter is a text-link sidebar facet, different taxonomy |
| Sector cards ×6 with live "N Companies" counts + "Explore Sector" pill | Icon + count + navy pill | 🟡 | `list-pages/sectors-filter.tsx`; `/sectors` route | Sectors are filter links / a separate page, not icon cards with company counts and pill CTAs on this surface |
| Value strip Discover / Verify / Connect | Grey band, 3 duotone-icon columns | ❌ | — | Absent; verification exists as `VerificationBadge` per row, not as a marketing trust strip |
| Navy CTA band "Entering the DRC Market?…" + Africa motif | Rounded navy band, yellow button | 🟡 | `design/rfq-cta-banner.tsx` on `/companies` | A CTA banner exists but it's the RFQ banner ("post an opportunity"), brand-primary styling, no navy/yellow treatment, no Africa watermark, different copy/intent |
| Footer (navy 5-zone + BrandsBridge + socials + © bar) | Navy, 3 link columns, circular social icons | 🟡 | `src/components/layout/` footer (global) | App footer exists but light-theme brand styling; no BrandsBridge block, link columns differ ("Local Contacts" absent) |
| Company results list | (implied by search submit) | ✅ | `design/company-row.tsx` via `/companies` | Exists and richer than design implies (verification badge, tags, logo) — but as list rows, not part of a landing funnel |
| Province filter | "Select a province" dropdown | ✅ | `list-pages/location-filter.tsx` (`region` param → `companies.province`) | Sidebar facet instead of hero dropdown |
| Type-of-contact filter | "Type of contact" dropdown | ❌ | — | No `contact_type` column/taxonomy in schema or UI |
| Institutional Contacts destination | One of the 6 type cards | 🟡 | `contact-points/page.tsx` | Exists but as a city-picker page over hardcoded mock data (FEC etc.), client-side only, not styled per design |

## ❌ Design elements the app lacks entirely

**Structure / route**
- Dedicated `/local-contacts` landing route → new page + nav entry (`NAVIGATION_CONFIG`).
- Marketing hero (Kinshasa photo, gradient overlay, H1) → static asset + copy in i18n `localContacts` namespace.

**Taxonomy / data**
- Contact-type taxonomy (supplier / distributor / local_representative / service_provider / institutional / investment_partner) → new column or table on `companies` + migration; nothing in `supabase/migrations` covers it.
- Contact-type card grid (6 cards) → depends on the taxonomy above.
- Live per-sector company counts on cards → aggregate query or cached count column on `sectors` (design shows 416/269/358/276/198/142).

**Marketing furniture**
- Discover / Verify / Connect value strip → pure static content.
- Navy CTA band with Africa-map watermark → static, links to existing `/request` page.
- Unified 4-field hero search bar with red "Search contacts →" submit → recompose existing `SearchBox` + `Select`s writing to the same URL params `/companies` already reads (`q`, `sector`, `region`, + new `type`).
- DRC-flag navy/yellow/red theming of topbar, navbar CTAs, footer, BrandsBridge attribution → theme tokens + layout changes (global impact, not just this page).

## 🎨 Visual-language delta

The design is a **dark-framed, flag-colored marketing page**; the app's closest page is a **light, utilitarian directory tool**. Concretely: the design frames everything in deep navy `#0A2A5C` with yellow `#F5A800` CTAs and one red `#D6232A` submit; the app uses a light navbar/footer and its existing brand-primary palette with white/slate-50 surfaces. Design cards are flat, 8px radius, 1px `#E2E6EC` borders in strict 6-column icon grids; the app uses rounded-2xl (16px) row cards in a single-column list with a filter sidebar. The design's hierarchy is marketing-typographic (ExtraBold 44–52px hero, centered 24–28px section heads); the app's is tool-like (2xl page title, small dense rows). The design leans on imagery (hero photo, Africa watermark, duotone icons); the app page is imagery-free apart from company logos. Radius, density, and information architecture all diverge — even where a capability exists, nothing on `/companies` *looks* like design 3.

## 🔷 App features the design omits

- Verification-tier filter + per-row `VerificationBadge` (T1/T2 tiers).
- Certification filter and certification tag chips on rows.
- Segments facet (`company_segments`), active-filters bar with removable chips, sort control (relevance/newest/A-Z), FTS relevance ranking (`global_search` RPC).
- RFQ CTA → post-an-opportunity flow.
- Empty-state handling; locale-aware FR rendering of all of the above.

If design 3 replaced `/companies` outright these would regress; the safer read is that design 3 is an **additional landing page** feeding into the existing directory as its results view.

## Verdict

**matchScore: 30/100.**

The design describes a page that does not exist: there is no Local Contacts landing, no contact-type taxonomy, no hero, no sector-count cards, no trust strip, and no navy/yellow/red DRC-flag visual language anywhere in the app. What the app does have is the *plumbing behind* the design's search bar — keyword FTS, sector and province filtering, and a company results list on `/companies` — plus live destinations for both CTAs (`/request` and the auth/registration flow), which is why the score is not near zero. Every overlapping element is presented in a completely different visual idiom (light utilitarian directory vs dark-framed marketing funnel), so even the "present" items score partial on look. The two biggest builds implied are the new landing route itself and the `contact_type` taxonomy with live sector counts; most of the rest is static marketing composition over existing data and routes.
