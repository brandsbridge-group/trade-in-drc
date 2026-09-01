# Company Profile (source: 5.ai)

## 1. Page identification & purpose

This is a **Company Profile detail page** — step 3 of a 4-step "Local Business Contacts" journey shown in the breadcrumb-stepper directly under the navbar: `1 Landing Page – Local Business Contacts → 2 Search Directory → 3 Company Profile → 4 Find a Local Partner`. The sample company is **"Katanga Industrial Supply SARL"**, a "Mining Equipment Distributor" in Lubumbashi, Haut-Katanga, DRC.

Purpose: present a **verified local supplier** to an international buyer and convert them into a **contact request / introduction**. This is the trust-and-conversion page of the directory funnel: identity + verification proof + capabilities + a lead-capture form, all on one screen. The design is dense, dashboard-like, and B2B-serious rather than "fancy marketing" — it is the workhorse page that the marketing landing pages (designs 1–4 in this set) funnel into.

Branding note: the header and footer carry a "Power by BrandsBridge Group" co-brand (top-right and footer-right), suggesting the customer's agency/partner wants persistent attribution.

## 2. Layout & grid

Landscape desktop artboard (~1170×826 px as rendered; assume 1440 design width). Full-width white page on a very light gray canvas; dark navy footer. Content sits in a ~92%-width container with consistent ~24 px gutters.

Top-to-bottom section order:

1. **Utility header bar** (white, ~40 px): logo left, "Power by BrandsBridge Group" right.
2. **Primary nav bar** (dark navy, ~34 px): 8 links left, 2 CTA buttons right (yellow filled + blue filled).
3. **Process stepper** (white pill row, ~28 px): 4 arrow-chevron segments; active step (3) filled blue.
4. **Company hero card** (white card, ~130 px): 3-column band — logo tile (~15%) | identity block with name, tagline, location, URL, 2 status badges (~50%) | photo (~23%) | vertical stack of 3 action buttons (~15%).
5. **Tab bar**: Overview · Products & Services · Partnership Interests · Verification · Contact Request. Active "Overview" underlined blue.
6. **3-column info row** (~55% / bridged): "About …" card (~40%) | "Key Products & Services" card (~30%) | right rail with "Partnership Interests" + "Company Snapshot" cards (~25%).
7. **Bottom 2-column row**: "Verification Summary" table (left, ~42%) | "Request Contact / Introduction" form (right, ~55%), form fields in a 3-column grid.
8. **Footer** (dark navy): brand + blurb (left ~30%), 3 link columns (Quick Links / Resources / Company), BrandsBridge mark + 4 social icons right; bottom bar with © line, center tagline, URL right.

```
┌────────────────────────────────────────────────────────────────┐
│ [logo]  Trade in DRC                    Power by [BrandsBridge]│  white utility bar
├────────────────────────────────────────────────────────────────┤
│ Home Companies Opportunities Marketplace ...  [Register][Req.] │  navy nav
├────────────────────────────────────────────────────────────────┤
│ ①Landing ▸ ②Search Directory ▸ ▐③Company Profile▌ ▸ ④Partner  │  stepper
├────────────────────────────────────────────────────────────────┤
│ ┌──────┐ ┌ Premium Verified badge ┐ ┌────────┐ ┌────────────┐ │
│ │ LOGO │ │ Katanga Industrial...  │ │ mining │ │[Request Intro]│
│ │ tile │ │ Mining Equip. Distrib. │ │ photo  │ │[B2B Meeting ]│
│ └──────┘ │ 📍 Lubumbashi  🔗 url  │ └────────┘ │[Save Company]│
│          │ [Docs Reviewed][Avail.]│            └────────────┘ │
├────────────────────────────────────────────────────────────────┤
│  Overview | Products & Services | Partnership | Verif. | Contact│
├──────────────────────┬──────────────────┬─────────────────────┤
│ About Katanga...     │ Key Products &   │ Partnership Interests│
│ paragraph            │ Services         │ ✓ ✓ ✓ ✓ ✓ list      │
│ 2-col fact grid:     │ [img] Mining Eq. ├─────────────────────┤
│ Year/Type/Employees/ │ [img] Spare Parts│ Company Snapshot     │
│ HQ | Areas/Langs/Exp │ [img] Maintenance│ key-value rows       │
├──────────────────────┴───┬──────────────┴─────────────────────┤
│ Verification Summary     │ Request Contact / Introduction      │
│ 5-row status table       │ [Name][Company][Email]              │
│ ✓Verified ×4, Docs Rev.  │ [Phone+flag][Interest▾][Message]    │
│                          │ [🡒 Submit Contact Request]          │
├──────────────────────────┴─────────────────────────────────────┤
│ NAVY FOOTER: brand/blurb | Quick Links | Resources | Company   │
│ © 2024 Trade in DRC …  | tagline center | www.tradeindrc.com  │
└────────────────────────────────────────────────────────────────┘
```

