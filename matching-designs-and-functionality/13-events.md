# Events — design 13 vs current app

## Sources

- Design PDF: `/private/tmp/claude-501/-Users-mehmetsemihbabacan-dev-work-lumio-studio-web-apps-tradeindrc/b6d766d1-9bf6-4b52-91a1-35a1a9770c78/scratchpad/designs/13.pdf`
- Design analysis: `latest-designs/13-events-page.md`
- App route: `src/app/[locale]/events/page.tsx` (detail: `src/app/[locale]/events/[slug]/page.tsx`)
- Key components: `src/components/content/content-card.tsx`, `src/components/design/list-page-shell.tsx`, `src/components/design/page-header.tsx`, `src/components/design/filter-sidebar.tsx`, `src/components/list-pages/sectors-filter.tsx`, `src/components/list-pages/active-filters-bar.tsx`, `src/lib/content/list.ts`

## THE DESIGN SPEC

The design is a dense, portal-style **events hub** — not a plain listing. Two-zone layout: full-width hero, then main content (~72%) + persistent right sidebar (~28%). Palette is the DRC flag triad: deep navy `#0B2A5B` (nav, hero panel, promo band, footer), brand red `#D6191F` (every primary CTA, section-title underline accents, ribbons), golden yellow `#F5A81C` (secondary CTA, icon discs), on white/`#F5F6F8`. Single sans family (Montserrat/Poppins-like); hierarchy via weight + color; small body sizes; ~6–8px radii, hairline borders, very light shadows. Signature device: each section title carries a short red underline bar.

Top-to-bottom inventory:

1. **Navy top nav** — logo + tagline "Connect – Invest – Grow", 8 links (Home, Companies, Opportunities, Marketplace, Local Contacts, Market intelligence, Promote Your Business, Contact), two filled pill CTAs: yellow "Register Your Company", red "Submit an Event".
2. **Hero** — photo collage background (conference crowd left, city skyline right) with centered navy rounded panel: H1 "Explore Business Events in the DRC and Beyond" (bold white ~40px) + subline "Discover conferences, trade forums, B2B meetings, expos, training programs and investment events connected to the Democratic Republic of Congo." Below: white **5-field filter bar** — Keyword, Event Type ⌄, Sector ⌄, Location ⌄, Date ⌄ + red "Search Events" button; then two capsule buttons: outline navy "Browse Events", red filled "Submit an Events" (sic).
3. **Stats strip** — 4 white stat cards, circular color icon discs (navy/yellow/navy/orange): "120+ Upcoming Events", "18 Strategic Sectors", "26 Provinces Covered", "40+ International Partners".
4. **Featured Events** — 3 large cards in a row: 16:9 photo with red corner ribbon ("Forum"/"Summit"/"Conference") and navy title strip overlay; body: bold title, calendar + pin meta rows, 2-line description; footer: outline navy "View Event" + red filled "Register Now". Content: "Trade in DRC Forum 2026" (Feb 10–12, Kinshasa), "DRC Mining & Investment Summit" (May 19–21, Lubumbashi), "Technology Cooperation Conference" (Jul 7–8, Istanbul, Türkiye).
5. **Upcoming Events** — tab pill row (active "All" navy-filled + Conferences, B2B Meetings, Exhibitions, Training, Webinars, Trade Missions) over a **6-card carousel** with circular chevron arrows. Mini-cards: category ribbon, portrait photo, dense title/meta/organizer text, micro "View Details" outline + red "Attend" buttons. Samples: "AFEX 2026 – African Energy Exchange" (Dubai), "Kinshasa B2B Business Meetings", "DRC Expo Lubumbashi 2026", "Investing in DRC: Opportunities Webinar" (Online), "DRC – U.S. Investment & Trade Mission" (Washington, DC).
6. **Events by Sector** — 8 white icon tiles in one row with navy line icons + counts: Mining 28, Agriculture 22, Energy 30, Infrastructure 24, Digital & Telecom 18, Finance 16, Manufacturing 20, Healthcare 12.
7. **Promo band** — full-width navy rounded band: megaphone icon, "Host or Promote Your Event on Trade in DRC" + 2-line copy, right red "Submit an Event" button.
8. **Past Highlights** — 3 horizontal photo-left cards with carousel arrows: "AFEX 2026 Preview", "Trade in DRC Business Breakfast", "Turkey–DRC Technology Mission".
9. **Right sidebar (stacked cards)** — (a) **Submit an Event form**: navy header, 7 inputs (Event Name, Event Type ⌄, Sector ⌄, Date 📅, Location 📍, Organizer, Email ✉) + red "Submit Event"; (b) **Why Use Trade in DRC Events?**: yellow star header, 5 check lines (Verified business audience / Sector-focused visibility / B2B connection opportunities / National and international reach / Event promotion support); (c) **Popular Cities**: 6 chevron rows — Kinshasa, Lubumbashi, Kolwezi, Goma, Istanbul, Dubai; (d) **Newsletter**: email input + red Subscribe.
10. **Navy footer** — 5 columns (Quick Links / Resources / About / Support / Newsletter), circular social icons, "© 2026 Trade in DRC. All rights reserved."

