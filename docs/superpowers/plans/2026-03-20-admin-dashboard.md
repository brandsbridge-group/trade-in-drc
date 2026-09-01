# Admin Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Build the remaining 5 admin pages (Companies, Users, Taxonomy, Analytics, Settings) and update the admin layout to light theme with compact design.

**Architecture:** Server Components for data fetching + client interactive elements. React Query for admin-specific queries. Supabase admin client for privileged operations.

**Design:** Light theme (NOT dark sidebar — update existing layout), compact, text-sm, p-3/p-4, professional government feel. Lucide outline icons, brand color.

**Existing:** Admin layout (needs light theme update), overview page, verifications queue + detail page.

---

## Task 1: Admin Layout Light Theme Update

**Files to modify:**
- `src/app/[locale]/admin/layout.tsx`
- `src/app/[locale]/admin/page.tsx`

Update the admin layout sidebar from dark (bg-slate-900) to light theme matching the client dashboard sidebar pattern (bg-slate-50, border-r, dark text). Update overview page to use React Query.

---

## Task 2: Admin Companies Management

**Files to create:**
- `src/app/[locale]/admin/companies/page.tsx`
- `src/app/[locale]/admin/companies/[id]/page.tsx`

Companies list: table of ALL companies (all statuses), search input, status filter tabs (All/Pending/Verified/Rejected), columns: Name, Sector, Status badge, Owner email, Created date, Actions (View).

Company detail: full company info, products, documents, verification history. Edit status dropdown for admin override.

---

## Task 3: Admin Users Management

**Files to create:**
- `src/app/[locale]/admin/users/page.tsx`

Users list: table of all registered profiles, columns: Email, Full Name, Role badge, Companies count, Joined date, Actions. Role toggle (user/admin) with confirmation dialog.

---

## Task 4: Admin Taxonomy Management

**Files to create:**
- `src/app/[locale]/admin/taxonomy/page.tsx`
- `src/components/admin/taxonomy-editor.tsx`

Two sections: Sectors and Categories. Each with add/edit/delete. Bilingual fields (name_en, name_fr). Categories linked to parent sectors via dropdown. Inline editing pattern.

---

## Task 5: Admin Analytics & Settings

**Files to create:**
- `src/app/[locale]/admin/analytics/page.tsx`
- `src/app/[locale]/admin/settings/page.tsx`

Analytics: platform-wide stats — total companies, verified, pending, rejected, total users, total RFQs, total messages. Compact stat grid.

Settings: basic admin settings placeholder.

---

## Summary

| Task | Description | Files |
|---|---|---|
| 1 | Admin layout light theme + overview update | 2 modified |
| 2 | Companies management | 2 new |
| 3 | Users management | 1 new |
| 4 | Taxonomy management | 2 new |
| 5 | Analytics + Settings | 2 new |

**Total: 7 new files, 2 modified, 5 commits**