Density is high — 7 distinct cards above the fold equivalent — matching the project's "compact cards, info density" preference. Whitespace is modest (~16–20 px card padding), rhythm carried by card borders rather than empty space.

## 3. Color palette

| Color | Best-guess hex | Usage |
|---|---|---|
| Navy / dark blue | `#0B2239` – `#102A43` | Primary nav bar, footer background, dark headings accents |
| Brand blue | `#1D6FD8` / `#2176D2` | Active stepper segment, active tab underline, links (URL), secondary outline buttons text/border, "Request a Partner" CTA, stepper numbers, table header tint |
| Golden yellow | `#F5A800` – `#FDB515` | "Register Your Company" CTA, "Request Introduction" button, "Submit Contact Request" button, "Premium Verified Local Partner" badge fill, small accents in logo swoosh |
| Success green | `#1E9E4A` / `#22A24C` | "Verified" checkmark chips, "Available for International Partnerships" badge text/icon, Partnership Interests check icons, "Overall Verification: Verified" chip |
| White | `#FFFFFF` | Page background, all cards, button text on filled CTAs |
| Light gray | `#F4F6F8` | Page canvas behind cards, alternating table rows, input backgrounds |
| Border gray | `#D9E0E7` | Card borders, input borders, dividers |
| Body text gray | `#4A5568` | Paragraphs, secondary labels |
| Heading ink | `#111827` / near-black | Card titles, company name |
| Pale yellow tint | `#FFF6DC` | Premium badge background |
| Pale green tint | `#E8F6EC` | Verified/availability chip backgrounds |
| Red (minor) | `#D64545` | Small accent in the Trade in DRC swoosh logo + BrandsBridge mark |

Brand logic: the palette is the **DRC flag family — blue, yellow, red** — with blue carrying structure/trust, yellow reserved exclusively for conversion CTAs and premium status, red only as a logo accent, plus a functional green for verification semantics. Light theme throughout (matches stored feedback: light theme, brand-color CTAs).

## 4. Typography

- Single **geometric/neo-grotesque sans** family throughout (Poppins/Inter-like); no serif anywhere.
- Hierarchy:
  - Company name: ~26–28 px, Bold, ink black — the largest text on the page.
  - Tagline "Mining Equipment Distributor": ~14 px, SemiBold, brand blue.
  - Card titles ("About …", "Verification Summary", "Company Snapshot"): ~14–15 px Bold, Title Case.
  - Sub-item titles ("Mining Equipment", "Spare Parts"): ~12 px SemiBold, blue or ink.
  - Body/paragraph: ~11–12 px Regular, gray, ~1.5 line-height, justified-looking left blocks.
  - Labels in fact grids ("Year Established"): ~11 px SemiBold ink over ~11 px Regular gray values.
  - Nav links: ~12 px Medium, white, Title Case (not uppercase).
  - Buttons: ~12 px SemiBold, Title Case.
  - Micro-copy (form disclaimer, footer legal): ~9–10 px Regular.
- Casing: Title Case for headings/buttons/nav; sentence case for body. No all-caps blocks except the logo lockup "KATANGA INDUSTRIAL SUPPLY".
- Links (website URL) rendered blue, no underline until presumably hover.

