# Events Page (source: 13.ai)

## 1. Page identification & purpose

This is the **Business Events hub page** — the site's dedicated `/events` landing. The hero headline reads "Explore Business Events in the DRC and Beyond" and the whole page is an event-discovery machine: search/filter for events, featured events, upcoming events by type, events by sector, a "Host or Promote Your Event" promo band, past highlights, plus a persistent right-rail with an event-submission form and supporting widgets.

Intent: position TradeInDRC as the authoritative calendar of DRC-related conferences, trade forums, B2B meetings, expos, training programs, and investment events — both domestic (Kinshasa, Lubumbashi) and international (Istanbul, Washington D.C., Dubai). It serves two audiences at once: attendees (search + browse) and organizers (Submit an Event, present in nav, hero, sidebar form, and mid-page CTA band — four times).

## 2. Layout & grid

Two-zone structure: full-width hero + a **main-content (~72%) / right-sidebar (~28%) split** for everything below the stats row. Content column is dense, portal-style — small type, tight card grids, minimal vertical whitespace between sections. Each main section is introduced by a small bold title with a short red underline accent (e.g. "Featured Events", "Upcoming Events").

Section order top→bottom:
1. Dark navy top nav (logo left, 8 links center, 2 pill CTAs right: yellow "Register Your Company", red "Submit an Event")
2. Hero (~18% of artboard height): full-bleed photo collage (conference crowd left, city skyline right), centered navy panel with H1 + subline, then a white **5-field filter bar** (Keyword, Event Type, Sector, Location, Date + red "Search Events" button) and two pill buttons below ("Browse Events" outline, "Submit an Events" red)
3. Stats strip: 4 white stat cards in a row (120+ / 18 / 26 / 40+)
4. "Featured Events" — 3 large event cards in one row
5. "Upcoming Events" — tab filter row (All, Conferences, B2B Meetings, Exhibitions, Training, Webinars, Trade Missions) above a **6-card carousel row** with left/right circular arrows
6. "Events by Sector" — 8 icon tiles in one row (Mining … Healthcare)
7. Dark navy full-width promo band: "Host or Promote Your Event on Trade in DRC" + red "Submit an Event" button
8. "Past Highlights" — 3 horizontal photo+text cards, carousel arrows
9. Footer: dark navy, 5 link columns + newsletter block + social icons, copyright line

Right sidebar (stacked cards): Submit an Event form → "Why Use Trade in DRC Events?" checklist → "Popular Cities" list → Newsletter signup.

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

## 3. Color palette

| Color | Hex (best guess) | Usage |
|---|---|---|
| Deep navy | `#0B2A5B` / `#0A2C6B` | Nav bar, hero title panel, promo band, footer, section header pills on cards, primary dark text accents |
| Brand red | `#D6191F` (≈ `#E00914`) | All primary CTAs: Search Events, Register Now, Attend, Submit Event, Subscribe; section-title underline accents; tag ribbons |
| Golden yellow | `#F5A81C` | "Register Your Company" nav CTA, one stat icon disc, star icon in sidebar, "Grow" word in tagline |
| White | `#FFFFFF` | Card fills, filter bar, main page background (content zone is white/near-white `#F5F6F8`) |
| Light grey | `#EFF1F4` | Page background behind cards, tab pills, input fills |
| Near-black text | `#1A1A1A` | Body copy, card titles |
| Mid grey | `#6B7280` | Meta text (dates, locations), placeholder text |
| Sky/photo blues | ambient | Hero skyline imagery |

Brand logic: this is the **DRC flag triad** — blue field, red diagonal, yellow accents — used systemically: navy = structure/trust, red = action, yellow = secondary highlight. Green appears only in the tagline word "Grow".

## 4. Typography

- Single geometric/neo-grotesque **sans-serif** family throughout (Montserrat/Poppins-like).
- H1 hero: bold, white, title case, ~40px equivalent — the largest text on the page by far.
- Section titles ("Featured Events"): ~18px bold navy/black, title case, with a short red underline bar beneath the first words.
- Card titles: ~13–14px bold; meta lines ~10–11px regular grey with small line icons (calendar, pin).
- Buttons: ~11px semibold, title case ("View Event", "Register Now", "Attend").
- Sidebar headers sit in navy label style with a leading icon.
- Overall hierarchy is achieved by weight + color more than size; body sizes are small (portal density), line-height tight.

## 5. Components

