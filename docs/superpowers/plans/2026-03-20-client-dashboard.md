# Client Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a complete, stateful client dashboard with sidebar navigation, company/product/RFQ management, analytics counters, and smooth UX via React Query + Zustand.

**Architecture:** Dashboard layout with persistent sidebar. React Query for server state (auto-caching, background refetch, optimistic updates). Zustand for UI state (sidebar collapse, active filters). All data flows through Supabase client.

**Tech Stack:** @tanstack/react-query, Zustand, Supabase, shadcn/ui, Lucide icons (outline only, brand color)

**Design:** Light theme, compact (small paddings p-3/p-4, text-sm), professional government feel. Sidebar 200px wide. Stats inline, not oversized cards.

---

## File Structure

### Files to Create

| File | Responsibility |
|---|---|
| `src/app/[locale]/dashboard/layout.tsx` | Dashboard shell with sidebar + React Query provider |
| `src/app/[locale]/dashboard/companies/page.tsx` | Company list page |
| `src/app/[locale]/dashboard/products/page.tsx` | Products management page |
| `src/app/[locale]/dashboard/products/new/page.tsx` | Create product page |
| `src/app/[locale]/dashboard/rfq/page.tsx` | RFQ listings management page |
| `src/app/[locale]/dashboard/rfq/new/page.tsx` | Create RFQ listing page |
| `src/app/[locale]/dashboard/settings/page.tsx` | User settings page |
| `src/components/dashboard/sidebar.tsx` | Dashboard sidebar navigation |
| `src/components/dashboard/stats-row.tsx` | Compact stats row for overview |
| `src/components/dashboard/company-list.tsx` | Company cards with actions |
| `src/components/dashboard/product-form.tsx` | Product create/edit form |
| `src/components/dashboard/product-list.tsx` | Products table with actions |
| `src/components/dashboard/rfq-form.tsx` | RFQ create/edit form |
| `src/components/dashboard/rfq-list.tsx` | RFQ listings table with actions |
| `src/lib/providers/query-provider.tsx` | React Query provider wrapper |
| `src/hooks/use-companies.ts` | React Query hooks for company data |
| `src/hooks/use-products.ts` | React Query hooks for product CRUD |
| `src/hooks/use-rfq.ts` | React Query hooks for RFQ CRUD |
| `src/hooks/use-analytics.ts` | React Query hooks for analytics counters |
| `src/stores/dashboard-store.ts` | Zustand store for dashboard UI state |

### Files to Modify

| File | Change |
|---|---|
| `src/app/[locale]/layout.tsx` | Add QueryProvider |
| `src/app/[locale]/dashboard/page.tsx` | Refactor to use React Query hooks + stats row |
| `src/app/[locale]/dashboard/analytics/page.tsx` | Refactor to use React Query hooks |
| `src/app/[locale]/dashboard/companies/[id]/edit/page.tsx` | Refactor to use React Query mutation |

---

## Task 1: React Query Provider & Zustand Dashboard Store

**Files:**
- Create: `src/lib/providers/query-provider.tsx`
- Create: `src/stores/dashboard-store.ts`
- Modify: `src/app/[locale]/layout.tsx`

- [ ] **Step 1: Create React Query provider**

```typescript
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
```

- [ ] **Step 2: Create dashboard Zustand store**

```typescript
import { create } from "zustand";

interface DashboardState {
  sidebarCollapsed: boolean;
  activeCompanyId: string | null;
  toggleSidebar: () => void;
  setActiveCompany: (id: string | null) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  sidebarCollapsed: false,
  activeCompanyId: null,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setActiveCompany: (id) => set({ activeCompanyId: id }),
}));
```

- [ ] **Step 3: Add QueryProvider to root layout** — wrap children with `<QueryProvider>` inside `<AuthProvider>`.

- [ ] **Step 4: Commit**
```bash
git commit -m "feat: add React Query provider and dashboard Zustand store"
```

---

## Task 2: Dashboard Layout & Sidebar

**Files:**
- Create: `src/app/[locale]/dashboard/layout.tsx`
- Create: `src/components/dashboard/sidebar.tsx`

- [ ] **Step 1: Create sidebar component**

"use client" component. Renders:
- Logo/brand mark at top (compact)
- Navigation links: Overview, My Companies, Products, RFQ Listings, Inbox (with unread badge), Analytics, Settings
- Each link: Lucide outline icon + label, active state highlighted
- Collapsible via Zustand store
- User info + sign out at bottom
- Width: 200px (expanded), 48px (collapsed — icons only)
- Light theme: bg-slate-50 border-r, text-sm, gap-0.5 between items, py-1.5 px-3 per item

- [ ] **Step 2: Create dashboard layout**

```typescript
import { Sidebar } from "@/components/dashboard/sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-white">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}
```

This layout replaces the root Navbar/Footer for dashboard pages.

- [ ] **Step 3: Commit**
```bash
git commit -m "feat: add dashboard layout with sidebar navigation"
```

---

## Task 3: React Query Hooks (Companies, Products, RFQ, Analytics)

**Files:**
- Create: `src/hooks/use-companies.ts`
- Create: `src/hooks/use-products.ts`
- Create: `src/hooks/use-rfq.ts`
- Create: `src/hooks/use-analytics.ts`

- [ ] **Step 1: Companies hooks** — `useCompanies(userId)` fetches companies with verification_reviews. `useUpdateCompany()` mutation with optimistic update + invalidation.

