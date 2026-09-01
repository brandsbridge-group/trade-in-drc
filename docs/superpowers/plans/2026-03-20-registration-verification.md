# Company Registration & Verification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a complete 6-step company registration flow with document uploads, and an admin verification queue with review detail page, notes, and resubmission support.

**Architecture:** Multi-step client-side form (Zustand for form state persistence across steps), Supabase Storage for document/image uploads, two-phase submit (upload files → insert DB rows). Admin verification uses server components for data fetching with client interactive elements.

**Tech Stack:** React Hook Form + Zod validation, Zustand (form state), Supabase Storage, shadcn/ui components

---

## File Structure

### Files to Create

| File | Responsibility |
|---|---|
| `src/app/[locale]/(auth)/register/page.tsx` | New 6-step registration page (replaces current) |
| `src/app/[locale]/admin/verifications/[id]/page.tsx` | Review detail page for a single company |
| `src/components/registration/registration-form.tsx` | Main form orchestrator (step management) |
| `src/components/registration/step-basic-info.tsx` | Step 1: company name, sector, description |
| `src/components/registration/step-contact.tsx` | Step 2: phone, email, address, website |
| `src/components/registration/step-products.tsx` | Step 3: initial product listings |
| `src/components/registration/step-documents.tsx` | Step 4: document uploads |
| `src/components/registration/step-branding.tsx` | Step 5: logo & photos |
| `src/components/registration/step-review.tsx` | Step 6: review & submit |
| `src/components/registration/progress-bar.tsx` | Step progress indicator |
| `src/components/admin/verification-detail.tsx` | Company review panel with documents and decision |
| `src/components/admin/document-viewer.tsx` | Document preview/download component |
| `src/components/admin/decision-panel.tsx` | Approve/Reject/Request More Info + notes |
| `src/lib/registration/schema.ts` | Zod validation schemas per step |
| `src/lib/registration/store.ts` | Zustand store for multi-step form state |
| `src/lib/registration/actions.ts` | Server action: two-phase submit (upload → insert) |

### Files to Modify

| File | Change |
|---|---|
| `src/app/[locale]/admin/verifications/page.tsx` | Add filter tabs, document status dots, link to detail page |
| `src/app/[locale]/admin/page.tsx` | Add recent registrations list |
| `src/app/[locale]/dashboard/page.tsx` | Show verification status, rejection reason, resubmit action |

### Files to Delete

| File | Reason |
|---|---|
| `src/app/[locale]/register/page.tsx` | Replaced by new registration under (auth) group |

---

## Task 1: Registration Zod Schemas & Zustand Store

**Files:**
- Create: `src/lib/registration/schema.ts`
- Create: `src/lib/registration/store.ts`

- [ ] **Step 1: Create Zod schemas per step** (`src/lib/registration/schema.ts`)

Six schemas — one per step:
```typescript
import { z } from "zod";

export const basicInfoSchema = z.object({
  name: z.string().min(2, "Company name is required"),
  sectorId: z.string().min(1, "Sector is required"),
  description: z.string().min(20, "Description must be at least 20 characters"),
});

export const contactSchema = z.object({
  contactEmail: z.string().email("Valid email required"),
  contactPhone: z.string().min(5, "Phone number required"),
  address: z.string().min(5, "Address required"),
  city: z.string().min(2, "City required"),
  province: z.string().min(2, "Province required"),
  website: z.string().url().optional().or(z.literal("")),
});

export const productsSchema = z.object({
  products: z.array(z.object({
    name: z.string().min(2),
    description: z.string().min(10),
    categoryId: z.string().optional(),
  })).min(1, "Add at least one product"),
});

export const documentsSchema = z.object({
  businessLicense: z.instanceof(File, { message: "Business license required" }),
  taxRegistration: z.instanceof(File, { message: "Tax registration required" }),
  proofOfAddress: z.instanceof(File, { message: "Proof of address required" }),
});

export const brandingSchema = z.object({
  logo: z.instanceof(File).optional(),
  photos: z.array(z.instanceof(File)).optional(),
});

// Step 6 has no schema — it's a review page

export type BasicInfoData = z.infer<typeof basicInfoSchema>;
export type ContactData = z.infer<typeof contactSchema>;
export type ProductsData = z.infer<typeof productsSchema>;
export type DocumentsData = z.infer<typeof documentsSchema>;
export type BrandingData = z.infer<typeof brandingSchema>;
```