## 5. Components

- **Utility header**: white strip; swoosh logo + "Trade in DRC / Connect · Invest · Grow" tricolor tagline; right-aligned "Power by" + BrandsBridge logo.
- **Navbar**: navy bar, 8 text links (Home, Companies, Opportunities, Marketplace, Local Contacts, Market Intelligence, Promote Your Business, Contact); two pill-ish rectangular CTAs, radius ~4 px: yellow filled "Register Your Company" (navy text) and blue filled "Request a Partner" (white text).
- **Stepper**: 4 arrow/chevron segments in a single white rounded bar; each segment has a numbered circle (filled navy/blue for visited, outline gray for upcoming) + label; active segment fully filled brand blue with white text and chevron point.
- **Company hero card**: white, 1 px gray border, radius ~8 px, subtle shadow. Contains: bordered square logo tile (~110 px, radius 6); "Premium Verified Local Partner" badge (pale-yellow pill, gold border, crown/badge icon, ~999 px radius); H1 + blue tagline; icon row with pin + location and globe + URL; two outline chips below ("Documents Reviewed" blue-outline, "Available for International Partnerships" green-outline, both radius ~6 with icons); right-side photo (rounded ~6 px, mining truck); far-right button stack: yellow filled "Request Introduction" (icon+label), and two white outline blue-text buttons "Schedule a B2B Meeting" (calendar icon) and "Save Company" (heart icon) — all full-width of their column, radius ~6, ~36 px tall.
- **Tab bar**: text tabs on white, active tab blue with 2–3 px blue underline; hairline divider under the whole row.
- **About card**: title, 4-line paragraph, then a 2×4 icon fact grid (Year Established 2017 / Company Type LLC (SARL) / Number of Employees 51–100 / Headquarters Lubumbashi ‖ Service Areas / Languages French, English, Swahili / International Experience). Each fact = small line icon + bold label + gray value.
- **Key Products & Services card**: 3 stacked media rows, each = square thumbnail photo (~64 px, radius 6) + blue bold title + 2-line gray description (Mining Equipment / Spare Parts / Maintenance & Support). Rows sit on faint gray rounded sub-panels.
- **Partnership Interests card**: 5-item checklist, green check-circle icons (Distributorship Agreements, OEM Partnerships, Technology Transfer, Joint Ventures, Supplier Partnerships).
- **Company Snapshot card**: 6 key-value rows separated by hairlines (DUNS Number —/–, Tax ID (RCCM) CD/L'sh/RCCM/17-B-01234, Industry Sector Mining & Minerals, Business Registrations RCCM, NIF, CNSS, Quality Certifications ISO 9001:2015).
- **Verification Summary table**: header row "Verification Area / Status / Verified By / Date Verified" on light-gray tint; 5 rows (Business Registration (RCCM), Tax Compliance (NIF), Physical Address, Bank Reference, Company Documents); status = green ✓ "Verified" chips (last row blue "Documents Reviewed"); Verified By "Trade in DRC"; dates "Apr 28, 2024". Top-right of card: "Overall Verification: ✓ Verified" green chip.
- **Contact form**: 3-column grid — Full Name*, Company Name*, Email Address* / Phone (flag + `+243` prefix dropdown + number), "Your Interest*" select, Message (Optional) textarea spanning taller. Inputs: white/near-white fill, 1 px gray border, radius ~6, placeholder gray. Submit: yellow filled button with send icon "Submit Contact Request", navy text. Micro disclaimer below: "We respect your privacy…".
- **Footer**: navy; white logo lockup + tricolor tagline + 3-line gray-white blurb; three link columns; "Power by BrandsBridge Group" white lockup; 4 boxed social icons (LinkedIn, Twitter, YouTube, Email) as outline squares; hairline divider; bottom row © / tagline / URL.

## 6. Borders, radii, shadows & effects

- **Radius convention**: small-to-medium — cards ~8 px, buttons/inputs/thumbnails ~6 px, chips ~6 px, badges/pills ~999 px, stepper bar ~14 px. Nothing sharp-cornered except table rows.
- **Borders**: pervasive 1 px light-gray borders on every card, input, thumbnail, logo tile, and outline button; hairline row dividers in Snapshot and Verification table; hairline footer divider (white @ ~15% opacity).
- **Shadows**: very subtle, low-blur drop shadows on the hero card and main cards (~0 1px 3px rgba(0,0,0,.06)); no heavy elevation.
- **Gradients/overlays/glass**: none — flat light UI. No glassmorphism, no image overlays. The only tinted fills are the pale-yellow premium badge and pale-green verified chips.
- **Stepper chevrons**: angled polygon edges (clip-path style), the only non-rectangular geometry on the page.

## 7. Imagery & iconography

- **Photos** (3+1): hero photo — yellow haul truck + excavator in an open-pit mine (natural color, no duotone, rounded corners, no text overlay); three thumbnails in Key Products — excavator/loader machinery, stacked machine spare parts (gears/bearings), technician in workwear doing maintenance. All full-color, realistic industrial stock, masked to rounded squares.
- **Company logo**: circular black gear emblem with mining tools, "KATANGA INDUSTRIAL SUPPLY" wordmark, inside a bordered white tile.
- **Icons**: thin/medium-weight **line icons** (Lucide/Feather-like, rounded caps) used for facts (calendar, building, users, pin, globe, briefcase), buttons (badge, calendar, heart, send), and chips; **filled circular check** icons in green for verification/partnership items; boxed outline social icons in footer. Consistent ~14–16 px size, single-color (blue, green, or gray).
- **Flags**: small DRC flag in the phone-prefix selector (`+243`).

## 8. Content & copy

Language: **English only** on this artboard (site is EN/FR; FR variant not shown). Tone: formal, trust-building B2B.

Key strings (verbatim):
- Nav: "Home, Companies, Opportunities, Marketplace, Local Contacts, Market Intelligence, Promote Your Business, Contact"; CTAs "Register Your Company", "Request a Partner".
- Stepper: "Landing Page – Local Business Contacts", "Search Directory", "Company Profile", "Find a Local Partner".
- Hero: "Premium Verified Local Partner"; "Katanga Industrial Supply SARL"; "Mining Equipment Distributor"; "Lubumbashi, Haut-Katanga, DRC"; "www.katangaindustrial.cd"; "Documents Reviewed"; "Available for International Partnerships"; buttons "Request Introduction", "Schedule a B2B Meeting", "Save Company".
- About: "Katanga Industrial Supply SARL is a leading supplier and distributor of high-quality mining and industrial equipment, spare parts, and consumables across the Democratic Republic of Congo. With a strong focus on reliability, safety, and after-sales support, we partner with global manufacturers to deliver value-driven solutions to the mining, construction, and energy sectors."
- Facts: Year Established 2017; Company Type "Limited Liability Company (SARL)"; Employees "51 – 100"; Service Areas "Haut-Katanga, Lualaba, Tanganyika, Haut-Lomami, Kasai-Oriental"; Languages "French, English, Swahili"; International Experience "Supplies imported from South Africa, Zambia, China, and Europe".
- Products: "Mining Equipment — Excavators, loaders, haul trucks, drilling rigs, and construction machinery." / "Spare Parts — OEM and aftermarket parts for major mining equipment brands." / "Maintenance & Support — Preventive maintenance, field support, and equipment refurbishment services."
- Form: "Send a request to connect with Katanga Industrial Supply SARL. Your request will be reviewed by our team before an introduction is made." Disclaimer: "We respect your privacy. Your information will only be used to facilitate this introduction."
- Footer blurb: "Trade in DRC is your gateway to verified local business contacts, market opportunities, and strategic partnerships across the Democratic Republic of Congo." Bottom: "© 2024 Trade in DRC. All rights reserved." / "Trade in DRC – Connecting international business with local opportunities." / "www.tradeindrc.com". ("Power by" is a typo for "Powered by" — appears twice.)

## 9. UX assessment

**Works well**
- Clear conversion hierarchy: yellow is used only 3 times, all conversion actions (Request Introduction / Register / Submit) — excellent CTA discipline.
- Trust stacking is strong: premium badge → status chips → verification table with dates and "Verified By" → overall-verified chip. Exactly right for a government/trade-credibility product.
- The mediated-introduction model ("reviewed by our team before an introduction is made") is communicated honestly at the form.
- Dense but scannable: every card has one job; the 3-column info row reads left-to-right as story → offering → fit → facts.
- Stepper gives funnel context, useful for first-time international visitors.

**Risky / to fix**
- **Tabs vs. one-page duplication**: the tab bar (Overview…Contact Request) duplicates sections that are already all visible below. Either make tabs scroll-anchors or drop them; as real tabs they'd hide the verification proof and form.
- Body text at ~11 px and micro-copy at ~9 px is below comfortable web minimums; bump to 14/12 px equivalents.
- Contrast: gold yellow with navy text passes, but gray-on-white body (`#4A5568`-ish at small sizes) and pale-green chip text need AA checks; blue link on white fine.
- "Save Company" implies auth — needs a signed-out state (auth modal trigger).
- DUNS "—/–" empty value shown as dash: fine, but define empty-state rules per snapshot field.
- Two "Request" CTAs (hero yellow + form) plus "Request a Partner" in nav can compete; hero button should scroll to the form rather than open a second flow.
- Stepper labels are long; will wrap badly on tablet — needs responsive truncation or icon-only collapsed steps. Whole layout is desktop-first; the 3-column row must stack cleanly.
- "Power by" typo must be corrected; verify whether BrandsBridge co-branding is contractually required before shipping it site-wide.

## 10. Mapping to TradeInDRC site

**Route**: `src/app/[locale]/companies/[id]/page.tsx` — this is a direct redesign of the existing company detail page. The stepper implies arrival from a "Local Contacts" directory flow (`/companies` or a new `/local-contacts` landing per nav item "Local Contacts" — nav also introduces "Marketplace", "Market Intelligence", "Promote Your Business" which map to roadmap modules).

**Data mapping** (existing schema: `companies`, `sectors`, `profiles` + verification tier constants):
- Premium badge ↔ `VerificationTier` (T-constants in `constants/status`) — "Premium Verified Local Partner" = top tier; chips ↔ verification flags.
- Verification Summary table ↔ needs per-area verification records (area, status, verified_by, verified_at) — check migrations 00011-00021 for a verifications table; extend if only a single tier flag exists.
- Company Snapshot ↔ new columns/JSON for RCCM, NIF, CNSS, DUNS, ISO certs (bilingual not needed — identifiers).
- Contact form ↔ existing request flow (migration 00022 request page): reuse `requests` table with `company_id` target + interest enum; server action + RLS.

**Implementation notes (Tailwind v4 / shadcn)**
- Cards: `Card` with `border border-border rounded-lg shadow-sm`; page canvas `bg-muted/40`.
- Tabs: use shadcn `Tabs` but render as scroll-spy anchors (all content visible), or `ScrollArea` nav — do not hide verification behind tabs.
- Stepper: custom component with `clip-path` chevrons; collapse to numbered dots `<md`.
- Buttons: map yellow to existing brand accent token (`bg-secondary` gold w/ navy text), blue outline = `variant="outline"` with primary border. Follow MOTION.md — hover ≤180 ms, card mount fades ≤300 ms, no scroll-triggered theatrics on this data page.
- Badges/chips: shadcn `Badge` variants: `premium` (amber-50/amber-500 border), `verified` (green-50/green-600), `info` (blue outline).
- Verification table: shadcn `Table`, status cell = Badge; i18n all labels (`en`/`fr` message keys under a `companyProfile` namespace).
- Form: react-hook-form + zod, phone prefix via country select defaulting `+243`; Sonner toast.loading→success per NON_BLOCKING_UX; gate "Save Company" behind `useAuth()` → auth modal.
- Photos: `next/image` rounded thumbnails; company logo in bordered tile with `object-contain`.
