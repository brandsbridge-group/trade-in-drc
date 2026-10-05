"use server";

import { z } from "zod";
import { dbId } from "@/lib/validation/db-id";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { COMPANY_STATUS, VERIFICATION_TIER } from "@/constants/status";
import { HOME_COUNTRY } from "@/config/geo";
import { toExternalHref } from "@/lib/url/external-href";
import { isAdmin } from "@/constants/roles";
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
import type { RegisterResult, RegisterSubmitPayload } from "./types";

type ParsedPayload = z.infer<typeof payloadSchema>;

const optional = z.string().trim().max(300).optional().or(z.literal(""));

const payloadSchema = z
  .object({
    // The plan is never chosen in the short form (upgrades happen from the
    // dashboard); accepted for payload compatibility, always stored as free.
    plan: z.enum(["free", "verified", "premium"]).optional(),
    data: z.object({
      profile: z.enum(REGISTRATION_PROFILES),
      country: z.string().trim().min(2).max(120),
      companyLegalName: z.string().trim().min(2).max(200),
      tradingName: optional,
      // Verification fields: collected later by the dashboard's "Get
      // verified" action, so optional at creation.
      rccmNumber: optional,
      // DRC-only registries — enforced for Congolese applicants below.
      nationalId: z.string().trim().max(80).optional().or(z.literal("")),
      nif: z.string().trim().max(80).optional().or(z.literal("")),
      // Profile fields: collected later by "Complete your profile".
      yearEstablished: z.string().trim().length(4).optional().or(z.literal("")),
      legalForm: z.enum(LEGAL_FORMS).optional().or(z.literal("")),
      employees: z.enum(EMPLOYEE_RANGES).optional().or(z.literal("")),
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
      jobTitle: z.string().trim().max(160).optional().or(z.literal("")),
      preferredContact: z.enum(PREFERRED_CONTACTS).optional().or(z.literal("")),
      languages: z.array(z.enum(SPOKEN_LANGUAGES)).default([]),
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
      rccmCertName: z.string().trim().max(260).optional().or(z.literal("")),
      nifDocName: z.string().trim().max(260).optional().or(z.literal("")),
      logoName: z.string().trim().max(260).optional().or(z.literal("")),
      additionalName: z.string().trim().max(260).optional().or(z.literal("")),
    }),
  })
  // Short form: only location differs per profile. Congolese companies pick
  // a province + city; international ones give their head-office city.
  .superRefine((val, ctx) => {
    const d = val.data;
    const required: (keyof typeof d)[] =
      d.profile === "congolese" && d.country === HOME_COUNTRY
        ? ["province", "city"]
        : ["city"];
    for (const key of required) {
      if (!String(d[key] ?? "").trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["data", key],
          message: `${key} is required`,
        });
      }
    }
  });

/**
 * `description` is the PUBLIC pitch shown on the company profile, so it holds
 * only what the owner wrote about their activity. It used to carry an
 * "— Registration intake —" block (legal name, contact person, DRC interests)
 * for reviewers: that leaked the contact's name onto the public page and made
 * an empty profile look described. Reviewers read the same data, structured,
 * from `verification_summary.registration_intake`.
 */
function buildDescription(d: ParsedPayload["data"]): string | null {
  return d.productsServices?.trim() || null;
}

/**
 * Submit of the short, signed-in-only company form.
 *
 * The form is never rendered without a session (register-company page +
 * ProfileGate), so this has a single path: insert a `companies` row via the
 * admin client with owner_id = the caller, status `pending_documents`, plan
 * free. There is deliberately no one-company-per-account check. The
 * no-session guard below stays as defence in depth ({ok:false, error:"auth"}).
 * Legal identifiers, documents and plan are added later from the dashboard;
 * the intake JSON keeps their keys (null) so admin screens read one shape.
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
  // Plans are upgraded from the dashboard, never at creation.
  const plan = "free" as const;

  // Require an authenticated session (RLS-independent gate).
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "auth" };

  // Staff accounts run the console; they never own a company (the page already
  // redirects them — this is the gate that holds if it is bypassed).
  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type, staff_role, role")
    .eq("id", user.id)
    .maybeSingle();
  if (isAdmin(profile)) return { ok: false, error: "staff" };

  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from("companies")
    .insert({
      owner_id: user.id,
      name: data.companyLegalName,
      description: buildDescription(data),
      sector_id: data.sectorId,
      registration_profile: data.profile,
      country: data.country,
      city: data.city || null,
      province: data.province || null,
      // Applicants type "www.example.com"; store a real URL so profile links work.
      website: toExternalHref(data.website),
      contact_email: data.officialEmail,
      // Store the phone in dialable international form.
      contact_phone: `${data.dialCode} ${data.phone}`.trim(),
      // 00047: not in the admin queue until the owner submits documents.
      status: COMPANY_STATUS.PENDING_DOCUMENTS,
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
            rccm_number: data.rccmNumber || null,
            national_id: data.nationalId || null,
            nif: data.nif || null,
            year_established: data.yearEstablished || null,
            legal_form: data.legalForm || null,
            employees: data.employees || null,
          },
          professional: {
            products_services: data.productsServices || null,
            alt_phone: data.altPhone || null,
          },
          positioning: {
            contact_person: data.contactPerson,
            job_title: data.jobTitle || null,
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
            rccm_certificate: data.rccmCertName || null,
            tax_identification: data.nifDocName || null,
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