- [ ] **Step 2: Create Zustand store** (`src/lib/registration/store.ts`)

```typescript
import { create } from "zustand";
import type { BasicInfoData, ContactData, ProductsData } from "./schema";

interface RegistrationState {
  currentStep: number;
  basicInfo: BasicInfoData | null;
  contact: ContactData | null;
  products: ProductsData | null;
  documentFiles: { businessLicense: File | null; taxRegistration: File | null; proofOfAddress: File | null };
  brandingFiles: { logo: File | null; photos: File[] };
  submitting: boolean;
  setStep: (step: number) => void;
  setBasicInfo: (data: BasicInfoData) => void;
  setContact: (data: ContactData) => void;
  setProducts: (data: ProductsData) => void;
  setDocumentFiles: (files: Partial<RegistrationState["documentFiles"]>) => void;
  setBrandingFiles: (files: Partial<RegistrationState["brandingFiles"]>) => void;
  setSubmitting: (submitting: boolean) => void;
  reset: () => void;
}

const initialState = {
  currentStep: 1,
  basicInfo: null,
  contact: null,
  products: null,
  documentFiles: { businessLicense: null, taxRegistration: null, proofOfAddress: null },
  brandingFiles: { logo: null, photos: [] },
  submitting: false,
};

export const useRegistrationStore = create<RegistrationState>((set) => ({
  ...initialState,
  setStep: (step) => set({ currentStep: step }),
  setBasicInfo: (data) => set({ basicInfo: data }),
  setContact: (data) => set({ contact: data }),
  setProducts: (data) => set({ products: data }),
  setDocumentFiles: (files) => set((state) => ({ documentFiles: { ...state.documentFiles, ...files } })),
  setBrandingFiles: (files) => set((state) => ({ brandingFiles: { ...state.brandingFiles, ...files } })),
  setSubmitting: (submitting) => set({ submitting }),
  reset: () => set(initialState),
}));
```

- [ ] **Step 3: Commit**
```bash
git add src/lib/registration/
git commit -m "feat: add registration Zod schemas and Zustand form store"
```

---

## Task 2: Registration Form Components (Steps 1-3)

**Files:**
- Create: `src/components/registration/progress-bar.tsx`
- Create: `src/components/registration/step-basic-info.tsx`
- Create: `src/components/registration/step-contact.tsx`
- Create: `src/components/registration/step-products.tsx`

- [ ] **Step 1: Create progress bar** — thin bar showing 6 segments, current step highlighted with brand color. Compact: h-1 bars with step labels below in text-xs.

- [ ] **Step 2: Create Step 1 — Basic Info** — form fields: company name (input), sector (select dropdown populated from Supabase `sectors` table), description (textarea). Validate with `basicInfoSchema`. On continue, save to Zustand store and advance step.

- [ ] **Step 3: Create Step 2 — Contact Details** — fields: contactEmail, contactPhone, address, city, province (all inputs), website (optional input). Validate with `contactSchema`.

- [ ] **Step 4: Create Step 3 — Products** — dynamic list: add/remove product entries. Each has name (input), description (textarea), categoryId (optional select). Minimum 1 product. Validate with `productsSchema`.

- [ ] **Step 5: Commit**
```bash
git add src/components/registration/
git commit -m "feat: add registration steps 1-3 (basic info, contact, products)"
```

---

## Task 3: Registration Form Components (Steps 4-6) & Submit Action

**Files:**
- Create: `src/components/registration/step-documents.tsx`
- Create: `src/components/registration/step-branding.tsx`
- Create: `src/components/registration/step-review.tsx`
- Create: `src/components/registration/registration-form.tsx`
- Create: `src/lib/registration/actions.ts`

- [ ] **Step 1: Create Step 4 — Documents** — file upload fields for businessLicense, taxRegistration, proofOfAddress. Show file name after selection, allow re-selection. Store File objects in Zustand.

- [ ] **Step 2: Create Step 5 — Branding** — optional logo upload (single file), optional photos upload (multiple files). Preview thumbnails after selection.

