# Feature Specification: TradeInDRC MVP

This document provides a detailed breakdown of all 15 modules required for the TradeInDRC platform, including implementation strategy, data models, and deployment priority.

---

## Module 1: Registration & Verification
**Priority**: 🔴 Critical (Core)

### Features
| Feature | Description | Status |
|---------|-------------|--------|
| Email + Password Registration | Standard Firebase Auth | ✅ Done |
| OTP Verification | Email OTP for account confirmation | ⏳ Pending |
| SMS OTP (Optional) | Twilio/SendGrid integration | ⏳ Pending |
| Password Reset | Firebase Auth built-in | ⏳ Pending |
| Multi-Company Management | One user can own/manage multiple companies | ⏳ Pending |
| Document Upload | Tax ID, Registry Cert, Certificates (Firebase Storage) | ⏳ Pending |
| Admin Approval Workflow | Queue for moderators to approve/reject | ⏳ Pending |
| "Verified by Ministry" Badge | Visual indicator on approved profiles | ⏳ Pending |

### Data Model (Firestore)
```
users/{userId}
  - email, role, createdAt

companies/{companyId}
  - ownerId, name, sector, location, status (pending/verified/rejected)
  - documents: [{type, url, uploadedAt}]
```

---

## Module 2: User Roles & Permissions
**Priority**: 🔴 Critical (Core)

### Roles
| Role | Permissions |
|------|-------------|
| Visitor | View public profiles, search |
| Congolese Company | Create/edit own profile, respond to RFQs, access inbox |
| International Business | Same as above |
| Admin/Moderator | Approve companies, manage taxonomy, view reports |
| Super-Admin | All admin + manage admins, system settings |

### Implementation
- Store `role` field in `users` collection.
- Middleware and server-side checks for protected routes.

---

## Module 3: Company Profiles
**Priority**: 🔴 Critical (Core)

### Fields
- **Basic**: Name, Logo, Description, Sector, HS Codes.
- **Capacity**: Production capacity, Lead time, MOQ.
- **Location**: Province, City, GPS (optional).
- **Certifications**: ISO, Fair Trade, Organic, etc.
- **Markets**: Export destinations (multi-select).
- **Languages**: Spoken languages.
- **Tags**: Searchable keywords.

### UI
- Editable form (multi-step).
- Public view page (`/companies/[id]`).

---

## Module 4: Media Management
**Priority**: 🟡 High

### Features
| Type | Max Size | Format | Quota |
|------|----------|--------|-------|
| Logo | 2MB | PNG, JPG, WebP | 1 |
| Gallery | 5MB each | PNG, JPG, WebP | 10 |
| Video | Embed only | YouTube, Vimeo | 3 |
| Brochure | 10MB | PDF | 5 |

### Implementation
- Firebase Storage with folder structure: `companies/{companyId}/media/`.
- Client-side validation + server-side rules.

---

## Module 5: Search & Filters
**Priority**: 🔴 Critical (Core)

### Features
- **Full-text search**: Company name, description, tags.
- **Faceted Filters**: Sector, Location/Province, Certifications, Export Readiness.
- **Sorting**: Relevance, A-Z, Newest.
- **Shareable URLs**: Query params reflect filters (`?sector=mining&location=kinshasa`).

### Implementation
- **MVP**: Firestore compound queries (limited).
- **V2**: Algolia or Typesense for advanced full-text.

---

## Module 6: Contact & Anti-Spam
**Priority**: 🟡 High

### Rules
- **Login Required**: Contact form only visible to authenticated users.
- **Rate Limiting**: Max 10 messages/day per user.
- **CAPTCHA**: reCAPTCHA on contact form.
- **Spam Reporting**: Users can flag messages; Admin queue.

---

## Module 7: Internationalization & Branding
**Priority**: 🔴 Critical (Core)

### Features
| Feature | Status |
|---------|--------|
| French/English UI | ✅ Done (next-intl) |
| Turkish UI | ✅ Done |
| SEO Sitemaps | ⏳ Pending |
| CMS Pages (About, FAQ, Terms) | ⏳ Pending |

### CMS Pages Required
- About, How It Works, Sectors, News, Events, FAQ, Contact, Terms, Privacy, Cookies.

---

## Module 8: Admin Console & Dashboard
**Priority**: 🟡 High

### Features
- **Moderation Queue**: Pending companies, documents, spam reports.
- **KPIs Dashboard**: Verification status, sector distribution, search analytics.
- **Taxonomy Management**: CRUD for Sectors, HS Codes, Tags.
- **Featured Profiles**: Manage homepage carousels.

---

## Module 9: Integrations
**Priority**: 🟡 High

| Service | Purpose | Provider |
|---------|---------|----------|
| Email | OTP, Notifications | Resend / SendGrid |
| SMS (Optional) | OTP | Twilio |
| Search | Full-text | Algolia (V2) |
| CAPTCHA | Anti-bot | reCAPTCHA v3 |

---

## Module 10: Training & Documentation
**Priority**: 🟢 Low (Post-Launch)

- **Admin Manual**: PDF runbook for Ministry staff.
- **Training Sessions**: 2x 90min (can be recorded).

---

## Module 11: Analytics Dashboard for Businesses
**Priority**: 🟡 High

### Features
- Profile views count.
- Search result appearances.
- Top search terms leading to profile.
- News feed (Commerce news, success stories).

### Data Model
```
analytics/{companyId}
  - views: number
  - searchAppearances: number
  - topSearchTerms: [{term, count}]
```

---

## Module 12: Secure Messaging
**Priority**: 🟡 High

### Features
- "Contact Supplier" button on profiles.
- Private inbox within platform.
- Notification emails for new messages.

### Data Model
```
messages/{messageId}
  - senderId, receiverId, companyId
  - subject, body, createdAt, read: boolean
```

---

## Module 13: Mini RFQ (Opportunities)
**Priority**: 🟢 Medium

### Features
- Post buy/sell opportunities publicly.
- Filter by category, type (Buy/Sell).
- Verified users only can post.
- Responses via Secure Messaging.

### Data Model
```
opportunities/{opId}
  - authorId, companyId, type (buy/sell)
  - title, description, category, createdAt, expiresAt
```

---

## Module 14: Help Center
**Priority**: 🟢 Medium

- FAQ section with search.
- Step-by-step guides.
- Contact support form.

---

## Module 15: Verified References
**Priority**: 🟢 Medium

### Features
- Add "Partnership References" to profile.
- If reference is another verified company, link displayed.
- Creates visible "network of trust".

### Data Model
```
companies/{companyId}/references
  - refCompanyId, relationship, since
```

---

## Deployment Phases

### Phase 1: Core MVP
- Modules 1, 2, 3, 5, 7 (partial)

### Phase 2: Trust & Communication
- Modules 4, 6, 12, 15

### Phase 3: Advanced Features
- Modules 8, 9, 11, 13

### Phase 4: Polish
- Modules 10, 14

---

*Created: 2026-01-15*
