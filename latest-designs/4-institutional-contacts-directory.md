# Institutional Contacts Directory (source: 4.ai)

## 1. Page identification & purpose

This is an **inner listing/directory page**, not the homepage: the **"Institutional Contacts"** page, a child of a **"Local Contacts Directory"** section (breadcrumb reads `Home > Local Contacts Directory > Institutional Contacts`). Its role is a searchable, filterable directory of DRC public agencies and business-support institutions (ANAPI, FEC, FPI, ARSP, DGI, OCC...) that international investors need to know when entering the DRC market. Intent: position Trade in DRC as the authoritative "front door" to the Congolese institutional landscape — reduce friction for foreign businesses trying to find the right regulator/agency, and funnel undecided visitors into a "Request Guidance" concierge CTA.

The design is utility-first (directory pattern: sidebar filters + card grid), but wrapped in the site's marketing chrome (dark navy nav/footer, orange/blue CTAs, tagline "Connect – Invest – Grow").

## 2. Layout & grid

Top-to-bottom section order (single artboard, ~1170px-wide desktop frame):

1. **Utility top bar** (dark navy, ~50px): logo left, "Power by BrandsBridge Group" right.
2. **Primary nav bar** (white, ~36px): 9 text links left, search icon + 2 pill CTAs right.
3. **Breadcrumb bar** (dark navy, ~34px): 3-level breadcrumb with arrow separators; current page in orange.
4. **Page header row** (white, ~130px): H1 + subtext left (~45% width); search input (~26% width) + "All Categories" dropdown (~15%) right, top-aligned with the H1.
5. **Directory body** (light gray `#F5F6F8` band, ~400px): left **CATEGORIES sidebar** (~17% width, 10 filter items) + right **3-column card grid** (2 rows × 3 = 6 institution cards), gutters ~16px.
6. **Help banner** (full content width, light card): icon + question + subtext left, dark navy "Request Guidance →" button right.
7. **Footer** (dark navy, ~150px): logo + mission paragraph left; 3 link columns (Quick Links / Resources / Company); "Power by BrandsBridge" + 4 social icons right.
8. **Sub-footer bar** (darker navy, ~40px): © left, tagline center, URL right.

```
+--------------------------------------------------------------+
| [logo Trade in DRC]                    Power by BrandsBridge |  navy
+--------------------------------------------------------------+
| Home Companies Opportunities ... Contact   (q)[Register][Req]|  white
+--------------------------------------------------------------+
| Home > Local Contacts Directory > *Institutional Contacts*   |  navy
+--------------------------------------------------------------+
| H1 Navigate the DRC Business          [ Search inst...    ]  |
| Environment ... Contacts              [ All Categories  v ]  |  white
| subtext (3 lines)                                            |
+--------------------------------------------------------------+
| +-----------+  +--------+ +--------+ +--------+              |
| |CATEGORIES |  | ANAPI  | | FEC    | | FPI    |              |
| | All Inst. |  +--------+ +--------+ +--------+              |  gray
| | Invest... |  +--------+ +--------+ +--------+              |  band
| | 10 items  |  | ARSP   | | DGI    | | OCC    |              |
| +-----------+  +--------+ +--------+ +--------+              |
|                +----------------------------------------+    |
|                | (icon) Need help... ? [Request Guidance]|   |
|                +----------------------------------------+    |
+--------------------------------------------------------------+
| footer: logo+mission | Quick Links | Resources | Company | BB|  navy
+--------------------------------------------------------------+
| © 2024 ...      Trade in DRC – Connecting...   www.tradein...|  darker
+--------------------------------------------------------------+
```

Density is moderate — compact cards, tight sidebar rows (~24px each), generous white gutter between header and body. Content is centered with ~50px page margins. The help banner is right-aligned to the card grid (starts after the sidebar), which visually ties it to the results area.

## 3. Color palette