```
+--------------------------------------------------------------+
| NAVY NAV  logo | Home Companies ... Contact | [Yellow][Red]  |
+--------------------------------------------------------------+
| HERO photo collage  [ Explore Business Events... ]           |
|   [Keyword|Type|Sector|Location|Date| Search Events(red)]    |
|          (Browse Events) (Submit an Events red)              |
+---------------------------------------------+----------------+
| [120+][18][26][40+]  stat cards             | SUBMIT AN      |
| Featured Events ___                         | EVENT form     |
| [card][card][card]                          | (7 fields +    |
| Upcoming Events ___                         |  red button)   |
| [tabs: All|Conf|B2B|Exhib|Train|Web|Miss]   |----------------|
| < [c][c][c][c][c][c] >   (6 mini cards)     | Why Use ...    |
| Events by Sector ___                        | (5 checks)     |
| [8 icon tiles: Mining..Healthcare]          |----------------|
| ===== NAVY BAND: Host or Promote ==== [red] | Popular Cities |
| Past Highlights ___                         | (6 rows)       |
| < [wide][wide][wide] >                      |----------------|
|                                             | Newsletter     |
+---------------------------------------------+----------------+
| NAVY FOOTER: Quick Links | Resources | About | Support | NL  |
+--------------------------------------------------------------+
```

## Element-by-element scorecard

| Design element | Visual spec (short) | In app? | Where in app | How the app version differs |
|---|---|---|---|---|
| Hero photo panel + H1 "Explore Business Events…" | Photo collage, navy rounded panel, white bold H1 | ❌ | — | App has a plain `PageHeader` (2xl dark text on white, border-b) — no hero, no imagery |
| 5-field event search bar (Keyword/Type/Sector/Location/Date) | White bar, outlined selects, red "Search Events" | ❌ | — | No keyword/type/location/date filtering at all; only sector via sidebar |
| "Browse Events" / "Submit an Events" hero pills | Capsule outline navy + red filled | ❌ | — | Absent |
| Stats strip (120+ / 18 / 26 / 40+) | 4 white cards, colored icon discs | ❌ | — | Absent (a `Stat` primitive exists in `src/components/design/stat.tsx` but is unused here) |
| Featured Events (3 large cards, ribbon + View Event + Register Now) | 16:9 photo, red ribbon, dual CTAs | ❌ | — | No featured tier; all events render as one flat list |
| Upcoming Events type tabs (All/Conferences/B2B/…/Trade Missions) | Capsule pills, active navy-filled | ❌ | — | No event-type taxonomy in UI or query (`listPublishedByType` filters content type "event" only) |
| Upcoming mini-card carousel (6-up, arrows) | Ribbon + photo + dense meta + View Details/Attend | 🟡 | `src/components/content/content-card.tsx` | App renders generic content cards (cover image, title, excerpt, published date) in a single-column `grid gap-3` — no carousel, no category ribbon, no location/organizer meta, no Attend/Register CTA, no event date range display (ordered by `event_start_at` but shows `published_at`) |
| Events by Sector (8 icon tiles + counts) | White tiles, navy line icons, "28 Events" | 🟡 | `src/components/list-pages/sectors-filter.tsx` | Exists only as a plain sidebar link list of sectors — no icons, no counts, no tile grid |
| Promo band "Host or Promote Your Event" | Navy band, red Submit CTA | ❌ | — | Absent (an `rfq-cta-banner.tsx` primitive shows the band pattern exists elsewhere, not here) |
| Past Highlights carousel (3 horizontal cards) | Photo-left cards, arrows | ❌ | — | No past-events section; list likely mixes past/future |
| Sidebar Submit an Event form (7 fields) | Navy header card, red Submit Event | ❌ | — | No public event-submission flow on this page |
| Sidebar "Why Use Trade in DRC Events?" checklist | Star header, 5 checks | ❌ | — | Absent |
| Sidebar Popular Cities (6 rows) | Pin header, chevron rows | ❌ | — | Absent; no city/location facet exists |
| Sidebar Newsletter card | Email + red Subscribe | ❌ (on this page) | `src/components/design/newsletter-signup.tsx` | Primitive exists in the design system but is not mounted on `/events` |
| Sector filter (functional) | Design: hero Sector select + tiles | ✅ | `sectors-filter.tsx` + `active-filters-bar.tsx` + `?sector=` param | Functionally covers sector filtering, visually a plain text list, not tiles/select |
| Event card → detail link | "View Event"/"View Details" | ✅ | `content-card.tsx` → `/events/[slug]` | Whole card is the link; no explicit CTA buttons |
| Navy nav with dual CTAs / navy 5-column footer | Site chrome | 🟡 | global `Navbar`/`Footer` via layout | Present as chrome but the app's global nav/footer styling differs from the mock's navy + yellow/red pill treatment (assessed in the global-chrome analyses, not per-page) |