- **Top nav**: navy bar, logo + tagline "Connect – Invest – Grow" (each word colored blue/red? green for Grow), 8 text links, two rounded-rect CTA buttons (yellow filled, red filled), ~6–8px radius.
- **Hero search bar**: white rounded container holding 5 outlined dropdown/inputs (thin dark border, ~6px radius, chevron carets) + red filled "Search Events" button. Below: outline pill "Browse Events" (navy border, white fill) and red filled pill "Submit an Events" — both fully rounded (capsule).
- **Stat cards** (×4): white, subtle border/shadow, ~8px radius; left circular icon disc (navy, yellow, navy, orange) + big bold number ("120+") + grey label ("Upcoming Events", "Strategic Sectors", "Provinces Covered", "International Partners").
- **Featured event cards** (×3): image top (16:9) with a small red corner ribbon tag ("Forum" / "Summit" / "Conference") and navy title strip overlay on photo; white body with bold title, calendar+location meta rows, 2-line description; footer with two buttons — outline navy "View Event" + filled red "Register Now". Radius ~8px, light shadow.
- **Tab filter pills**: 7 pills; active "All" is navy filled white text, inactive light-grey filled dark text; capsule shape.
- **Upcoming event mini-cards** (×6, carousel): narrow vertical cards; tiny category ribbon top (navy/red), portrait image, dense text block (title, meta with icons, organizer, 1-line note), footer with micro "View Details" outline + red "Attend" buttons. Circular chevron arrows flank the row.
- **Sector tiles** (×8): white squares, thin line icon (navy) top, bold sector name, grey event count ("28 Events" … "12 Events"): Mining 28, Agriculture 22, Energy 30, Infrastructure 24, Digital & Telecom 18, Finance 16, Manufacturing 20, Healthcare 12.
- **Promo band**: full-width navy rounded rectangle, left icon (megaphone/calendar), bold white heading + 2-line supporting copy, right red button "Submit an Event" with icon.
- **Past highlight cards** (×3): horizontal — photo left (~40%), text right (navy mini-header strip, bold title, 2-line description). Carousel arrows.
- **Sidebar — Submit an Event form**: card with navy header row (icon + "Submit an Event"), 7 stacked inputs (Event Name, Event Type ⌄, Sector ⌄, Date 📅, Location 📍, Organizer, Email ✉) + full-width red "Submit Event" button.
- **Sidebar — Why Use card**: yellow star header, 5 checklist lines (yellow check/star marks): Verified business audience / Sector-focused visibility / B2B connection opportunities / National and international reach / Event promotion support.
- **Sidebar — Popular Cities**: pin-icon header, 6 rows with chevrons: Kinshasa, Lubumbashi, Kolwezi, Goma, Istanbul, Dubai.
- **Sidebar — Newsletter**: envelope header, subline, email input + red Subscribe button.
- **Footer**: navy; logo + tagline + blurb left; columns Quick Links / Resources / About / Support; newsletter block right (input + red Subscribe); circular outline social icons (in, X/twitter?, f, ▶); "© 2026 Trade in DRC. All rights reserved."

## 6. Borders, radii, shadows & effects

- Radius system: ~6–8px on cards/inputs/buttons; capsule (full) radius on hero pills and tab filters; circles for icon discs, carousel arrows, socials.
- Strokes: hairline 1px light-grey borders on cards and inputs; navy 1–1.5px stroke on outline buttons ("View Event", "Browse Events").
- Shadows: very light, diffuse card shadows (y≈2–4, low opacity) — flat portal look, no heavy elevation.
- Section titles carry a **short red underline bar** (~40–60px) as the signature divider device.
- Hero uses photographic background with a slight dark overlay; the headline sits on a solid navy rounded panel rather than raw text-on-photo. No gradients, no glassmorphism.
- Category ribbons on cards are small angled/flag-shaped red or navy tags in the image corner.

## 7. Imagery & iconography

- **Photography**: real editorial photos, no duotone/treatment — conference audiences and speaker panels, mining haul truck (Mining & Investment Summit), server/technology imagery, handshake meetings, expo halls, US Capitol (DRC–U.S. Trade Mission), Turkish delegation with flags (Turkey–DRC Technology Mission), Kinshasa/city skyline in hero right, event crowd in hero left. Photos are rectangular, top-of-card, sometimes with a navy title band overlaid.
- **Iconography**: thin/medium line icons, rounded, single-color (navy or white-on-disc): calendar, map pin, envelope, megaphone, star, checkmarks, sector glyphs (pickaxe, wheat, lightning bolt, bridge/crane, signal, bank column, factory, heart/cross). Stat icons sit on solid color circles (navy/yellow/orange).

## 8. Content & copy

Language: **English** throughout. Tone: institutional-promotional, confident.

