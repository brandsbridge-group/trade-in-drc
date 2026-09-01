"use server";

import { z } from "zod";
import { dbId } from "@/lib/validation/db-id";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { COMPANY_STATUS, VERIFICATION_TIER } from "@/constants/status";
import { HOME_COUNTRY } from "@/config/geo";
import { toExternalHref } from "@/lib/url/external-href";
import {
  REGISTRATION_PROFILES,
  DRC_INTERESTS,
  ENTRY_TIMELINES,
  LEGAL_FORMS,
  EMPLOYEE_RANGES,
  SPOKEN_LANGUAGES,
  OPPORTUNITY_INTERESTS,
  PREFERRED_CONTACTS,
} from "./constants";
import { coercePlanForProfile } from "./types";
import type { RegisterResult, RegisterSubmitPayload } from "./types";

type ParsedPayload = z.infer<typeof payloadSchema>;

const optional = z.string().trim().max(300).optional().or(z.literal(""));

const payloadSchema = z
  .object({
    plan: z.enum(["free", "verified", "premium"]),
    data: z.object({
      profile: z.enum(REGISTRATION_PROFILES),
      country: z.string().trim().min(2).max(120),
      companyLegalName: z.string().trim().min(2).max(200),
      tradingName: optional,
      rccmNumber: z.string().trim().min(1).max(80),
      // DRC-only registries — enforced for Congolese applicants below.
      nationalId: z.string().trim().max(80).optional().or(z.literal("")),
      nif: z.string().trim().max(80).optional().or(z.literal("")),
      yearEstablished: z.string().trim().min(4).max(4),
      legalForm: z.enum(LEGAL_FORMS),
      employees: z.enum(EMPLOYEE_RANGES),
      sectorId: dbId(),
      productsServices: z.string().trim().max(2000).optional().or(z.literal("")),
      province: z.string().trim().max(80).optional().or(z.literal("")),
      city: z.string().trim().max(120).optional().or(z.literal("")),
      website: optional,
      officialEmail: z.string().trim().email().max(200),
      dialCode: z.string().trim().min(2).max(6),
      phone: z.string().trim().min(3).max(40),
      altPhone: z.string().trim().max(40).optional().or(z.literal("")),
      contactPerson: z.string().trim().min(2).max(160),
      jobTitle: z.string().trim().min(1).max(160),
      preferredContact: z.enum(PREFERRED_CONTACTS).optional().or(z.literal("")),
      languages: z.array(z.enum(SPOKEN_LANGUAGES)).min(1),
      interests: z.array(z.enum(OPPORTUNITY_INTERESTS)).default([]),
      interestOther: z.string().trim().max(300).optional().or(z.literal("")),
      // International-only (customer design 2026-07-28); empty for Congolese.
      headOffice: z.string().trim().max(300).optional().or(z.literal("")),
      annualTurnover: z.string().trim().max(40).optional().or(z.literal("")),
      currentMarkets: z.string().trim().max(300).optional().or(z.literal("")),
      certifications: z.string().trim().max(300).optional().or(z.literal("")),
      drcInterests: z.array(z.enum(DRC_INTERESTS)).default([]),
      targetProvinces: z.array(z.string().trim().max(80)).max(30).default([]),
      entryTimeline: z.enum(ENTRY_TIMELINES).optional().or(z.literal("")),
      marketInterestNotes: z.string().trim().max(3000).optional().or(z.literal("")),
      rccmCertName: z.string().trim().min(1).max(260),
      nifDocName: z.string().trim().max(260).optional().or(z.literal("")),
      logoName: z.string().trim().max(260).optional().or(z.literal("")),
      additionalName: z.string().trim().max(260).optional().or(z.literal("")),
    }),
  })
  // Each profile enforces its own required set. The profile is the applicant's
  // explicit declaration on the chooser cards — not inferred from country, so a
  // DRC-registered subsidiary of a foreign group can still declare international.
  .superRefine((val, ctx) => {
    const d = val.data;
    if (d.profile === "international") {
      for (const key of ["headOffice", "entryTimeline", "marketInterestNotes"] as const) {
        if (!String(d[key] ?? "").trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["data", key],
            message: `${key} is required for an international registration`,
          });
        }
      }
      if (d.drcInterests.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["data", "drcInterests"],
          message: "Select at least one DRC market interest",
        });
      }
      return;
    }
    if (d.interests.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["data", "interests"],
        message: "Select at least one opportunity of interest",
      });
    }
    if (val.data.country !== HOME_COUNTRY) return;
    const required: (keyof typeof val.data)[] = [
      "nationalId",
      "nif",
      "province",
      "city",
      "nifDocName",
    ];
    for (const key of required) {
      if (!String(val.data[key] ?? "").trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["data", key],
          message: `${key} is required for companies registered in the DRC`,
        });
      }
    }
  });

/**
 * Compose a human-readable notes block appended to `description` so admins
 * scanning the pending company at /admin/companies see the legal identity and
 * positioning at a glance (the structured copy lives in verification_summary).
 */
