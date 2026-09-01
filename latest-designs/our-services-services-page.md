# Our Services (source: Our services.ai)

## 1. Page identification & purpose

This is the **"Our Services" page** — a full services landing page for Trade in DRC, labeled at the top of the artboard as a "WEB PAGE PROPOSAL". The mockup's own header nav shows "Services" as the active item (underlined in orange/yellow), confirming the page identity beyond doubt.

Intent: position Trade in DRC not just as a directory but as a **paid business-support platform** ("A business support platform helping companies access opportunities in the DRC" — top-right callout). The page sells 7 concrete facilitation services, funnels the visitor into a detailed **"Request a Service" lead-capture form**, and reinforces credibility via audience segmentation ("Who We Serve"), a 12-sector coverage strip, and a 4-step "How It Works" process. The whole page is a conversion machine: two "Request a Service" CTAs above the fold, plus the embedded form mid-page.

Notably the footer brands the operator as **"BrandsBridge Group SARL"** ("Powered by BrandsBridge Group" under the logo) — the commercial entity behind the portal.

## 2. Layout & grid

Single scrolling page, boxed content (large white rounded canvas floating on a light-gray page background, with a diagonal dark-blue wedge behind the lower-left of the canvas — a decorative frame device, not part of the page itself).

Section order top-to-bottom:

1. Sticky-style top navbar (logo left, 6 links center, pill CTA right)
2. Hero — 2 columns: text/CTAs left (~45%), photo-collage right (~55%)
3. Services grid — row of 4 cards + row of 3 wider cards (7 services)
4. Two-column band: "Request a Service" form (~66%) + "Who We Serve" panel (~33%)
5. "Strategic Sectors We Cover" — 1 row of 12 small chips
6. "How It Works" — label left + 4 numbered steps with dotted-arrow connectors
7. Footer — single dark-blue bar with company name + contact line

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

Density is **high but organized** — matches the customer's stated preference (compact cards, info density). Whitespace lives inside cards (generous internal padding) rather than between sections; section gaps are tight (~24–32px equivalent). Everything is left-aligned inside cards except centered content in the 4-up service cards. The 3-wide service row uses icon-left/content-right cards (horizontal), the 4-up row uses icon-top centered cards (vertical) — a deliberate rhythm change.

## 3. Color palette

| Color | Best-guess hex | Usage |
|---|---|---|
| Royal/navy blue | `#1B3B8F` – `#1E40AF` | H1 "Our Services", nav CTA button, "Request a Service" hero button, Submit button, footer bar, icon glyphs, step-number circles, decorative wedge behind canvas |
| Deep navy (darker) | `#122B6B` | "Trade in" wordmark, headings, dark text accents |
| DRC red | `#D22730` – `#DC2626` | "DRC" in wordmark, "opportunities" highlight word, required-field asterisks, "How It Works" underline, red diagonal in flag map |
| DRC yellow/gold | `#F5C518` / `#F7B500` | Star + diagonal stripe in flag map, active-nav underline (orange-leaning `#F59E0B`) |
| Sky/flag blue | `#4E7FD0` / `#3B82F6` | DRC map fill, logo bars |
| Light blue tint | `#EEF3FB` / `#EFF6FF` | Icon-circle backgrounds, "Who We Serve" panel bg, form section bg, sector chips bg |
| White | `#FFFFFF` | Card fills, main canvas, nav bar |
| Page gray | `#E9EBEF` | Outer page background |
| Body text gray | `#4B5563` | Paragraphs, card descriptions |
| Border gray | `#D1D5DB` | Input borders, card hairlines |

Brand logic: **explicit DRC flag palette** — sky blue, red, yellow star/stripe — used for identity moments (logo, map, highlights), while a corporate royal blue carries all interactive/structural weight. Red is rationed to emphasis words and required marks; yellow only for the flag and active-nav underline. This matches the existing site's brand direction and the memory note "brand-color CTAs, light theme".

## 4. Typography