Key strings:
- H1: "Explore Business Events in the DRC and Beyond"
- Sub: "Discover conferences, trade forums, B2B meetings, expos, training programs and investment events connected to the Democratic Republic of Congo."
- Filters: Keyword / Event Type / Sector / Location / Date / "Search Events"; "Browse Events"; "Submit an Events" (sic — typo, should be "Submit an Event")
- Stats: "120+ Upcoming Events", "18 Strategic Sectors", "26 Provinces Covered", "40+ International Partners"
- Featured: "Trade in DRC Forum 2026 — Feb 10–12, 2026, Kinshasa, DRC — The premier platform connecting global investors with DRC business leaders and opportunities."; "DRC Mining & Investment Summit — May 19–21, 2026, Lubumbashi, DRC — Bringing together mining executives, investors and policymakers to shape DRC's future."; "Technology Cooperation Conference — Jul 7–8, 2026, Istanbul, Türkiye — Advancing digital transformation and tech partnerships between DRC and global markets."
- Upcoming samples: "AFEX 2026 – African Energy Exchange" (Dubai, UAE), "Kinshasa B2B Business Meetings", "DRC Expo Lubumbashi 2026", "Investing in DRC: Opportunities Webinar", "DRC – U.S. Investment & Trade Mission" (Washington, DC USA)
- Band: "Host or Promote Your Event on Trade in DRC — Reach thousands of businesses, investors and professionals. List your conferences, trade fairs, B2B meetings, and training programs on our platform."
- Past Highlights: "AFEX 2026 Preview", "Trade in DRC Business Breakfast", "Turkey–DRC Technology Mission"
- Footer columns: Quick Links (Home, Companies, Opportunities, Marketplace, Events, Contact), Resources (Market Intelligence, Guides & Reports, Investment Climate, Trade Agreements, News & Updates, FAQ), About (About Us, Our Partners, How It Works, Terms of Use, Privacy Policy, Sitemap), Support (Help Center, Submit a Ticket, Advertise, Partnerships, Media Inquiries)

Note: no French version shown — bilingual parity must be produced at build time.

## 9. UX assessment

**Works**
- Clear dual-audience funnel: attendee path (search → featured → upcoming → sectors) and organizer path (Submit an Event repeated at nav, hero, sidebar, band).
- Faceted search bar above the fold is exactly right for an events directory.
- Tab filters + sector tiles give two orthogonal browse axes (type × sector) — good scanability.
- Consistent card grammar (image / ribbon / title / meta / dual CTA) makes the page learnable fast.
- Stats row builds credibility before content.

**Risky**
- **Density**: 6-up mini-card carousel with ~10px type will be unreadable; on web it must become 3–4 per row with larger type, horizontal scroll on mobile.
- "Submit an Events" typo; also four Submit CTAs is redundant — keep nav + band, make sidebar form the destination anchor.
- Sidebar form competes with hero search for attention; consider collapsing it below the fold on mobile or making it a modal/route.
- Navy title strips overlaid on photos risk low contrast where the photo is dark; enforce an overlay scrim.
- Red outline + red fill button pairs everywhere → red loses meaning; demote "View Details" to ghost/neutral.
- Carousel arrows on both Upcoming and Past rows: keyboard/focus management and touch affordances needed; avoid auto-advance.
- Small grey meta text (~10px) will fail WCAG at rendered size; minimum 12–13px with `text-muted-foreground` on white.
- All-English mock: FR strings will run ~20–30% longer — button labels ("Register Now" → "S'inscrire maintenant") need flexible widths.

## 10. Mapping to TradeInDRC site

Maps to the existing **`/[locale]/events`** route (events listing), with the submission flow feeding the dashboard/admin events pipeline.

Implementation notes (Tailwind v4 + shadcn):
- **Hero**: reuse the search-forward hero pattern from home; filter bar = `flex` of 4 shadcn `Select` + 1 `Input` (keyword) + `DatePicker` (calendar popover) + `Button variant=destructive`-styled brand-red. Wire to URL search params for shareable filtered views.
- **Stats**: 4-col grid of `Card`s; counts from Supabase aggregate (BigQuery not needed — small counts, but cache/ISR them).
- **Featured/Upcoming**: one `EventCard` component with `size="featured" | "compact"` variants; ribbon = absolutely-positioned `Badge` on image; carousel via shadcn `Carousel` (embla) — respects `prefers-reduced-motion`, no autoplay.
- **Tabs**: shadcn `Tabs` or toggle-group pills driving a client-side filter over React Query data (`event_type` column).
- **Events by Sector**: reuse the sectors taxonomy table (`sectors`) + event counts; link each tile to `/events?sector=slug`.
- **Sidebar form**: `react-hook-form` + zod; inserts into an `event_submissions` table (RLS: insert for anon/auth, review in `/admin`). Consider moving to `/events/submit` route and rendering the sidebar card as a teaser linking there.
- **Promo band + Past Highlights**: static band component; past events = same events table filtered `end_date < now()`, sorted desc.
- **Colors**: navy `#0B2A5B` and red `#D6191F` should match existing brand tokens; verify against `globals.css` theme variables rather than hardcoding (NO_MAGIC_NUMBERS applies — token them).
- **i18n**: every string above needs `en.json`/`fr.json` keys under an `events` namespace; fix the "Submit an Events" typo in EN.
- Motion: follow `docs/MOTION.md` — card hover lift ≤180ms, section mounts ≤300ms, marketing hero enter ≤500ms.
