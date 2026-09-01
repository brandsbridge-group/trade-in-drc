# Implementation Todo

## Current Sprint

- [x] Project Initialization
  - [x] Create Next.js App
  - [x] Install Shadcn UI, Framer Motion
  - [x] Configure i18n (next-intl)
  - [x] Set Sharp Corners (radius: 0)
  - [x] Setup Firebase SDK (Client & Admin)
- [x] Branding & Design System Implementation
  - [x] Configure Tailwind with DRC Colors (Blue, Yellow, Red)
  - [x] Set up Typography (Geist/Inter)
  - [x] Apply "Sharp Official" styling to all shadcn components
- [x] Base UI Components
  - [x] Header/Navbar with Language Switcher
  - [x] Footer
  - [x] Hero Section with Search
  - [x] Features Section
  - [x] Auth Modal Skeleton
- [x] Requirements Analysis
  - [x] Break down MVP deliverables → See `feature_specification.md`
- [x] Authentication Implementation (Firebase Auth)
  - [x] Email/Password Login & Signup
  - [x] Role-based access (Foundation in AuthProvider)

---

## Phase 1: Core MVP (Modules 1, 2, 3, 5, 7) ✅

- [x] Company Profile CRUD
  - [x] Multi-step Registration Form
  - [x] Document Upload to Firebase Storage
  - [x] Profile View Page (`/companies/[id]`)
- [x] Search & Directory
  - [x] Search Results Page with Filters
  - [x] Faceted Filters UI (Sector, Location)
  - [x] Firestore Queries
- [x] CMS Pages
  - [x] About, How It Works

## Phase 2: Trust & Communication (Modules 4, 6, 12, 15)

- [ ] Media Management
  - [ ] Gallery Upload
  - [ ] Video Embed
  - [ ] Brochure (PDF) Upload
- [ ] Secure Messaging
  - [ ] Inbox UI
  - [ ] "Contact Supplier" Form
  - [ ] Firestore Messages Collection
- [ ] Verified References
  - [ ] Add Reference Form
  - [ ] Link to Verified Partners

## Phase 3: Advanced Features (Modules 8, 9, 11, 13)

- [ ] Admin Console
  - [ ] Admin Layout (`/admin`)
  - [ ] Verification Queue
  - [ ] Taxonomy Management (Sectors, Tags)
- [ ] Analytics Dashboard (Business)
  - [ ] Profile Views Counter
  - [ ] Search Appearances
- [ ] Mini RFQ (Opportunities)
  - [ ] Post Opportunity Page
  - [ ] Browse Opportunities

## Phase 4: Polish (Modules 10, 14)

- [ ] Help Center
  - [ ] FAQ with Search
  - [ ] Support Form
- [ ] Training & Documentation
  - [ ] Admin Manual PDF

---

*Legend: [ ] pending, [/] in progress, [x] completed*
*Reference: [Feature Specification](../product/feature_specification.md)*
