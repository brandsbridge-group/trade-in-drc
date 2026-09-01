# Our Services — design "our-services" vs current app

## Sources

- **Design PDF**: `/private/tmp/claude-501/-Users-mehmetsemihbabacan-dev-work-lumio-studio-web-apps-tradeindrc/b6d766d1-9bf6-4b52-91a1-35a1a9770c78/scratchpad/designs/Our services.pdf` (viewed visually, rendered to PNG)
- **Analysis md**: `/Users/mehmetsemihbabacan/dev/work/lumio-studio/web-apps/tradeindrc/latest-designs/our-services-services-page.md`
- **App routes / components** (closest equivalents — there is **no public `/services` route**):
  - `src/app/[locale]/(public)/request/page.tsx` — the `/request` page (hero, Who Is This For, How It Works)
  - `src/components/requests/request-intents-and-form.tsx` — intent-card grid + form orchestration
  - `src/components/requests/business-request-form.tsx` — the 10-field request form (`BUSINESS_INTENTS`)
  - `src/app/[locale]/(public)/request/actions.ts` — submission action (accepts service-style intent values)
  - `src/app/[locale]/dashboard/services/page.tsx` — **different concept** (a company's own service listings CRUD, not this page)
  - `src/config/navigation.ts` — nav config (no "Services" item; "Request a Service" lives at `/request`)

## THE DESIGN SPEC

Single scrolling page, light theme, boxed white canvas on `#E9EBEF` gray with a decorative navy diagonal wedge behind the lower-left. Corporate royal blue (`#1B3B8F`–`#1E40AF`) carries all structure/CTAs; DRC flag colors (sky `#4E7FD0`, red `#DC2626`, yellow `#F5C518`) appear only in identity moments. One rounded sans family. Radii: ~8px inputs/buttons/chips, ~12–16px cards, ~16–24px canvas/footer. Shadows extremely soft (`0 1px 3px rgba(0,0,0,.06)` feel). Line icons, navy, always inside circles.

```
+--------------------------------------------------------------+
| [Logo]        Home Market Opportunities Companies            |
|               Services* Contact          [Request a Service] |
+--------------------------------------------------------------+
| OUR SERVICES (h1, blue)        |  [DRC-flag map shape +      |
| paragraph                      |   photo: 3 people meeting,  |
| [Request a Service ->][Explore |   city skyline backdrop]    |
|  Solutions]                    |                             |
+--------------------------------------------------------------+
| [1 Partner ] [2 Market  ] [3 Business ] [4 B2B Meeting ]     |
| [  Search  ] [  Entry   ] [ Verif.    ] [ Facilitation ]     |
|   [5 Market Reports]  [6 Local Repr.]  [7 Delegation Org.]   |
+--------------------------------------------------------------+
| REQUEST A SERVICE (form)          | WHO WE SERVE             |
|  [Full Name][Company ][Country v] |  o International Cos     |
|  [Email    ][Phone   ][Sector  v] |  o Congolese Cos         |
|  [Service v][Locationv][Time   v] |  o Investors             |
|  [Detailed Message textarea     ] |  o Institutions          |
|  [Submit Service Request]  lock+  |                          |
|                        privacy    |                          |
+--------------------------------------------------------------+
| STRATEGIC SECTORS WE COVER                                   |
| [12 small icon chips in one row]                             |
+--------------------------------------------------------------+
| How It   (1) Submit --> (2) Review --> (3) Connect --> (4)   |
| Works        request        req.          business    Deliver|
+--------------------------------------------------------------+
| ███ BrandsBridge Group SARL | Kinshasa · email · tel · web   |
+--------------------------------------------------------------+
```

### Section 1 — Navbar
White bar. Left: logo lockup — DRC map glyph + "Trade in DRC" + tiny "Powered by BrandsBridge Group". Center: 6 links **Home · Market · Opportunities · Companies · Services · Contact**; active "Services" gets a bold **orange underline** (`~#F59E0B`). Right: solid navy rounded-rect (~8px) CTA **"Request a Service"**. Simplified flat nav — no mega-menu.

### Section 2 — Hero (2 columns, white background)
- Left (~45%): H1 **"Our Services"** — ExtraBold, deep blue, ~48–56px. Sub: *"Pratical support for companies and institutions seeking to operate, partner or expand in the Democratic Republic of Congo."* (note the design's typo "Pratical"). Two ~44px buttons, ~8px radius: primary solid navy **"Request a Service →"** and outlined white/blue **"Explore Solutions"**.
- Right (~55%): photo collage — **DRC map silhouette filled with the national flag** (sky-blue field, yellow star, red diagonal with yellow fimbriation) overlapping a **photograph of three professionals at a laptop** against a city skyline, faint white network-node lines over the sky. This is the page's brand anchor.

### Section 3 — 7 numbered service cards (4-up row + 3-up row)
White cards, ~12px radius, hairline border, very soft shadow. Row 1 (vertical/centered, ~64px light-blue icon circle with navy line icon):
1. **Partner Search** — "Identify relevant local or international partners based on your sector and objectives." (person+magnifier)
2. **Market Entry Support** — "Receive local guidance and strategic support to enter the DRC market with clarity." (bank)
3. **Business Verification** — "Reduce uncertainty by checking the credibility and profile of potential business partners." (shield-check)
4. **B2B Meeting Facilitation** — "Connect with suppliers, investors, institutions and decision-makers through structured meetings." (two people at table)

Row 2 (wider, horizontal icon-left):
5. **Market Reports** — "Access sector intelligence, market briefs and customized business insights." (bar chart)
6. **Local Representation** — "Build a credible local presence through business facilitation and representation support." (avatar)
7. **Delegation Organization** — "Organize business missions, conferences, visits and partnership programs." (airplane)

The numbering ("1. …" – "7. …") frames the offering as a defined paid catalog. The 4+3 rhythm (vertical then horizontal cards) is deliberate.

### Section 4 — Request a Service form (~66%) + Who We Serve (~33%)
- **Form** on a very light-blue rounded panel (`#EEF3FB`-ish, ~16px radius). Clipboard icon + heading **"Request a Service"** + subcopy *"Tell us what you need. Our team will connect you with the right experts and solutions."* 3-column grid of ~44px white inputs (1px gray border, 8px radius), labels SemiBold with red `*`:
  - Row 1: **Full Name\*** · **Company\*** · **Country\*** (select)
  - Row 2: **Email\*** · **WhatsApp / Phone\*** · **Sector of Interest\*** (select)
  - Row 3: **Service Needed\*** (select) · **Preferred Location in the DRC** (select) · **Expected Timeline** (select)
  - Full-width **Detailed Message** textarea ("Please describe your request, objectives and any specific details…")
  - Left-aligned navy **"Submit Service Request"** button with paper-plane icon; beside it a **padlock + trust line**: *"Your information is secure and will only be used to process your service request."*
- **Who We Serve** panel: light-blue rounded panel, people icon + heading, 4 stacked rows with **solid navy filled circle icons** (globe/people/chart/bank), thin dividers: **International Companies** ("Enter the DRC market with trusted local intelligence and connections."), **Congolese Companies** ("Increase visibility and connect with international buyers, investors and partners."), **Investors** ("Discover structured opportunities across strategic sectors in the DRC."), **Institutions** ("Promote sectors, programs and national business opportunities through a structured ecosystem.").

### Section 5 — "Strategic Sectors We Cover"
Heading + **12 small white chips in one row**, each = tiny circular icon + 2-line label: Mining & Critical Minerals, Energy & Power, Agriculture & Agro-processing, Infrastructure & Construction, Digital Economy & ICT, Logistics & Transport, Healthcare & Pharmaceuticals, Finance & Professional Services, Tourism & Hospitality, Oil & Gas, Manufacturing & Industry (12 chips drawn).

### Section 6 — "How It Works"
White rounded band. Left label block "How It Works" with **short red underline**. 4 steps, each = solid navy numbered badge (1–4) + line icon (clipboard/magnifier/people/handshake) + bold title + 2-line gray caption, **dashed-arrow connectors** between steps: **Submit your service request → Request review → Business connection → Solution delivery** ("Receive tailored support and results to achieve your objectives.").

### Section 7 — Footer
Single **dark-navy bar** with rounded corners: BrandsBridge multicolor mark + **"BrandsBridge Group SARL"** bold white; inline contact row with white line icons: *Kinshasa, DRC · sales@brandsbridgecd.com · +243 811 835 930 · www.brandsbridgecd.com*; faint halftone-dot world-map texture right.

Purpose of the whole page: a conversion machine for the paid facilitation catalog — hero CTA → 7 services → form → trust strips. "Request a Service" repeated 3×.

## Element-by-element scorecard

| Design element | Visual spec (short) | In app? | Where in app | How the app version differs |
|---|---|---|---|---|
| Public `/services` route + "Services" nav item | dedicated page, orange active underline | ❌ | — (`src/config/navigation.ts` has no Services entry) | No route exists; `/dashboard/services` is company service-listings CRUD, unrelated |
| Navbar "Request a Service" CTA | solid navy rounded button, top-right | 🟡 | `src/config/navigation.ts` line 38 (`/request`) | Nav links to `/request` but the app nav is a mega-menu, not the design's flat 6-link bar |
| Hero H1 "Our Services" + subcopy | ExtraBold deep blue on white, left column | 🟡 | `request/page.tsx` hero (`hero.title` = "Tell Us What You Are Looking For") | Different title/copy; white text on a dark photo scrim, not blue-on-white |
| Hero CTA pair "Request a Service →" / "Explore Solutions" | solid navy + blue-outline, 8px radius | 🟡 | `request/page.tsx` (`hero.submitCta`/`exploreCta` = "Submit Business Request"/"Explore Options") | Same 2-button pattern, but `variant="secondary"` (white) + ghost outline on dark photo — inverted color scheme, different labels |
| DRC flag-map + photo collage + network lines | flag-filled map silhouette over skyline photo | 🟡 | `request/page.tsx` full-bleed `HERO_IMAGE` with slate gradient scrim | Photo exists but as dark full-bleed background; no DRC flag-map silhouette, no network-line overlay — the design's signature brand moment is absent |
| 7 numbered service cards, 4-up + 3-up rhythm | white 12px-radius cards, light-blue icon circles, "1."–"7." titles | 🟡 | `request-intents-and-form.tsx` intent grid (`BUSINESS_INTENTS`, 8 items, uniform 4-col) | App renders 8 *intents* (Find a Local Partner, Invest, Sell, Buy, Publish an Opportunity, Register My Company, Market Report, Business Mission) — only ~3 overlap the design's 7 catalog services; no numbering, no 4+3 rhythm, cards are left-aligned selectable buttons not a display catalog |
| Service copy for Market Entry Support / Business Verification / B2B Meeting / Local Representation / Delegation | numbered catalog entries | 🟡 | `en.json` `Request.intents.*` keys + `actions.ts` accepts the values | Translations & backend enum exist but these intents are **not rendered** in the grid — invisible to users |
| Request form: Full Name\*, Company\*, Country\*, Email\*, WhatsApp / Phone\*, Sector of Interest\*, Service Needed\*, Preferred Location in the DRC, Expected Timeline, Detailed Message | 3-col grid, 44px inputs, red asterisks, light-blue panel | ✅ | `business-request-form.tsx` | Near 1:1 field parity (labels "WhatsApp / Phone", "Preferred Location in the DRC", "Expected Timeline" match verbatim; "Service Needed" is "I am looking for"); panel is white `rounded-2xl`, not light-blue; inputs `h-9` (compact) vs design's ~44px |
| Submit button "Submit Service Request" + paper-plane | left-aligned solid navy | 🟡 | `business-request-form.tsx` (`form.submit` = "Submit Business Request") | Wording differs ("Business" vs "Service"); primary-blue matches |
| Padlock + security reassurance line | gray text next to submit | ✅ | `form.securityNote` in `en.json` | Wording slightly differs ("…connect you with relevant opportunities" vs "…process your service request") |
| Public (no-login) submission | design implies open lead form | ❌ | `business-request-form.tsx` line 122 gates on `useAuth()` user | App requires sign-in (`Request.signInRequired.*`) — a real conversion-funnel divergence from the design |
| Who We Serve panel (4 audiences) | light-blue panel, solid navy circle icons, dividers | ✅ | `request/page.tsx` `WHO_ITEMS` aside | Same 4 audiences + same icon set (Globe/Building/Users/Landmark); white card with `bg-primary/10` tinted square icons instead of light-blue panel + solid navy circles; different descriptions; heading "Who Is This For?" vs "Who We Serve" |
| Strategic Sectors We Cover — 12 icon chips | one row of small white chips | ❌ | — (no `strategicSectors` anywhere in `src/`) | Entirely absent from the page (sector taxonomy exists in DB/`/sectors`, but no chip strip here) |
| How It Works — 4 steps, dashed arrows, red underline | navy numbered badges + line icons + connectors | 🟡 | `request/page.tsx` `STEPS` (ClipboardList/Search/Handshake/Sprout) | 4-step grid exists with matching step 1–3 titles ("Submit…", "Request Review", "Business Connection"); step 4 is "Partnership Development" vs "Solution delivery"; no numbered navy badges, no dashed-arrow connectors, no red underline on heading |
| Footer — BrandsBridge Group SARL bar | single navy bar, contact line, dot-map texture | ❌ | — (no "BrandsBridge" string in `src/`) | App uses its own global multi-column footer; zero BrandsBridge branding anywhere |
| "Powered by BrandsBridge Group" logo credit | tiny line under logo | ❌ | — | Absent |

## ❌ Design elements the app lacks entirely

**Routing / IA**
- Public `/[locale]/services` route + "Services" nav item — implies a new page + `NAVIGATION_CONFIG` entry (no new backend).
- BrandsBridge Group SARL branding (footer bar, "Powered by" credit, contact line sales@brandsbridgecd.com / +243 811 835 930) — pure content; needs customer confirmation since it rebrands the operator.

**Hero identity**
- DRC flag-filled map silhouette + skyline-photo collage with network-line overlay — needs one composed image asset (or SVG map + masked photo).

**Service catalog**
- The numbered 7-service display catalog (4 of the 7 services — Market Entry Support, Business Verification, B2B Meeting Facilitation, Local Representation — are never rendered; their i18n keys and `actions.ts` enum values already exist, so this is UI-only).

**Trust strips**
- "Strategic Sectors We Cover" 12-chip strip — data already exists in the `sectors` taxonomy (i18n'd); UI-only.

**Open funnel**
- Anonymous form submission (design has no auth gate) — implies relaxing the sign-in requirement in `business-request-form.tsx` / RLS policy on the requests table.

## 🎨 Visual-language delta

- **Hero mood inverted**: the design is a *light* hero — blue headline on white with the photo contained in the right column behind the flag map. The app's `/request` hero is a *dark* full-bleed photo with a slate scrim and white text. Same content skeleton, opposite atmosphere; the DRC-flag identity moment is missing.
- **Panel tinting**: the design leans on light-blue (`#EEF3FB`) panels for the form, Who We Serve and chips; the app uses plain white `rounded-2xl border` cards on `bg-muted/20`. The app is flatter/grayer; the design is warmer and more branded.
- **Icon treatment**: design = navy line icons inside *circles* (light-blue tint or solid navy); app = icons inside *rounded squares* (`rounded-lg bg-primary/10`). Consistent internally, but not the design's circle language.
- **Density**: app inputs are `h-9` compact (matches the customer's known compact preference) vs the design's roomier ~44px inputs; design cards have more internal padding.
- **Accent colors**: the design's DRC yellow (active-nav underline) and rationed red (asterisks, "How It Works" underline, highlight words) are absent from the app page — the app is monochromatically primary-blue.
- **Connectors/numbering**: the design's dashed step arrows and solid navy numbered badges are absent; the app's steps read as four plain cards.

## 🔷 App features the design omits (regression watch-list)

- **Intent-driven pre-selection UX**: clicking an intent card scrolls to and pre-fills the form — the design's cards are static display only.
- **8 broader intents** (Sell / Buy / Publish an Opportunity / Register My Company) beyond the 7 paid services — dropping them loses funnel breadth.
- **Auth-gated submissions** tied to user accounts (tracking, dashboard follow-up, `business_requests` ownership) — the design's anonymous form loses this unless deliberately relaxed.
- **Searchable CountryCombobox** and validated timeline enum keys — richer than the design's plain selects.
- **Mega-menu navigation, bilingual EN/FR (+TR/ZH/ES) strings, existing global footer** — the design shows a simplified nav and a BrandsBridge-only footer that would regress site-wide IA if adopted literally.

## Verdict

**matchScore: 38 / 100**

The design describes a dedicated public "Our Services" marketing page, and that page simply does not exist — there is no `/services` route, no "Services" nav item, no numbered 7-service catalog, no sector-chip strip, and no BrandsBridge footer. What saves the score is the `/request` page: its 10-field form is a near-verbatim implementation of the design's "Request a Service" form (down to "WhatsApp / Phone" and "Preferred Location in the DRC"), and Who We Serve and How It Works both exist in recognizable 4-item form. Visually, however, even the matching pieces diverge: dark photo hero instead of the blue-on-white hero with the flag-map collage, white cards instead of light-blue panels, rounded-square icons instead of circles, and no red/yellow accents. Four of the seven catalog services are already wired into i18n and the submission backend but never shown, so most of the gap is presentation-layer work on top of an existing pipeline — the biggest true functional deltas are the missing public route and the app's sign-in gate versus the design's open lead form.