- [ ] **Step 2: Products hooks** — `useProducts(companyId)` fetches products. `useCreateProduct()`, `useUpdateProduct()`, `useDeleteProduct()` mutations with invalidation.

- [ ] **Step 3: RFQ hooks** — `useRfqListings(companyId)` fetches listings. `useCreateRfq()`, `useUpdateRfq()`, `useCloseRfq()` mutations.

- [ ] **Step 4: Analytics hooks** — `useAnalytics(companyIds)` fetches aggregated counters (profile views, product views, contact requests) from analytics_events table.

All hooks use `createClient()` from `@/lib/supabase/client` and follow this pattern:
```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function useCompanies(userId: string) {
  return useQuery({
    queryKey: ["companies", userId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("companies")
        .select("*, verification_reviews(decision, notes, created_at)")
        .eq("owner_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}
```

- [ ] **Step 5: Commit**
```bash
git commit -m "feat: add React Query hooks for companies, products, RFQ, analytics"
```

---

## Task 4: Dashboard Overview Refactor + Stats Row

**Files:**
- Create: `src/components/dashboard/stats-row.tsx`
- Modify: `src/app/[locale]/dashboard/page.tsx`

- [ ] **Step 1: Create compact stats row** — horizontal row of 4 stats (Profile Views, Product Views, Contact Requests, Active RFQs). Each stat: label (text-xs text-muted-foreground uppercase), value (text-lg font-bold), all inline. Uses `useAnalytics()` hook. Compact: gap-4, p-3 per stat, border-r separator.

- [ ] **Step 2: Refactor dashboard overview** — replace direct Supabase calls with `useCompanies()` and `useAnalytics()` hooks. Add stats row at top. Keep verification status and resubmit functionality. Loading state: skeleton shimmer. Error state: retry button.

- [ ] **Step 3: Commit**
```bash
git commit -m "feat: refactor dashboard overview with React Query and stats row"
```

---

## Task 5: Products Management

**Files:**
- Create: `src/app/[locale]/dashboard/products/page.tsx`
- Create: `src/app/[locale]/dashboard/products/new/page.tsx`
- Create: `src/components/dashboard/product-list.tsx`
- Create: `src/components/dashboard/product-form.tsx`

- [ ] **Step 1: Create product list component** — table with columns: Name, Category, Images count, Created date, Actions (Edit/Delete). Uses `useProducts()`. Compact rows. Delete with confirmation dialog.

- [ ] **Step 2: Create product form component** — fields: name, description, categoryId (select), images (file upload with preview). Uses `useCreateProduct()` or `useUpdateProduct()` mutation. Zod validation. Toast feedback.

- [ ] **Step 3: Create products page** — header with "Add Product" button, company selector (if user has multiple companies, select which to manage), product list below. Uses React Query.

- [ ] **Step 4: Create new product page** — renders product form in create mode.

- [ ] **Step 5: Commit**
```bash
git commit -m "feat: add products management with CRUD and image uploads"
```

---

## Task 6: RFQ Management

**Files:**
- Create: `src/app/[locale]/dashboard/rfq/page.tsx`
- Create: `src/app/[locale]/dashboard/rfq/new/page.tsx`
- Create: `src/components/dashboard/rfq-list.tsx`
- Create: `src/components/dashboard/rfq-form.tsx`

- [ ] **Step 1: Create RFQ list component** — table with: Title, Type (Supply/Demand badge), Status, Expires date, Actions (Edit/Close). Uses `useRfqListings()`. Only verified companies can create.

- [ ] **Step 2: Create RFQ form component** — fields: title, description, type (select: supply/demand), expires_at (date picker). Uses `useCreateRfq()` mutation. Zod validation.

- [ ] **Step 3: Create RFQ page** — header with "Create Listing" button (disabled if no verified company), company selector, RFQ list. Shows "Verify your company first" message if no verified companies.

- [ ] **Step 4: Create new RFQ page** — renders RFQ form.

- [ ] **Step 5: Commit**
```bash
git commit -m "feat: add RFQ listings management with create/close"
```

---

## Task 7: Analytics & Settings Pages Refactor

**Files:**
- Modify: `src/app/[locale]/dashboard/analytics/page.tsx`
- Create: `src/app/[locale]/dashboard/settings/page.tsx`

- [ ] **Step 1: Refactor analytics page** — replace direct Supabase calls with `useAnalytics()` hook. Show: Profile Views (monthly), Product Views (monthly), Contact Requests (monthly), Active RFQs. Compact cards with text-lg values. Loading skeletons.

- [ ] **Step 2: Create settings page** — basic user profile settings: full_name (input), avatar upload (optional). Update profile via Supabase. Uses React Query mutation. Compact form.

- [ ] **Step 3: Commit**
```bash
git commit -m "feat: refactor analytics with React Query, add settings page"
```

---

## Summary

| Task | Description | Files |
|---|---|---|
| 1 | Query Provider + Zustand store | 2 new, 1 modified |
| 2 | Dashboard layout + sidebar | 2 new |
| 3 | React Query hooks | 4 new |
| 4 | Overview refactor + stats row | 1 new, 1 modified |
| 5 | Products management | 4 new |
| 6 | RFQ management | 4 new |
| 7 | Analytics refactor + settings | 1 new, 1 modified |

**Total: 18 new files, 3 modified, 7 commits**