## ❌ Design elements the app lacks entirely

**Discovery layer**
- Hero + 5-field faceted search (keyword, event type, location, date) → implies `event_type`, `location/city`, date-range columns + URL-param query support in `lib/content/list.ts`.
- Event-type tabs (Conferences … Trade Missions) → implies an `event_type` enum on the events/content table.
- Events-by-sector tiles with counts → implies per-sector event count aggregate.
- Popular Cities widget → implies a city/location field + counts.
- Past Highlights (past vs upcoming split) → implies filtering on `event_end_at < now()`.

**Credibility / merchandising**
- Stats strip (120+/18/26/40+) → implies aggregate counts (events, sectors, provinces, partners).
- Featured Events tier with "Register Now" → implies a `featured` flag + registration URL/flow per event.
- Category ribbons + Attend CTAs on cards → implies per-event type + registration link.

**Organizer funnel**
- Sidebar Submit an Event form + hero/band Submit CTAs → implies an `event_submissions` table (anon/auth insert, admin review) — none exists on this page.
- "Host or Promote Your Event" navy promo band → static, but needs the submit destination.
- "Why Use Trade in DRC Events?" checklist → static copy, i18n keys.
- Newsletter card on this page → primitive exists; needs mounting + subscription backend.

## 🎨 Visual-language delta

The design is a loud, dense, tricolor institutional portal; the app page is a quiet minimal list. Concretely: the design leans on navy `#0B2A5B` blocks, red `#D6191F` CTAs everywhere, yellow accents, red section-underline bars, photo-heavy cards with corner ribbons, tight multi-column grids, and a persistent sidebar of action cards. The app's design system (per `src/components/design/CLAUDE.md`) deliberately forbids shadows, uses white backgrounds, `rounded-2xl` cards, 1px borders, muted grey type, and reserves `--primary` for rare CTAs. So even the one shared element (event cards) looks nothing alike: app cards are airy 16:10-image single-column cards with grey meta; design cards are ribboned, dual-CTA, high-density units. There is zero navy/red/yellow sectioning, no red-underline section titles, no stats, no photography-led hero.

## 🔷 App features the design omits

- Active-filters chip bar with clearable sector filter (`active-filters-bar.tsx`) — keep.
- Locale-aware bilingual (EN/FR) rendering via `pickLocalized` — design is EN-only; parity must be preserved.
- Empty state (`EmptyState`) when no events match — design shows no empty/edge states.
- Skeleton image loading treatment (`skeleton-image.tsx`).
- URL-param-driven, server-rendered filtering (shareable links) — design implies client search but specifies nothing.

## Verdict

**matchScore: 20/100.**

The app has a working but bare events list: server-fetched published events, sector filter, cards linking to detail pages. That covers only the skeleton of one design section (Upcoming Events) and one facet (sector). Everything that makes design 13 an "events hub" — hero search with five facets, stats strip, featured tier with registration CTAs, event-type tabs, sector tiles with counts, promo band, past highlights, and the entire four-card right sidebar including the public Submit-an-Event form — is missing. Visually the overlap is near zero: the design's navy/red/yellow portal language conflicts with the app's minimal white/borders-only system, so even existing pieces would need restyling, not just rearranging. Data-wise the biggest implied gaps are an `event_type` taxonomy, location/date fields with query support, and an event-submission pipeline.