| Color | Best-guess hex | Usage |
|---|---|---|
| Dark navy | `#0A1F3C` / `#0B2240` | Top bar, breadcrumb bar, footer, "Request Guidance" button, H1 headline text |
| Darker navy | `#071830` | Sub-footer strip |
| Brand blue | `#1B6BD6` / `#2570DE` | "Request a Partner" pill CTA, sidebar active-item text + left accent, "View Contact Details" links, breadcrumb arrow glyphs, footer link hover state |
| Orange/amber | `#F5A623` / `#F7A21B` | "Register Your Company" pill CTA, breadcrumb current-page text, active footer link ("Local Contacts"), logo accent |
| Green (tagline) | `#1E9E4A` | "Grow" word in tagline; "Investment Promotion" badge text |
| Light green badge bg | `#E7F5EC` | Investment Promotion badges (ANAPI, FPI) |
| Light purple badge bg | `#EFEAF8` (text `#7B5EA7`) | "Business Support" (FEC), "Regulation" (ARSP) badges |
| Light amber badge bg | `#FBF3DE` (text `#B98A1F`) | "Tax & Fiscal" (DGI), "Standards & Quality" (OCC) badges |
| Page white | `#FFFFFF` | Header band, cards, nav bar |
| Light gray | `#F4F5F7` | Directory body band, help-banner fill, sidebar card bg |
| Mid gray | `#6B7280` | Body/description text, location text |
| Border gray | `#E3E6EA` | Card borders, sidebar border, input borders |
| Red (logo) | `#D22730` | Small accent inside DRC-map logo mark |

Brand logic: DRC flag palette — **sky blue, yellow, red** — reinterpreted as navy + brand blue + orange, with red confined to the logo mark and green used for the "Grow" growth message and positive badges.

## 4. Typography

- Single **geometric/rounded sans-serif** family throughout (looks like a rounded grotesque — e.g. Comfortaa/Baloo-adjacent for the logo, and a cleaner geometric sans like Poppins/Jost for body). Slightly rounded terminals give a friendly, modern-gov tone.
- **H1** (~28–30px, bold, navy, sentence case, 2 lines): "Navigate the DRC Business Environment with the Right Institutional Contacts".
- **Subtext** (~11px, regular, dark gray, 3 short lines, tight leading).
- **Card titles** (acronyms: ANAPI, FEC, FPI...) ~15px bold navy; badge text ~9px medium; description ~10px regular gray, 2 lines; location ~9px with pin icon.
- **Sidebar**: "CATEGORIES" label in ~11px bold ALL-CAPS with letter-spacing; items ~11px regular, active item bold blue.
- **Links**: "View Contact Details" ~10px semibold blue with arrow glyph.
- **Buttons**: ~11px medium, sentence case ("Register Your Company", "Request Guidance").
- Footer column headers ~12px semibold white; links ~11px regular light gray.
- Casing: sentence case dominates; only "CATEGORIES" is uppercase. No underlines on links; arrows signal interactivity.

## 5. Components

- **Utility top bar**: dark navy strip; logo lockup (DRC map silhouette in blue/yellow/red + "Trade in DRC" white + tricolor tagline "Connect – Invest – Grow" in blue/orange/green); right side "Power by" + BrandsBridge logo (pink/blue diamond mark).
- **Primary nav**: white bar, 9 flat text links (~11px navy), magnifier icon, then two pill buttons: solid **orange pill** "Register Your Company" (white text, fully rounded ~16px radius) and solid **blue pill** "Request a Partner". Equal height (~26px), side-by-side.
- **Breadcrumb bar**: navy strip; white crumb text, small blue play/arrow triangle separators, current crumb in orange semibold.
- **Search input**: white field, 1px navy/gray border, ~8px radius, left magnifier icon, placeholder "Search institution, agency, organization...". ~300px wide, ~44px tall.
- **Category dropdown**: matching bordered field, label "All Categories", solid navy filled triangle caret right.
- **Sidebar filter card**: white card, 1px light border, ~8px radius; header "CATEGORIES"; 10 rows each with a thin-line icon + label: All Institutions (active: bold blue + blue left accent bar + light blue row bg), Investment Promotion, Business Registration, Chambers & Networks, Sector Regulators, Provincial Support, Export & Trade Support, Finance & Tax, Legal & Judicial, Education & Training.
- **Institution card** (×6): white fill, 1px `#E3E6EA` border, ~10px radius, subtle/no shadow. Structure: top row = grayscale/monochrome **institution logo** (left, ~70×36) + acronym title (right of logo) + colored **category badge pill** beneath the title (rounded ~4px, tinted bg, colored text); middle = 2-line gray description; bottom = pin icon + "Kinshasa"; divider-less footer link "View Contact Details →" in blue. Cards ~270×145px.
- **Help banner**: full-grid-width light gray rounded card (~10px radius, 1px border); left circular/rounded navy line-icon (building + person), bold navy question "Need help navigating the DRC business environment?", gray subtext "Our team can connect you with the right institution or support service."; right solid navy rectangular button "Request Guidance →" (~6px radius, white text + arrow).
- **Footer**: navy; left brand block (logo + 3-line mission); three link columns — Quick Links (Companies, Opportunities, Products, Local Contacts), Resources (Market Intelligence, Promote Your Business, News & Insights, Help Center), Company (About Us, Terms of Use, Privacy Policy, Contact Us); active page link "Local Contacts" in orange; right: BrandsBridge lockup + 4 circular outlined social icons (LinkedIn, Twitter, YouTube, Mail).
- **Sub-footer**: single row, three text zones (©, tagline, URL).

