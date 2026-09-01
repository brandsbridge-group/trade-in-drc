# Company Profile — design 5 vs current app

## Sources

- Design PDF: `/private/tmp/claude-501/.../scratchpad/designs/5.pdf` (single artboard, "Katanga Industrial Supply SARL")
- Design analysis: `/Users/mehmetsemihbabacan/dev/work/lumio-studio/web-apps/tradeindrc/latest-designs/5-company-profile.md`
- App route: `/Users/mehmetsemihbabacan/dev/work/lumio-studio/web-apps/tradeindrc/src/app/[locale]/companies/[id]/page.tsx`
- Key components:
  - `/Users/mehmetsemihbabacan/dev/work/lumio-studio/web-apps/tradeindrc/src/components/marketplace/company-tabs.tsx`
  - `/Users/mehmetsemihbabacan/dev/work/lumio-studio/web-apps/tradeindrc/src/components/trust/verification-badge.tsx`
  - `/Users/mehmetsemihbabacan/dev/work/lumio-studio/web-apps/tradeindrc/src/components/detail/sidecar.tsx`, `src/components/detail/page-meta.tsx`
  - `/Users/mehmetsemihbabacan/dev/work/lumio-studio/web-apps/tradeindrc/src/components/messaging/contact-supplier-modal.tsx`
  - Trust report route (off-page verification detail): `src/app/[locale]/trust/[companySlug]/page.tsx`

## THE DESIGN SPEC

Light-theme, dense, dashboard-like B2B trust page. Palette = DRC flag family: navy `#0B2239`–`#102A43` (nav/footer), brand blue `#1D6FD8` (structure, links, active states), golden yellow `#F5A800`–`#FDB515` (conversion CTAs + premium badge ONLY), success green `#1E9E4A` (verification semantics), red only as logo accent. White cards with 1 px `#D9E0E7` borders, radius ~8 px, shadow ~`0 1px 3px rgba(0,0,0,.06)`, canvas `#F4F6F8`. Single grotesque sans (Poppins/Inter-like), Title Case headings/buttons.

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

### Section 1 — Utility header + navy navbar
White strip: swoosh logo + "Trade in DRC / Connect · Invest · Grow" tricolor tagline; right: "Power by BrandsBridge Group" co-brand. Navy bar with 8 links (Home, Companies, Opportunities, Marketplace, Local Contacts, Market Intelligence, Promote Your Business, Contact) and two ~4 px-radius CTAs: yellow "Register Your Company" (navy text) + blue "Request a Partner" (white text).

### Section 2 — Process stepper
White rounded bar of 4 arrow-chevron segments: "1 Landing Page – Local Business Contacts ▸ 2 Search Directory ▸ 3 Company Profile ▸ 4 Find a Local Partner". Active step 3 filled brand blue with white text; visited numbers in filled navy circles, upcoming in outline gray. Only non-rectangular geometry on the page (clip-path chevrons).

### Section 3 — Company hero card
White card, 1 px border, radius 8, subtle shadow, 4 zones left→right:
1. **Logo tile** ~110 px bordered square (radius 6) with circular black gear "KATANGA INDUSTRIAL SUPPLY" emblem.
2. **Identity block**: pill badge "🏅 Premium Verified Local Partner" (pale-yellow `#FFF6DC` fill, gold border, radius 999); H1 "Katanga Industrial Supply SARL" ~26–28 px bold ink; blue semibold tagline "Mining Equipment Distributor"; icon meta row 📍 "Lubumbashi, Haut-Katanga, DRC" + 🌐 "www.katangaindustrial.cd" (blue link); two outline chips: "Documents Reviewed" (blue outline, doc icon) and "Available for International Partnerships" (green outline, pale-green tint `#E8F6EC`).
3. **Hero photo**: full-color open-pit mine with yellow haul truck + excavator, rounded 6 px, no overlay.
4. **Action stack** (3 full-width buttons, ~36 px, radius 6): yellow filled "🏅 Request Introduction" (navy text), white outline blue "📅 Schedule a B2B Meeting", white outline blue "♡ Save Company".