- [ ] **Step 3: Create Step 6 — Review** — read-only summary of all previous steps. Show company name, sector, contact info, product count, document filenames, logo preview. "Submit for Verification" button.

- [ ] **Step 4: Create registration form orchestrator** (`registration-form.tsx`) — renders current step component based on `useRegistrationStore().currentStep`. Back/Continue navigation. On final submit, calls the server action.

- [ ] **Step 5: Create submit server action** (`src/lib/registration/actions.ts`) — two-phase:
  1. Upload all files to Supabase Storage (documents → `company-documents`, logo/photos → `company-assets`)
  2. Insert company row + company_documents rows + products rows
  3. If DB insert fails, delete orphaned storage files
  4. Return success or error

- [ ] **Step 6: Commit**
```bash
git add src/components/registration/ src/lib/registration/
git commit -m "feat: add registration steps 4-6, form orchestrator, submit action"
```

---

## Task 4: Registration Page & Route Setup

**Files:**
- Create: `src/app/[locale]/(auth)/register/page.tsx`
- Delete: `src/app/[locale]/register/page.tsx`

- [ ] **Step 1: Create new registration page** under `(auth)` route group. Imports `RegistrationForm`. Fetches sectors from Supabase (server component) and passes as props. Page header: "Register Your Company" with subtitle. Compact layout matching design principles.

- [ ] **Step 2: Delete old registration page** at `src/app/[locale]/register/page.tsx`

- [ ] **Step 3: Verify the page renders** — `npm run dev`, navigate to `/en/register`

- [ ] **Step 4: Commit**
```bash
git add src/app/
git commit -m "feat: replace registration page with 6-step multi-step form"
```

---

## Task 5: Admin Verification Queue Enhancement

**Files:**
- Modify: `src/app/[locale]/admin/verifications/page.tsx`
- Create: `src/app/[locale]/admin/verifications/[id]/page.tsx`
- Create: `src/components/admin/verification-detail.tsx`
- Create: `src/components/admin/document-viewer.tsx`
- Create: `src/components/admin/decision-panel.tsx`

- [ ] **Step 1: Enhance verification queue page** — add filter tabs (All / New / Resubmitted), document status dots (green for uploaded, amber for missing), "Review →" link to detail page instead of inline approve/reject. Show submission date, resubmitted badge.

- [ ] **Step 2: Create document viewer** — displays document name, type badge, "View" link that opens in new tab. Shows status indicator per document.

- [ ] **Step 3: Create decision panel** — three actions: Approve (green), Reject (red), Request More Info (amber). Textarea for notes (required for reject/request more info). On submit, creates `verification_reviews` row and updates `companies.status`.

- [ ] **Step 4: Create verification detail page** — two-column layout: left (company info, products, documents via document-viewer), right (decision panel). Fetches company by ID with all related data (documents, products, past reviews).

- [ ] **Step 5: Commit**
```bash
git add src/app/[locale]/admin/verifications/ src/components/admin/
git commit -m "feat: add verification detail page with document review and decision panel"
```

---

## Task 6: Dashboard Verification Status & Resubmission

**Files:**
- Modify: `src/app/[locale]/dashboard/page.tsx`

- [ ] **Step 1: Show verification status on dashboard** — for each company, show status badge (Verified/Pending/Rejected). If rejected, show rejection reason from latest `verification_reviews` row. If `more_info_requested`, show admin notes.

- [ ] **Step 2: Add resubmit action** — for rejected companies, show "Resubmit for Review" button. On click, updates `companies.status` to `pending` and creates a `verification_reviews` row with `decision: 'resubmitted'`.

- [ ] **Step 3: Commit**
```bash
git add src/app/[locale]/dashboard/page.tsx
git commit -m "feat: show verification status and resubmit action on dashboard"
```

---

## Summary

| Task | Description | Files |
|---|---|---|
| 1 | Zod schemas & Zustand store | 2 new |
| 2 | Registration steps 1-3 | 4 new |
| 3 | Registration steps 4-6, orchestrator, submit action | 5 new |
| 4 | Registration page & route | 1 new, 1 deleted |
| 5 | Admin verification queue + detail page | 1 modified, 4 new |
| 6 | Dashboard status & resubmission | 1 modified |

**Total: 16 new files, 2 modified, 1 deleted, 6 commits**
