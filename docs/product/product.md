# Product Documentation: TradeInDRC

## Overview
**TradeInDRC** is the official bilingual (French/English) online trade portal of the Democratic Republic of the Congo (DRC). It serves as a government-backed B2B matchmaking platform enabling verified Congolese and international companies to connect, collaborate, and trade.

## Target Audience
1.  **Congolese Businesses**: Exporters looking to promote products and verified capacities.
2.  **International Buyers**: Verified global entities seeking reliable suppliers in the DRC.
3.  **Ministry Officials**: Admins responsible for moderating and verifying company legitimacy.

## Core Features & Modules

### 1. Registration & Verification System
- **Multi-Role Accounts**: Visitor, Congolese Company, International Business, Admin/Moderator, Super-Admin.
- **Verification Flow**: 
  - Email/OTP Registration.
  - Document Upload (Tax ID, Certificates).
  - "Verified by Ministry" badge issuance upon Admin approval.
- **Account Management**: One user can manage multiple company profiles.

### 2. Company Profiles
- **Rich Data**: Capacity, Lead Times, MOQ, HS Codes, Certifications, Markets, Languages, Locations.
- **Media**: Logo, Gallery, Video Embeds, PDF Brochures.
- **SEO**: Profiles are optimized for search engines.

### 3. Search & Discovery
- **Full-Text Search**: Names, Tags, Descriptions.
- **Faceted Filtering**: Sector, Location, certifications, export readiness.
- **Sorting**: Relevance, A-Z, Newest.

### 4. Communication & Messaging
- **Secure Inbox**: Internal messaging system; no direct email exposure.
- **Contact Rules**: Configurable reveal settings (e.g., login required to view).
- **Anti-Spam**: CAPTCHA, Rate-limiting, "Contact Supplier" buttons.

### 5. Mini RFQ (Opportunities)
- **Marketplace**: Middle/Dynamic page for posting buy/sell needs (e.g., "Seeking 10 tons of coffee").
- **Response**: Verified companies can respond via secure messaging.

### 6. Admin Console
- **Moderation**: Queues with audit trails.
- **Dashboard**: KPIs (Verification status, search queries, top profiles).
- **CMS**: Management of static pages (About, News, Events) and Taxonomy (Sectors, Tags).

### 7. Analytics Dashboard (Business)
- **Private Stats**: Profile views, search appearances, top search terms.
- **News Feed**: Relevant commerce news and success stories.

### 8. Internationalization
- **Languages**: English, French, Turkish (Project config).
- **Strategy**: All text externalized to configuration files.

## Technical Architecture
- **Frontend**: Next.js 15 (App Router).
- **UI Library**: Shadcn/UI (Sharp Corners).
- **Design System**: See [Branding Guidelines](../branding/branding.md) and [UI Design Plan](../design/ui_plan.md).
- **Backend**: Firebase (Auth, Firestore, Storage).
- **Styling**: Tailwind CSS v4.

---

*Last updated: 2026-01-15*