- One family throughout: a **geometric/humanist sans** with slightly rounded terminals (reads like Nunito Sans / Manrope / Gilroy; comfortably substitutable with the project font).
- H1 "Our Services": very heavy (ExtraBold/Black), title case, deep blue, ~48–56px equivalent — the largest text on the page after the proposal masthead.
- Section headings ("Request a Service", "Who We Serve", "Strategic Sectors We Cover", "How It Works"): Bold, ~20–24px, dark navy, title case. "How It Works" gets a short red underline accent.
- Card titles: SemiBold ~15–16px, numbered ("1. Partner Search" … "7. Delegation Organization").
- Body/descriptions: Regular ~13–14px, gray, 1.4–1.5 line-height, 2–3 lines per card.
- Form labels: SemiBold ~13px dark with red `*`; placeholders light gray Regular.
- Nav links: Medium ~14px; active link bolder + orange underline.
- Buttons: SemiBold white on blue.
- No serif, no all-caps anywhere; casing is consistently Title Case for headings, sentence case for body.

## 5. Components

- **Navbar**: white bar, left logo lockup (DRC map glyph + "Trade in DRC" + tiny "Powered by BrandsBridge Group"), 6 center links (Home, Market, Opportunities, Companies, Services, Contact), right solid-blue rounded-rect CTA "Request a Service" (~8px radius). Active state = orange underline bar.
- **Hero**: left text block (H1, 3-line paragraph, two buttons: primary solid blue with white arrow icon, secondary white with blue border/text "Explore Solutions", both ~8px radius, ~44px tall). Right: photo collage — DRC map silhouette filled with flag graphic overlapping a photograph of three professionals at a laptop against a skyline, faint white network-node lines over the sky.
- **Service cards (row 1, 4-up)**: white cards, ~12px radius, hairline border + very soft shadow, centered layout: light-blue circle (~64px) with navy line-style icon, numbered bold title, 3-line gray description. Icons: person+magnifier, bank/institution, shield-check, two people at table.
- **Service cards (row 2, 3-up, wider)**: same skin, horizontal layout — icon circle left, title + description right. Icons: bar chart, person avatar, airplane.
- **Request a Service form**: on a very light blue rounded panel; small clipboard icon + heading + one-line subcopy; 3-column input grid — Row 1: Full Name*, Company*, Country* (select); Row 2: Email*, WhatsApp / Phone*, Sector of Interest* (select); Row 3: Service Needed* (select), Preferred Location in the DRC (select), Expected Timeline (select); full-width Detailed Message textarea; left-aligned solid-blue submit "Submit Service Request" with paper-plane icon; beside it a padlock icon + reassurance line "Your information is secure and will only be used to process your service request." Inputs: white fill, 1px gray border, ~8px radius, ~44px tall, chevrons on selects.
- **Who We Serve panel**: light-blue rounded panel, heading with small people icon, 4 stacked items each = solid navy filled circle icon (globe, people, bar chart, bank) + bold navy title + 2-line gray description, thin divider between items. Audiences: International Companies, Congolese Companies, Investors, Institutions.
- **Sector chips (12)**: small white rounded-rect chips in one row, each = tiny circular icon + 2-line label. Labels: Mining & Critical Minerals, Energy & Power, Agriculture & Agro-processing, Infrastructure & Construction, Digital Economy & ICT, Logistics & Transport, Healthcare & Pharmaceuticals, Finance & Professional Services, Tourism & Hospitality, Oil & Gas, Manufacturing & Industry (12 chips drawn; one repeats/reads small).
- **How It Works**: white rounded band; label block left ("How It Works", red underline); 4 steps, each = solid navy numbered badge circle (1–4) + line icon (clipboard, magnifier, people, handshake) + bold title + 2-line caption; dashed-arrow connectors between steps. Steps: "Submit your service request" → "Request review" → "Business connection" → "Solution delivery".
- **Footer**: single dark-navy bar, ~16px radius corners, left = BrandsBridge multicolor mark + "BrandsBridge Group SARL" bold white; right = inline contact row with white line icons: "Kinshasa, DRC · sales@brandsbridgecd.com · +243 811 835 930 · www.brandsbridgecd.com"; faint dotted world-map texture on the right side.

