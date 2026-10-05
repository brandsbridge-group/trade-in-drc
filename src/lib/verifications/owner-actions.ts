"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { dbId } from "@/lib/validation/db-id";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { COMPANY_STATUS, VERIFICATION_DECISION } from "@/constants/status";
import { EMPLOYEE_RANGES, LEGAL_FORMS } from "@/components/register/market/constants";
import { legalFromSummary, missingDocTypes, missingLegalFields } from "./required-documents";

const submitSchema = z.object({
  companyId: dbId(),
  locale: z.string().min(2).max(5),
});

export type SubmitForReviewError =
  | "invalid_input"
  | "not_authenticated"
  | "company_not_found"
  | "not_owner"
  | "not_submittable"
  | "missing_documents"
  | "missing_legal"
  | "update_failed";

export interface SubmitForReviewResult {
  ok: boolean;
  error?: SubmitForReviewError;
  /** `company_documents.type` values still required (error = missing_documents). */
  missing?: string[];
}

/**
 * Owner's "Send for verification": moves a company out of `pending_documents`
 * (or back out of `rejected`) into `pending`, the status the staff queue reads
 * (00047). Owners cannot write `companies.status` themselves — the trust
 * columns are revoked from them — so the write goes through the service-role
 * client after an ownership check, and only once the required documents are
 * on file.
 */
export async function submitCompanyForReview(
  input: z.input<typeof submitSchema>
): Promise<SubmitForReviewResult> {
  const parsed = submitSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid_input" };
  const { companyId, locale } = parsed.data;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "not_authenticated" };

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("owner_id, status, country, verification_summary")
    .eq("id", companyId)
    .maybeSingle();
  if (companyError || !company) return { ok: false, error: "company_not_found" };
  if (company.owner_id !== user.id) return { ok: false, error: "not_owner" };

  const wasRejected = company.status === COMPANY_STATUS.REJECTED;
  if (company.status !== COMPANY_STATUS.PENDING_DOCUMENTS && !wasRejected) {
    return { ok: false, error: "not_submittable" };
  }

  // The numbers a reviewer checks the documents against must be on file too.
  if (missingLegalFields(company.country, legalFromSummary(company.verification_summary)).length > 0) {
    return { ok: false, error: "missing_legal" };
  }

  const admin = createAdminClient();
  const { data: documents, error: documentsError } = await admin
    .from("company_documents")
    .select("type")
    .eq("company_id", companyId);
  if (documentsError) return { ok: false, error: "update_failed" };

  const missing = missingDocTypes(company.country, (documents ?? []).map((d) => d.type));
  if (missing.length > 0) return { ok: false, error: "missing_documents", missing };

  // Every send leaves an event (00058): the console reads the submission date,
  // the waiting time and "whose turn is it" from this trail — a first send used
  // to leave nothing, so the queue showed the company's creation date.
  const { error: reviewError } = await admin.from("verification_reviews").insert({
    company_id: companyId,
    admin_id: user.id,
    decision: wasRejected ? VERIFICATION_DECISION.RESUBMITTED : VERIFICATION_DECISION.SUBMITTED,
    notes: null,
  });
  if (reviewError) return { ok: false, error: "update_failed" };

  const { error: updateError } = await admin
    .from("companies")
    .update({ status: COMPANY_STATUS.PENDING })
    .eq("id", companyId);
  if (updateError) return { ok: false, error: "update_failed" };

  revalidatePath(`/${locale}/dashboard`);
  revalidatePath(`/${locale}/console/verifications`);
  return { ok: true };
}

const legalSchema = z.object({
  companyId: dbId(),
  locale: z.string().min(2).max(5),
  legal: z.object({
    registrationNumber: z.string().trim().max(80),
    nationalId: z.string().trim().max(80),
    taxId: z.string().trim().max(80),
    legalForm: z.enum(LEGAL_FORMS).or(z.literal("")),
    yearEstablished: z.string().trim().regex(/^(\d{4})?$/),
    employees: z.enum(EMPLOYEE_RANGES).or(z.literal("")),
  }),
});

export type LegalIdentityInput = z.input<typeof legalSchema>["legal"];

export interface SaveLegalResult {
  ok: boolean;
  error?: "invalid_input" | "not_authenticated" | "company_not_found" | "not_owner" | "locked" | "update_failed";
}

/**
 * Owner's legal identifiers (RCCM / registration number, national ID, tax ID,
 * legal form, year, headcount), filed next to the documents they back up.
 *
 * They live in `verification_summary.registration_intake.legal` — the shape
 * the registration form writes and the staff review screens read — and
 * `verification_summary` is a trust column owners cannot write (RLS pins it),
 * hence the service-role write behind an ownership check. Locked once the
 * company is verified: the identifiers are then part of what was approved.
 */
export async function saveCompanyLegalIdentity(input: z.input<typeof legalSchema>): Promise<SaveLegalResult> {
  const parsed = legalSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid_input" };
  const { companyId, locale, legal } = parsed.data;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "not_authenticated" };

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("owner_id, status, verification_summary")
    .eq("id", companyId)
    .maybeSingle();
  if (companyError || !company) return { ok: false, error: "company_not_found" };
  if (company.owner_id !== user.id) return { ok: false, error: "not_owner" };
  if (company.status === COMPANY_STATUS.VERIFIED) return { ok: false, error: "locked" };

  // Merge: keep every other key of the summary (intake of the other steps, review data).
  const summary = (company.verification_summary ?? {}) as {
    registration_intake?: { legal?: Record<string, unknown> } & Record<string, unknown>;
  } & Record<string, unknown>;
  const intake = summary.registration_intake ?? {};
  const next = {
    ...summary,
    registration_intake: {
      ...intake,
      legal: {
        ...(intake.legal ?? {}),
        rccm_number: legal.registrationNumber || null,
        national_id: legal.nationalId || null,
        nif: legal.taxId || null,
        legal_form: legal.legalForm || null,
        year_established: legal.yearEstablished || null,
        employees: legal.employees || null,
      },
    },
  };

  const { error: updateError } = await createAdminClient()
    .from("companies")
    .update({ verification_summary: next })
    .eq("id", companyId);
  if (updateError) return { ok: false, error: "update_failed" };

  revalidatePath(`/${locale}/dashboard`);
  return { ok: true };
}