### Section 4 — Tab bar
Text tabs on white: **Overview · Products & Services · Partnership Interests · Verification · Contact Request**; active "Overview" blue with 2–3 px blue underline; hairline divider. Note: in the design ALL section content is visible below simultaneously — tabs behave as anchors, not content-hiders.

### Section 5 — Three-column info row
- **About card** (~40%): title "About Katanga Industrial Supply SARL", 4-line gray paragraph, then a **2×4 icon fact grid**: Year Established 2017 / Company Type "Limited Liability Company (SARL)" / Number of Employees "51 – 100" / Headquarters "Lubumbashi, Haut-Katanga, DRC" ‖ Service Areas "Haut-Katanga, Lualaba, Tanganyika, Haut-Lomami, Kasai-Oriental" / Languages "French, English, Swahili" / International Experience "Supplies imported from South Africa, Zambia, China, and Europe". Each fact = line icon + bold ~11 px label + gray value.
- **Key Products & Services card** (~30%): 3 stacked media rows on faint-gray rounded sub-panels, each = ~64 px rounded photo thumbnail + blue bold title + 2-line gray description: "Mining Equipment — Excavators, loaders, haul trucks, drilling rigs, and construction machinery.", "Spare Parts — OEM and aftermarket parts for major mining equipment brands.", "Maintenance & Support — Preventive maintenance, field support, and equipment refurbishment services."
- **Right rail** (~25%): **Partnership Interests card** — 5-item green check-circle list (Distributorship Agreements, OEM Partnerships, Technology Transfer, Joint Ventures, Supplier Partnerships); **Company Snapshot card** — 6 hairline-separated key-value rows: DUNS Number "–", Tax ID (RCCM) "CD/L'sh/RCCM/17-B-01234", Industry Sector "Mining & Minerals", Business Registrations "RCCM, NIF, CNSS", Quality Certifications "ISO 9001:2015".

### Section 6 — Bottom two-column row
- **Verification Summary table** (left ~42%): card title + top-right green chip "Overall Verification: ✓ Verified". Table header (light-gray tint): Verification Area / Status / Verified By / Date Verified. 5 rows: Business Registration (RCCM), Tax Compliance (NIF), Physical Address, Bank Reference → green "✓ Verified" chips; Company Documents → blue "Documents Reviewed" chip. Verified By = "Trade in DRC", dates "Apr 28, 2024".
- **Request Contact / Introduction form** (right ~55%): intro copy "Send a request to connect with Katanga Industrial Supply SARL. Your request will be reviewed by our team before an introduction is made." 3-column input grid: Full Name*, Company Name*, Email Address* / Phone (DRC-flag `+243` prefix dropdown + number), "Your Interest*" select, Message (Optional) textarea. Inputs white, 1 px gray border, radius 6. Yellow filled "➤ Submit Contact Request" button (navy text). Micro-disclaimer: "We respect your privacy. Your information will only be used to facilitate this introduction."

### Section 7 — Navy footer
Brand lockup + tricolor tagline + blurb ("Trade in DRC is your gateway to verified local business contacts…"); 3 link columns (Quick Links / Resources / Company); "Power by BrandsBridge Group" lockup + 4 boxed outline social icons (LinkedIn, Twitter, YouTube, Email); bottom bar "© 2024 Trade in DRC. All rights reserved." / "Trade in DRC – Connecting international business with local opportunities." / "www.tradeindrc.com".

## Element-by-element scorecard