## 6. Borders, radii, shadows & effects

- Radius system: ~8px inputs/buttons/chips, ~12–16px cards and panels, ~16–24px on the big canvas and footer bar. No pill shapes except icon circles.
- Strokes: 1px light-gray hairlines on cards and inputs; secondary button uses a 1.5px blue stroke.
- Shadows: extremely soft, low-elevation (`0 1px 3px rgba(0,0,0,.06)` feel) on cards; the whole page canvas floats with a slightly larger soft shadow. No heavy drop shadows.
- Dividers: thin gray rules between "Who We Serve" items; dashed connectors in How It Works.
- No gradients on UI surfaces (flat fills); the only "effects" are the photographic collage, the faint network-line overlay on the hero, and the dotted-globe texture in the footer. No glassmorphism.

## 7. Imagery & iconography

- **One photo**: three business professionals (two men, one woman) collaborating over a laptop, shot against a high-rise city skyline; natural color, no duotone; masked with soft edges and overlapped by the vector DRC map. Faint white constellation/network lines drawn over the sky suggest connectivity.
- **DRC map silhouette** filled with the national flag (sky blue field, yellow star upper-left, red diagonal band with yellow fimbriation) — the hero's brand anchor.
- **Footer texture**: halftone-dot world map in lighter blue on the navy bar.
- **Icon style**: consistent **line icons, medium stroke, rounded joins**, always navy, always inside circles — light-blue tinted circles for service cards/form/steps, solid navy circles for "Who We Serve" and step numbers. Maps cleanly to Lucide.

## 8. Content & copy

Language: **English only** (FR version implied by the bilingual site). Tone: corporate, confident, benefit-led, short sentences.

Key strings (verbatim, including typo):
- Masthead: "WEB PAGE PROPOSAL" / "Trade in DRC" / "Services for Market Access, Business Growth and Strategic Partnerships." / "A business support platform helping companies access **opportunities** in the DRC."
- Hero: "Our Services" — "**Pratical** support for companies and institutions seeking to operate, partner or expand in the Democratic Republic of Congo." (note: "Pratical" is a typo for "Practical") — buttons "Request a Service", "Explore Solutions".
- Services: 1. Partner Search ("Identify relevant local or international partners based on your sector and objectives."), 2. Market Entry Support ("Receive local guidance and strategic support to enter the DRC market with clarity."), 3. Business Verification ("Reduce uncertainty by checking the credibility and profile of potential business partners."), 4. B2B Meeting Facilitation ("Connect with suppliers, investors, institutions and decision-makers through structured meetings."), 5. Market Reports ("Access sector intelligence, market briefs and customized business insights."), 6. Local Representation ("Build a credible local presence through business facilitation and representation support."), 7. Delegation Organization ("Organize business missions, conferences, visits and partnership programs.").
- Form: "Tell us what you need. Our team will connect you with the right experts and solutions." + fields listed in §5 + "Submit Service Request" + "Your information is secure and will only be used to process your service request."
- Footer: "BrandsBridge Group SARL — Kinshasa, DRC — sales@brandsbridgecd.com — +243 811 835 930 — www.brandsbridgecd.com".

## 9. UX assessment

**Works well**
- Clear conversion funnel: hero CTA → 7 services (what you buy) → form (buy it) → proof strips (why trust us). CTA repeated 3× with identical label — good consistency.
- Strong, restrained palette; flag colors used for identity, one blue for all actions — scannable and on-brand for a government-adjacent portal.
- The 4+3 card rhythm avoids a monotonous 7-item grid; numbering the services makes the offering feel like a defined catalog.
- Security reassurance line next to submit is a smart trust cue for an African B2B audience wary of forms.