## 6. Borders, radii, shadows & effects

- **Radii convention**: pills fully rounded (~16px) for nav CTAs; cards/inputs/sidebar ~8–10px; badges ~4px; "Request Guidance" button ~6px. Mildly inconsistent (pill CTAs vs rectangular guidance button) — likely intentional: pills = marketing CTAs, rectangle = functional action.
- **Strokes**: 1px light gray borders everywhere (cards, inputs, sidebar, help banner); search input uses a slightly darker/navy border for prominence.
- **Shadows**: essentially flat design — at most a whisper-soft shadow under cards; hierarchy is carried by borders + background bands (white header vs `#F5F6F8` body).
- **No gradients, no glassmorphism, no overlays.** Sidebar active state = left 3px blue accent bar + tinted row.
- Dividers: color-band changes (navy/white/gray) act as section dividers instead of rules.

## 7. Imagery & iconography

- **No photography at all** — this page relies on **real institution logos** (ANAPI, FEC, FPI, ARSP, DGI, OCC) rendered small and roughly monochrome/desaturated inside cards. In production these would need consistent treatment (grayscale filter or fixed-height containment) since source logos vary wildly.
- **Logo mark**: DRC map silhouette filled with flag-blue, yellow diagonal band, red star accent.
- **BrandsBridge mark**: pink/blue geometric diamond, appears twice (header + footer).
- **Icon style**: thin **line icons**, rounded caps, ~1.5px stroke, navy/gray — sidebar category icons (bank, chart, document, people, shield, pin, globe, scales, graduation cap), pin icons on cards, magnifier, help-banner building icon. Social icons are line glyphs inside 1px circular outlines.
- Breadcrumb separators are small solid blue triangles (play-button style) — an unusual, slightly dated choice.

## 8. Content & copy

Language: **English** (site is EN/FR; this artboard shows EN). Tone: institutional, service-oriented, reassuring.

Key strings (verbatim, including typos):
- H1: "Navigate the DRC Business Environment with the Right Institutional Contacts"
- Sub: "Access essentiel orientation on public agencies, professional organizations chambres and other support structures relevant to investment and commercial activity in the DRC." — **note customer typos: "essentiel", "chambres" (French bleed-through)**
- Cards: ANAPI "Facilitates and promotes investment in the DRC through incentives and investor support services."; FEC "Federation of Enterprises of Congo representing the private sector."; FPI "Promotes a business-friendly climate and facilitates investments in the DRC."; ARSP "Authority for Regulation of the Subcontracting in the Private Sector."; DGI "Direction Générale des Impôts in charge of tax administration."; OCC "Office Congolais de Contrôle ensuring conformity and quality."
- All locations: "Kinshasa". Link: "View Contact Details →".
- Banner: "Need help navigating the DRC business environment?" / "Our team can connect you with the right institution or support service." / "Request Guidance".
- Footer mission: "Trade in DRC is your gateway to verified local business contacts, market opportunities and strategic partnerships across the Democratic Republic of Congo."
- Sub-footer: "© 2024 Trade in DRC. All rights reserved." / "Trade in DRC – Connecting international business with local opportunities." / "www.tradeindrc.com"
- Header: "Power by BrandsBridge Group" — **typo: should be "Powered by"**.