| Design element | Visual spec (short) | In app? | Where in app | How the app version differs |
|---|---|---|---|---|
| Utility bar + "Power by BrandsBridge" co-brand | White strip, dual logos | ❌ | — | No BrandsBridge attribution anywhere |
| Navy navbar w/ 8 links + yellow/blue CTAs | `#0B2239` bar, yellow "Register Your Company" | 🟡 | global Navbar via layout, `src/config/navigation.ts` | Different IA (no "Local Contacts" / "Market Intelligence" / "Promote Your Business"); not the navy + yellow/blue CTA pairing |
| 4-step chevron process stepper (step 3 active) | Blue-filled chevron segment, numbered circles | ❌ | — | No funnel stepper on this page at all |
| Hero card container | White, 1 px border, radius 8, 4-zone band | ❌ | `page.tsx:220-240` renders a borderless header row | Header is plain page content, no card framing |
| Company logo tile ~110 px | Bordered white square, radius 6 | 🟡 | `page.tsx:221-232` | Exists but tiny (56 px `w-14 h-14`), gray `bg-slate-100` fill vs large white bordered tile |
| "Premium Verified Local Partner" gold pill | Pale-yellow `#FFF6DC` fill, gold border, crown icon | 🟡 | `src/components/trust/verification-badge.tsx` via `PageHeader` action | Tier badge exists but generic shadcn styling, not the gold premium pill treatment or wording |
| Company name H1 + blue tagline | ~28 px bold + blue semibold subtitle | 🟡 | `PageHeader` in `page.tsx:234-239` | Name shown; subtitle is the raw description paragraph — no short blue tagline field ("Mining Equipment Distributor") |
| 📍 Location + 🌐 website meta row | Icon row, blue link | ✅ | `page.tsx:196-206` (`PageMeta`) | Close match (adds sector badge; fine) |
| "Documents Reviewed" chip | Blue outline chip w/ doc icon | ❌ | — | No document-review status surfaced on-page |
| "Available for International Partnerships" chip | Green outline, pale-green tint | ❌ | — | No availability/partnership-openness flag in schema or UI |
| Hero photo (facility/operations image) | Rounded full-color photo in hero | ❌ | — | No cover/facility photo; only logo + product thumbs |
| "Request Introduction" yellow CTA | Yellow filled, navy text, badge icon | 🟡 | `page.tsx:294-306` sidecar Contact button → `ContactSupplierModal` | Functionally similar (mediated contact) but a small primary sidebar button, not the prominent yellow hero CTA; login-gated |
| "Schedule a B2B Meeting" button | White outline blue, calendar icon | ❌ | — | No meeting-scheduling feature |
| "Save Company" button | White outline blue, heart icon | ❌ | — | No favorite/save on this page |
| Tab bar: Overview / Products & Services / Partnership Interests / Verification / Contact Request | Blue underline tabs; all content visible below (anchors) | 🟡 | `company-tabs.tsx:105-113` | Different tab set (Overview/Segments/Products/Services/References/Contacts); tabs HIDE content — design shows everything at once; no Verification or Contact Request tab |
| About card + paragraph | White bordered card, 4-line body | 🟡 | description as `PageHeader` subtitle | Description exists but as header subtitle, not a dedicated "About" card |
| 2×4 icon fact grid (Year Established / Company Type / Employees / HQ / Service Areas / Languages / Intl Experience) | Line icon + bold label + gray value | ❌ | — (only capacity/MOQ/lead-time tiles, `company-tabs.tsx:117-126`) | None of the 7 design facts exist; app shows manufacturing-marketplace stats instead |
| Key Products & Services media rows (3× photo + title + desc) | 64 px thumbs on gray sub-panels | 🟡 | Products tab `company-tabs.tsx:151-189`; Services tab `191-211` | Products/services exist but split across two hidden tabs, 48 px thumbs, not a compact always-visible card |
| Partnership Interests checklist (5 green checks) | Green check-circle list | ❌ | — | No partnership-interest data model or UI (Segments tab is a different concept) |
| Company Snapshot card (DUNS / Tax ID RCCM / Industry Sector / Business Registrations / Quality Certifications) | 6 hairline key-value rows | 🟡 | certifications chips in Overview tab (`company-tabs.tsx:128-143`); sector badge in meta | Only certifications + sector exist; no DUNS/RCCM/NIF/CNSS registry identifiers on-page |
| Verification Summary table (5 areas, green chips, Verified By, dates) + "Overall Verification: ✓ Verified" chip | Light-tint header table | 🟡 | Off-page: link to `/trust/[companySlug]` (`page.tsx:280-285`) + `VerificationBadge` tier | Design puts the full per-area table ON the profile; app hides it behind a "view trust report" link |
| Request Contact / Introduction inline form (Full Name / Company / Email / +243 Phone / Interest select / Message, disclaimer) | 3-col grid, yellow submit | 🟡 | `ContactSupplierModal` (modal, message-only, auth-gated) | No inline anonymous lead form: anon visitors get "login to contact"; none of the 6 designed fields, no `+243` prefix, no mediated-introduction copy |
| Navy footer w/ 3 link columns + boxed social + BrandsBridge | `#0B2239`, outline social squares | 🟡 | global Footer via layout | Footer exists globally but not the designed navy/BrandsBridge/social layout |
| Light-gray canvas + uniform white bordered cards | `#F4F6F8` canvas, `#D9E0E7` borders | 🟡 | assorted `bg-card border rounded-md` blocks | App page sits on plain background with loose sections; design's dense uniform card grid absent |