**Risky / needs fixing**
- **Copy typo** "Pratical" must be corrected; "WhatsApp / Phone" label is good local UX but needs input validation strategy.
- **12 sector chips in one row** will not survive responsive layout — labels are already near-illegible at mockup scale; needs wrap to 2 rows or horizontal scroll on mobile.
- 9-field form (7 required) is heavy for a first touch; risk of abandonment. Consider progressive disclosure (service picker first) or marking fewer required.
- Contrast: gray body text on white is fine, but small gray captions in How It Works and chip labels flirt with WCAG AA at rendered sizes; placeholder-gray on white inputs is below AA (placeholders exempt, but labels must carry meaning).
- Text-on-image is avoided entirely (good), but the hero photo + map collage will need careful art direction to reproduce; the network-line overlay is decorative and should be subtle or dropped.
- Active-nav orange underline is the only yellow/orange UI use — either commit to it as the "active" token or use brand yellow consistently.
- Form has no visible success/error states in the mock — must be designed (Sonner toasts per project convention).
- "How It Works" dashed arrows imply linear progress; ensure it doesn't render as interactive.

## 10. Mapping to TradeInDRC site

**Route**: this is a new **`/[locale]/services`** page (nav item "Services" doesn't exist yet in `NAVIGATION_CONFIG` — mock nav shows Home / Market / Opportunities / Companies / Services / Contact, a simplified nav vs. the current mega-menu). The embedded form overlaps heavily with the existing **`/request` page** (customer batch 2026-06-04, migration 00022 `service_requests`-style table) — reuse that submission pipeline rather than building a second one; the services page form can POST to the same backend with `service_needed` mapping to the 7 catalog items.

Implementation notes (Tailwind v4 / shadcn):
- **Hero**: 2-col grid (`lg:grid-cols-2`), H1 `text-5xl font-extrabold text-primary`; buttons = shadcn `Button` (default + `variant="outline"`). Map+photo collage: pre-compose as a single optimized image asset (or SVG map + `next/image` photo with mask) — don't attempt live layering of 3 elements.
- **Service cards**: `Card` with `rounded-xl border shadow-sm`; row 1 `grid md:grid-cols-2 xl:grid-cols-4` centered content; row 2 `grid lg:grid-cols-3` with `flex-row` icon-left variant. Icons: Lucide (`UserSearch`, `Landmark`, `ShieldCheck`, `Users`, `BarChart3`, `UserRound`, `Plane`).
- **Form**: shadcn `Form` + `Input`, `Select`, `Textarea` on a `bg-blue-50/50 rounded-2xl` panel; 3-col `md:grid-cols-3` collapsing to 1 col; sector select fed from existing `sectors` taxonomy (already i18n'd EN/FR/TR/ZH/ES); DRC provinces list for "Preferred Location". Zod validation, React Query mutation, `toast.loading → success` per NON_BLOCKING_UX.
- **Who We Serve**: aside panel `bg-blue-50 rounded-2xl divide-y`; on mobile stack below the form.
- **Sector chips**: reuse existing sector taxonomy + icons; `flex flex-wrap gap-2` (2 rows on desktop, wrap on mobile) — do NOT force one row.
- **How It Works**: 4-col grid with CSS dashed connectors (`border-t border-dashed` pseudo-elements), hidden on mobile stack.
- **Footer**: the mock's single-bar BrandsBridge footer is proposal framing — keep the site's existing global footer; optionally add a "Powered by BrandsBridge Group" credit line if the customer confirms.
- **Motion**: per `docs/MOTION.md` — staggered card fade-up ≤300ms on section enter, hover lift ≤180ms on service cards, nothing on the form.
- **i18n**: all strings into `src/config/messages/{en,fr}.json` under a `services` namespace; fix "Pratical" → "Practical" and confirm FR copy with customer.
- Colors map to existing tokens: primary blue ≈ current brand primary; add `--flag-yellow #F5C518` and `--flag-red #DC2626` accents only where the design uses them.
