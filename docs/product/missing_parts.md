# Missing Parts & Gap Analysis

Based on the requirements (v1.0) and current implementation status, here are the missing components requiring development.

## 1. Authentication & User Management
- [ ] **Implementation**: Connect `AuthModal` to Firebase Auth.
- [ ] **Missing**: Role management logic (Visitor vs Company vs Admin).
- [ ] **Missing**: Profile management (Update password, manage sessions).

## 2. Company Registration & Verification
- [ ] **Missing**: Multi-step registration form (Company details, Document upload).
- [ ] **Missing**: "Verified by Ministry" approval workflow (Admin side).
- [ ] **Missing**: Document storage logic (Firebase Storage).

## 3. Marketplace & Directory (Core)
- [ ] **Missing**: Search Results Page with specific faceted filters (Sector, Location).
- [ ] **Missing**: Company Profile details page (Dynamic `[id]` route).
- [ ] **Missing**: RFQ / "Mini Market" functionality.

## 4. Communication
- [ ] **Missing**: Internal secure messaging system (Inbox UI + Firestore logic).
- [ ] **Missing**: "Contact Supplier" form on profile pages.

## 5. Admin Console
- [ ] **Missing**: Dedicated Admin Dashboard (`/admin` route).
- [ ] **Missing**: Moderation queues for new companies and documents.

## 6. Content & CMS
- [ ] **Missing**: Static pages content (About, Help Center, Terms).
- [ ] **Missing**: CMS logic for managing "News" and "Success Stories".

## 7. Configuration Data
- [ ] **Action**: Populate `src/config/messages` with all remaining text (Labels, Placeholders, Error messages) to ensure full i18n coverage.
