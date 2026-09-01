# Find a Local Partner (Request/Intake) — design 10 vs current app

## Sources

- Design PDF: `/private/tmp/claude-501/.../scratchpad/designs/10.pdf` (source `10.ai`, 1 artboard)
- Design analysis: `/Users/mehmetsemihbabacan/dev/work/lumio-studio/web-apps/tradeindrc/latest-designs/10-find-local-partner-request.md`
- App route: `src/app/[locale]/(public)/request/page.tsx` (server page, hero + sections)
- Server action: `src/app/[locale]/(public)/request/actions.ts` (Zod-validated insert into `business_requests`)
- Components: `src/components/requests/request-intents-and-form.tsx` (intent grid + layout), `src/components/requests/business-request-form.tsx` (form), `src/components/forms/country-combobox.tsx`
- i18n: `src/config/messages/en.json` → `Request.*` namespace
- Related route checked: `src/app/[locale]/(public)/rfq/page.tsx` (separate RFQ page — not this design)

## THE DESIGN SPEC

A single-scroll, **service-intake portal** page in the DRC-flag institutional palette: deep navy `#0B1F60` base, brand yellow `#F5A700` for actions, green `#16A34A` strictly for success, hairline `#D9DDE3` borders, flat cards (borders, not shadows), 4–8 px radii. One sans-serif family (Inter/Poppins-like), hierarchy by weight/size only.

```
┌────────────────────────────────────────────────────────────┐
│ ▓ logo "Trade in DRC"                Power by BrandsBridge │ topbar (navy)
├────────────────────────────────────────────────────────────┤
│ Home Companies Opportunities ... Contact  [Register][Req.] │ nav (white)
├────────────────────────────────────────────────────────────┤
│ ▓ Home › Find a Local Partner          ┌────────────────┐  │
│ ▓ FIND A LOCAL PARTNER IN THE DRC      │  photo:        │  │ hero (navy)
│ ▓ Tell us what your business needs...  │  handshake +   │  │
│ ▓ [Submit Your Need →][Browse Directory│  skyline       │  │
├────────────────────────────────────────┴────────────────┴──┤
│ [1] What do you need?   [2] Tell us about...  [3] Request  │
│ ┌────┐┌────┐            ┌─────────┐┌────────┐ Submitted    │
│ │Supp││Dist│            │Company* ││Contact*│ ┌──────────┐ │
│ ├────┤├────┤            │Country* ││Province│ │  ✓ green │ │
│ │Rep ││JV  │            │Website  ││Product*│ │ Thank you│ │
│ ├────┤├────┤            │Contact* ││Volume  │ │ TIDRC-.. │ │
│ │Prof││Inst│            │Email*   ││Timeline│ │ 3 bullets│ │
│ ├────┤├────┤            │Phone*   ││Detail  │ │[Submit  ]│ │
│ │Mkt ││Src │            │Sector*  ││Upload  │ │ Browse → │ │
│ └────┘└────┘            ☑☑☑☐ checkboxes      └──────────┘ │
│ ⓘ one primary need      🔒 info is secure...               │
├────────────────────────────────────────────────────────────┤
│ ▓ footer: logo/desc | Quick Links | Resources | Company    │
│ ▓ © 2024 ... | tagline | www.tradeindrc.com                │ (navy)
└────────────────────────────────────────────────────────────┘
```