## ❌ Design elements the app lacks entirely

**Funnel / navigation**
- 4-step chevron process stepper — pure UI; needs flow context (arrived from directory).
- BrandsBridge "Power by" co-brand (header + footer) — static asset; confirm contract first.

**Hero trust signals**
- "Documents Reviewed" + "Available for International Partnerships" chips — boolean flags on `companies` or verification records.
- Premium gold pill treatment for top tier — styling + tier→label mapping.
- Hero facility photo — new `cover_image_url` column + upload flow.

**Actions**
- "Schedule a B2B Meeting" — implies a meetings/booking table and flow.
- "Save Company" — implies a `saved_companies` favorites table, auth-gated.

**Company facts & snapshot**
- 7-fact About grid (year_established, company_type, employee_range, headquarters, service_areas, languages, international_experience) — all new columns.
- Company Snapshot registry IDs (DUNS, RCCM tax ID, business registrations NIF/CNSS, ISO certs as structured rows) — new columns/JSON.
- Partnership Interests checklist — new enum-array column or join table.

**Verification & contact**
- On-page per-area Verification Summary table (area / status / verified_by / verified_at) — needs verification records; app currently has only a single tier + off-page trust report.
- Inline anonymous "Request Contact / Introduction" form with +243 phone prefix, interest select, mediated-review copy — needs a public introduction-request table (candidate: reuse migration 00022 `requests`) + server action.

## 🎨 Visual-language delta

The design is a dense bordered-card dashboard on a light-gray `#F4F6F8` canvas: every block a white card with 1 px `#D9E0E7` border, 8 px radius, whisper shadow; yellow strictly reserved for conversion CTAs; green owns verification; navy frames top and bottom. The app page is an airy document instead: borderless header, generic shadcn primary buttons, muted badges, content hidden behind interactive tabs, and no yellow/green/navy semantic color coding. Typography roughly matches in hierarchy but lacks the blue taglines, Title Case card titles, and icon-labeled fact rows. Net effect: the app reads as a neutral SaaS profile; the design reads as a branded government trade-portal trust dossier. Even elements that exist (badge, tabs, products) would need restyling to pass as the design.

## 🔷 App features the design omits (regression watch-list)

- PII-safe contact architecture (`companies_public` view, `resolveContactReveal`, no raw email/phone client-side) — must survive any open lead form.
- Segments tab (`SegmentBadge`), Verified References tab (`CompanyReferences`), Contact persons tab (`CompanyContacts`).
- Production capacity / MOQ / lead-time stat tiles and target-markets badges (marketplace features).
- Trust report deep-link (`/trust/[companySlug]`) and `trackEvent` view analytics.
- Owner self-view state ("this is you") and login-redirect contact CTA.
- FR localization of all strings (design artboard is EN-only).

## Verdict

**matchScore: 34**

The app has a working company profile with the same skeleton — logo, name, location/website meta, verification tier badge, tabbed products/services, and a mediated contact path — so roughly a third of the design's intent exists in some form. But almost nothing looks like the design: no bordered hero card, no gold premium pill, no chevron stepper, no dense white-card grid on a gray canvas. The design's core trust content — the 7-fact About grid, Company Snapshot registry IDs, Partnership Interests checklist, and above all the on-page Verification Summary table — is entirely missing (verification detail is exiled to a separate trust-report page). The conversion centerpiece, an inline anonymous Request Contact/Introduction form with +243 phone and interest select, is replaced by a login-gated message modal — a materially different funnel. Adopting the design means new schema (facts, registry IDs, partnership interests, per-area verifications, saved companies, meetings) plus a full visual reskin, while preserving the existing PII-safe contact architecture.