## 9. UX assessment

**Works well:**
- Classic, instantly scannable directory pattern (sidebar filters + card grid); category badges give at-a-glance classification and the color-coding (green=promotion, purple=support/regulation, amber=fiscal/quality) is a nice secondary scent.
- Clear single terminal CTA per card ("View Contact Details") and a well-placed fallback path (help banner) for users who don't know which institution they need — good funnel thinking.
- Search + category dropdown duplicated at top-right mirrors the sidebar for mobile-friendly filtering.
- Strong section rhythm via navy/white/gray banding; brand colors used with restraint on an inner page.

**Risky / needs fixing:**
- **Copy errors** ("essentiel", "chambres", "Power by") must be corrected; FR bleed-through suggests the FR version is the source.
- Dual CTAs in nav (orange + blue pills) compete; orange wins visually — confirm that "Register Your Company" is truly primary.
- **Contrast**: 9–10px gray descriptions and badge text will fall below WCAG AA at real sizes; bump to ≥12px/`#4B5563`. Purple and amber badge text on tinted bgs needs a contrast check.
- Redundant filtering (dropdown + sidebar) can desync; pick one source of truth in state.
- Institution logos at varied aspect ratios risk visual chaos — enforce a fixed logo box with `object-contain` + grayscale.
- All six cards say "Kinshasa" — location adds no differentiation yet; fine when provincial entries exist (sidebar has "Provincial Support").
- Breadcrumb triangle separators and the boxy dropdown caret feel dated vs. the rest; swap for chevrons.
- No pagination/result-count shown — needed once the directory exceeds 6 entries.

## 10. Mapping to TradeInDRC site

**Route**: no existing route matches 1:1. Closest conceptual home: a new public route `src/app/[locale]/contacts/institutional/page.tsx` (or `/local-contacts/institutional`), added to `NAVIGATION_CONFIG` under a new "Local Contacts" top-level item (the design's nav shows Local Contacts as its own item). The existing `companies` directory page shares the same sidebar+grid pattern and can be the implementation template.

**Data**: new `institutions` table in Supabase (name, acronym, logo_url, category enum, description_en/description_fr, city, contact fields), RLS public-read — mirrors `companies`/`sectors` conventions in `supabase/migrations/`. Categories map to the 10 sidebar filters.

**Implementation notes (Tailwind/shadcn):**
- Bands: nav/breadcrumb/footer `bg-[#0B2240]`; body band `bg-muted/50`; cards `rounded-lg border bg-card` (flat, no shadow) per the compact-card memory preference.
- Sidebar: shadcn `ToggleGroup`/custom list with `data-active` left border `border-l-2 border-primary`; sync with the top `Select` (shadcn) via one Zustand/URL-param state (`?category=`).
- Cards: CSS grid `grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4`; badge = shadcn `Badge` with variant tints (`bg-emerald-50 text-emerald-700`, `bg-violet-50 text-violet-700`, `bg-amber-50 text-amber-700`); logo in `h-10 w-20 object-contain grayscale`.
- Search: reuse the existing search-context pattern or a local `Input` with debounced client filter; register institutions in `search-registry.ts` for Cmd+K.
- Help banner: full-width `rounded-lg border bg-muted` flex row; button `bg-[#0B2240]` linking to the existing `/request` page ("Request Guidance" maps naturally onto the already-built Request feature).
- Breadcrumb: shadcn `Breadcrumb` with `ChevronRight`, current item `text-amber-500` — on the navy strip, ensure white/amber contrast.
- Motion: per MOTION.md — card hover lift ≤180ms, staggered grid mount ≤300ms, nothing else.
- i18n: all copy through next-intl keys with corrected EN ("essential", "chambers", "Powered by") and proper FR variants; badges + categories bilingual.