### Section 1 — Topbar + nav (shared chrome)
Navy utility strip (logo + tri-color "Connect – Invest – Grow" tagline, "Power by BrandsBridge Group" right). White nav with 9 links (Home, Companies, Opportunities, Marketplace, Local Contacts, Market intelligence, Promote Your Business, Contact) + yellow "Register Your Company" + blue "Request a Partner" (this page's active CTA).

### Section 2 — Hero band (navy, ~25% of artboard)
- Breadcrumb "Home › Find a Local Partner" — "Home" in yellow, current in white.
- H1 white ~44–48 px: **"Find a Local Partner in the DRC"** (with a faint ghost-echo artifact behind it).
- Body: "Tell us what your business needs, Trade in DRC will help identity [sic] suitable local companies, representatives, distributors or service providers aligned with your project."
- CTAs: **yellow filled "Submit Your Need →"** (navy text, trailing arrow) + white 1 px-outline transparent "Browse the Directory First".
- Right ~45%: photo of two businessmen (one Black, one white) shaking hands over a river-city skyline; left edge feathered into the navy via gradient scrim.

### Section 3 — Three-step process row (white, the page's core)
Three unequal columns sharing a top baseline, each headed by a ~26 px **navy square badge with white bold number** (1/2/3) + bold heading + gray one-line subhead.

**Step 1 — "What do you need?"** (~28% width). *"Select the type of partner or contact you are looking for."* A **2×4 grid of 8 selectable tiles** (white, 1 px gray border, ~8 px radius, thin line icon + label): Find a Supplier / Find a Distributor / Find a Local Representative / Find a Joint-Venture Partner / Find a Professional Service Provider / Find an Institutional Contact / Enter the DRC Market / Source Products from the DRC. Below: ⓘ "You can select only one primary need per request." (single-select radio semantics).

**Step 2 — "Tell us about your business need"** (~42% width). *"Provide details so we can match you with the right local contacts."* White bordered form card, two sub-columns, **13 fields**:
- Left: Company Name*, Country* (select), Website (`www.yourcompany.com`), Contact Person* ("Full name"), Email*, Phone* (**country-code select `+1` + `(555) 123-4567`**), Sector* (select).
- Right: Type of Contact Needed* (select), Target Province in DRC* (select), Product or Service of Interest*, Estimated Business Volume (USD) ("Select range"), Expected Timeline* (select), Detailed Requirement* (textarea), **Upload Supporting Document (Optional)** — dashed-border dropzone, cloud icon, "Click to upload or drag and drop — PDF, DOC, DOCX, PPTX (Max 10MB)".
- Inputs ~38 px, light-gray `#F7F8FA` fill, 1 px border, ~6 px radius.
- Below the card: **checkbox row** — 3 pre-checked green boxes "Verified companies only", "Arrange B2B meetings", "Market-entry support" + 1 unchecked "Sponsorship interest".
- Centered micro-footnote: 🔒 "Your information is secure and will only be used to match you with relevant local partners."

**Step 3 — "Request Submitted"** (~24% width). *"Your request has been received successfully."* Pale-green `#EFF8F1` card, green 1 px border, ~10 px radius: centered green check circle; bold "Thank you! Your business request has been submitted."; inset boxed **Request ID `TIDRC-PR-2025-000124`** in green mono-styled type; 3 icon bullets (person: "Our team will review your request and identify suitable local contacts." / envelope: "You will receive a confirmation email shortly." / clock: "We typically respond within 2–3 business days."); outlined button "Submit Another Request"; text link "Browse the Directory First →".

### Section 4 — Footer (navy)
Logo + 2-line gateway description; columns Quick Links / Resources / Company; BrandsBridge logo; 4 circular social icons (LinkedIn, Twitter, YouTube, Email); bottom strip © 2024 | tagline | www.tradeindrc.com.

## Element-by-element scorecard

| Design element | Visual spec (short) | In app? | Where in app | How the app version differs |
|---|---|---|---|---|
| Breadcrumb "Home › Find a Local Partner" | Yellow "Home", white current, in hero | ❌ | — | No breadcrumb on hero |
| H1 "Find a Local Partner in the DRC" | ~44–48 px bold white on navy | 🟡 | `request/page.tsx` L92 | Exists but reads "Tell Us What You Are Looking For" — generic intake framing, not partner-finding |
| Hero body copy | "Tell us what your business needs…" | 🟡 | `request/page.tsx` L95 | Different copy (opportunities/market-intelligence pitch) |
| Yellow "Submit Your Need →" CTA | `#F5A700` fill, navy text, arrow | 🟡 | `request/page.tsx` L99 | shadcn `secondary` variant + arrow ("Submit Business Request"); not brand yellow |
| Outline "Browse the Directory First" CTA | Transparent, 1 px white border | 🟡 | `request/page.tsx` L105 | Outline white ✅ but labeled "Explore Options" and anchors to intents, not the companies directory |
| Hero handshake photo, feathered into navy | Right 45%, navy→transparent scrim | 🟡 | `request/page.tsx` L79–89 | Full-bleed boardroom photo with slate-950 scrim; not a navy `#0B1F60` band, different image subject |
| Navy step badges 1 / 2 / 3 | ~26 px navy squares, white number | ❌ | — | No numbered 3-step columns; app uses a separate 4-step "How It Works" row with watermark numbers |
| Step 1: 8 need-type tiles, 2×4, single-select | White tiles, line icon, radio semantics | 🟡 | `request-intents-and-form.tsx` L73–115 | 8 selectable cards exist (1×4/2×4 responsive, `aria-pressed`, blue selected ring ✅) but the **taxonomy differs**: intents = Find a Local Partner / Invest / Sell / Buy / Publish an Opportunity / Register My Company / Market Report / Business Mission — not the design's 8 partner-contact types (Supplier, Distributor, Representative, JV, Professional, Institutional, Enter Market, Source Products) |
| ⓘ "only one primary need per request" note | Info line under grid | ❌ | — | Absent (single-select is enforced but unstated) |
| Form card, 2-column dense | White, 1 px border, gray inputs | ✅ | `request-intents-and-form.tsx` L120, `business-request-form.tsx` | Present: `rounded-2xl border bg-white p-6`, `sm:grid-cols-2` — radius larger (16 px vs 8 px), inputs white not gray-filled |
| Company Name* | Text input | 🟡 | form L184 | Present but **optional**, not required |
| Country* select | Chevron select | ✅ | form L193 (`CountryCombobox`) | Searchable combobox — richer than design |
| Website field | `www.yourcompany.com` | ❌ | — | No website field |
| Contact Person* | "Full name" | ✅ | form L174 (`fullName`) | Present, required |
| Email* | email input | ✅ | form L205 | Match |
| Phone* with country-code select | `+1` select + masked input | 🟡 | form L216 | Plain `tel` input, optional, no dial-code select |
| Sector* select | Required select | 🟡 | form L226 | Present (bilingual Supabase sectors ✅) but optional |
| Type of Contact Needed* select | Mirrors tile choice | 🟡 | form L244 (intent select) | Present + synced with cards ✅, but option set is business intents, not contact types |
| Target Province in DRC* | Select of DRC provinces | 🟡 | form L267 (`preferredLocation`, `DRC_PROVINCES`) | Present with real 26-province data ✅ but optional |
| Product or Service of Interest* | Text input | ❌ | — | Absent |
| Estimated Business Volume (USD) | "Select range" | ❌ | — | Absent |
| Expected Timeline* select | "Select timeline" | 🟡 | form L288 | Present (5 keys) but optional |
| Detailed Requirement* textarea | Multi-line, placeholder | ✅ | form L307 (`message`) | Present, required |
| Upload Supporting Document dropzone | Dashed border, cloud icon, PDF/DOC/DOCX/PPTX 10 MB | ❌ | — | No file upload anywhere in the form |
| Checkbox row (Verified only / B2B meetings / Market-entry / Sponsorship) | 3 green pre-checked + 1 unchecked | ❌ | — | No service-option checkboxes |
| 🔒 privacy footnote | Lock + reassurance line | ✅ | form L319 (`ShieldCheck` + `securityNote`) | Present; wording says "opportunities" instead of "local partners" |
| Step 3 confirmation card | Pale-green card, check circle, bullets | ❌ | — | Submission feedback is a Sonner toast only — no confirmation state/card |
| Request ID `TIDRC-PR-2025-000124` | Boxed green mono ID | ❌ | `actions.ts` | No reference number generated or shown |
| "2–3 business days" SLA + email-confirmation bullets | 3 icon bullets | ❌ | — | Absent |
| "Submit Another Request" + "Browse the Directory First →" | Outline button + link | ❌ | — | Absent (form just resets) |
| Submit button | (implied by flow) | ✅ | form L323 | Primary blue with Send icon, loading spinner ✅ |
| Navy footer, 3 link columns, socials, BrandsBridge | Shared chrome | 🟡 | global `Footer` | Site footer exists but styling/columns differ from mock (chrome scored globally) |

## ❌ Design elements the app lacks entirely

**Partner-type taxonomy (Step 1)** — the design's 8 contact types (Supplier, Distributor, Local Representative, JV Partner, Professional Service Provider, Institutional Contact, Enter Market, Source Products) → implies a `contact_type` enum on `business_requests` distinct from the current business-intent enum.
- ⓘ "one primary need per request" helper line — copy only.

**Form fields** —
- Website field → one nullable column.
- Product or Service of Interest* → one text column.
- Estimated Business Volume (USD) range select → enum column + range options.
- Phone country-code select → dial-code dataset (UI only).
- Upload Supporting Document dropzone (PDF/DOC/DOCX/PPTX, 10 MB) → Supabase Storage bucket + MIME/size validation + attachment column.
- Service-option checkboxes (Verified companies only / Arrange B2B meetings / Market-entry support / Sponsorship interest) → 4 boolean columns.

**Post-submit confirmation (Step 3)** —
- Human-readable Request ID `TIDRC-PR-YYYY-NNNNNN` → server-side sequence + return value from `submitBusinessRequest`.
- Confirmation card (green check, ID box, review/email/SLA bullets, "Submit Another Request", "Browse the Directory First →") → conditional success state replacing the form.
- "Confirmation email shortly" bullet → transactional email send (none exists in `actions.ts`).

**Hero** — breadcrumb; partner-specific H1/body copy.

## 🎨 Visual-language delta

The design is flat DRC-flag institutional: navy `#0B1F60` hero band with a right-side feathered photo, **yellow `#F5A700` primary actions**, hairline 1 px borders, 4–8 px radii, gray-filled inputs, green reserved for the success card. The app is a cooler generic-SaaS look: full-bleed photo hero with slate scrim (no navy band), blue `primary` for every action (no yellow anywhere on the page), `rounded-xl/2xl` (12–16 px) cards, white inputs, and centered section headings ("What brings you to the DRC?", "How It Works") instead of the design's left-aligned numbered 1-2-3 columns. Density is close (compact h-9 inputs ✅), and select/tile interaction polish is actually better than the mock, but the page's information architecture (numbered 3-step story ending in a visible confirmation promise) and the yellow/navy brand voice are missing.

## 🔷 App features the design omits (regression watch-list)

- Auth gate: unauthenticated submit redirects to `/login?next=/request` (design shows an anonymous public form).
- "Who Is This For?" sidebar (4 audience cards) and 4-step "How It Works" section.
- Searchable country combobox; bilingual EN/FR (+TR/ZH/ES) strings; sector labels resolved from Supabase.
- Auto-link of the request to the submitter's `company_id`; Zod boundary validation; toast loading/success UX.
- Broader intent taxonomy (Invest / Sell / Buy / Publish Opportunity / Market Report / Business Mission) beyond partner-finding.

## Verdict

**matchScore: 55**

The app has a direct counterpart page with the same skeleton — photo hero with two CTAs, an 8-tile selectable need grid wired to the form, a dense two-column intake form, and the lock-icon privacy line — so the bones of the design are there. But the design's identity is "Find a Local Partner," and the app's page is a generic business-request intake: the tile taxonomy is a different set of 8 options, four design fields are missing outright (website, product of interest, business volume, file upload) and the service-option checkbox row doesn't exist. The biggest functional gap is Step 3: the design promises a visible confirmation card with a `TIDRC-PR-…` Request ID, email confirmation, and a 2–3-business-day SLA, while the app only fires a toast and resets the form. Visually, the navy/yellow institutional palette and the numbered 1-2-3 column narrative are absent — everything is blue-on-white with centered headings. Required-field discipline also diverges: the design marks company, phone, sector, province, and timeline as required; the app makes them optional.