function buildDescription(p: ParsedPayload): string {
  const d = p.data;
  const lines = [
    d.productsServices?.trim() ? d.productsServices.trim() : null,
    "",
    "— Registration intake —",
    `Chosen tier: ${p.plan}`,
    `Legal name: ${d.companyLegalName}`,
    d.tradingName ? `Trading name: ${d.tradingName}` : null,
    `RCCM: ${d.rccmNumber}`,
    `National ID: ${d.nationalId}`,
    `NIF: ${d.nif}`,
    `Year established: ${d.yearEstablished}`,
    `Legal form: ${d.legalForm}`,
    `Employees: ${d.employees}`,
    `Contact: ${d.contactPerson} (${d.jobTitle})`,
    `Languages: ${d.languages.join(", ")}`,
    `Opportunities: ${d.interests.join(", ")}${d.interestOther ? ` — ${d.interestOther}` : ""}`,
    d.altPhone ? `Alt phone: ${d.altPhone}` : null,
    `Documents: RCCM="${d.rccmCertName}", NIF="${d.nifDocName}"${d.logoName ? `, Logo="${d.logoName}"` : ""}${d.additionalName ? `, Extra="${d.additionalName}"` : ""}`,
  ].filter((l) => l !== null);
  return lines.join("\n");
}

/**
 * Final submit for the register-company wizard (customer design 6).
 *
 * Auth is required: unauthenticated callers get {ok:false, error:"auth"} and the
 * UI routes them to /login?redirect=/register-company. Authenticated callers get
 * a `companies` row inserted via the admin client (owner_id = user, status
 * pending, verification_tier none — admins drive the actual tier later). The
 * DRC-specific legal identifiers, positioning, chosen tier and uploaded document
 * FILE NAMES are stored in `verification_summary.registration_intake` (JSON) and
 * mirrored into `description` so they are visible at /admin/companies and
 * /admin/verifications. The document BINARIES are uploaded separately by the
 * client immediately after this action resolves — see upload-documents.ts.
 */
export async function registerCompany(
  input: RegisterSubmitPayload
): Promise<RegisterResult> {
  // P0-2: any thrown error (network drop, a redeploy invalidating this
  // server-action id, a throw inside createAdminClient) must still resolve
  // to a typed result — otherwise the client's await never settles and the
  // submit button stays disabled forever.
  try {
    return await doRegisterCompany(input);
  } catch (e) {
    console.error("[registerCompany] threw", e);
    return { ok: false, error: "server" };
  }
}

async function doRegisterCompany(
  input: RegisterSubmitPayload
): Promise<RegisterResult> {
  const parsed = payloadSchema.safeParse(input);
  if (!parsed.success) {
    // P0-5: return `issue.path` only — never `issue.message`. Zod's message
    // strings are raw English and would leak untranslated into the FR UI.
    // `path` looks like ["data", "officialEmail"]; path[1] is the
    // RegisterFormData key the wizard needs to jump to the right step.
    const fields = parsed.error.issues
      .map((i) => i.path[1])
      .filter((p): p is string => typeof p === "string");
    console.error("[registerCompany] invalid", fields);
    return { ok: false, error: "invalid", fields };
  }
  const { data } = parsed.data;
  const plan = coercePlanForProfile(data.profile, parsed.data.plan);

  // Require an authenticated session (RLS-independent gate).
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "auth" };

  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from("companies")
    .insert({
      owner_id: user.id,
      name: data.companyLegalName,
      description: buildDescription({ plan, data }),
      sector_id: data.sectorId,
      registration_profile: data.profile,
      country: data.country,
      city: data.city,
      province: data.province || null,
      // Applicants type "www.example.com"; store a real URL so profile links work.
      website: toExternalHref(data.website),
      contact_email: data.officialEmail,
      // Store the phone in dialable international form.
      contact_phone: `${data.dialCode} ${data.phone}`.trim(),
      status: COMPANY_STATUS.PENDING,
      verification_tier: VERIFICATION_TIER.NONE,
      verification_summary: {
        registration_intake: {
          chosen_tier: plan,
          registration_profile: data.profile,
          international: data.profile === "international"
            ? {
                head_office: data.headOffice || null,
                annual_turnover: data.annualTurnover || null,
                current_markets: data.currentMarkets || null,
                certifications: data.certifications || null,
                drc_interests: data.drcInterests,
                target_provinces: data.targetProvinces,
                entry_timeline: data.entryTimeline || null,
                notes: data.marketInterestNotes || null,
              }
            : null,
          legal: {
            country: data.country,
            legal_name: data.companyLegalName,
            trading_name: data.tradingName || null,
            rccm_number: data.rccmNumber,
            national_id: data.nationalId || null,
            nif: data.nif || null,
            year_established: data.yearEstablished,
            legal_form: data.legalForm,
            employees: data.employees,
          },
          professional: {
            products_services: data.productsServices || null,
            alt_phone: data.altPhone || null,
          },
          positioning: {
            contact_person: data.contactPerson,
            job_title: data.jobTitle,
            preferred_contact: data.preferredContact || null,
            languages: data.languages,
            interests: data.interests,
            interest_other: data.interestOther || null,
          },
          // File NAMES only, for a human-readable summary an admin can scan
          // without opening each document. The actual binaries are uploaded
          // separately, client-side, to the `company-documents` bucket and
          // recorded in `company_documents` — see upload-documents.ts. That
          // upload can only happen AFTER this insert commits (the bucket's
          // owner-path RLS resolves against companies.owner_id), which is
          // why it isn't done in this server action.
          documents: {
            rccm_certificate: data.rccmCertName,
            tax_identification: data.nifDocName,
            company_logo: data.logoName || null,
            additional: data.additionalName || null,
          },
        },
      },
    })
    .select("id")
    .single();

  if (error || !row) {
    console.error("[registerCompany]", error?.code, error?.message);
    return { ok: false, error: "server" };
  }
  return { ok: true, companyId: row.id };
}
