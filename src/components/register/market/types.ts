import { HOME_COUNTRY, DEFAULT_DIAL_CODE } from "@/config/geo";
import { stepsForProfile } from "./constants";
import type { PlanId, RegistrationProfile, WizardStep } from "./constants";

/** All fields collected across the wizard. Documents hold file NAMES only —
 *  the real File objects live in RegisterWizard's `documentFiles` state
 *  (not persisted here / in the sessionStorage draft) and are uploaded to
 *  Storage after the company row exists; see upload-documents.ts. */
export interface RegisterFormData {
  /** Declared on the "Choose your company profile" cards. */
  profile: RegistrationProfile;
  // 1. Legal Information
  /** Country of registration — drives which legal identifiers apply. */
  country: string;
  companyLegalName: string;
  tradingName: string;
  rccmNumber: string;
  nationalId: string;
  nif: string;
  yearEstablished: string;
  legalForm: string;
  employees: string;
  // 2. Professional Information
  sectorId: string;
  productsServices: string;
  province: string;
  city: string;
  website: string;
  officialEmail: string;
  /** International dial code paired with `phone` / `altPhone`. */
  dialCode: string;
  phone: string;
  altPhone: string;
  // 3. Partnership Positioning
  contactPerson: string;
  jobTitle: string;
  preferredContact: string;
  languages: string[];
  interests: string[];
  interestOther: string;
  // International-only fields (customer design 2026-07-28). Congolese
  // applicants never see these and leave them empty.
  /** Step 1 — Head Office Address (street, city, country). */
  headOffice: string;
  /** Step 2 — Business Profile. */
  annualTurnover: string;
  currentMarkets: string;
  certifications: string;
  /** Step 3 — DRC Market Interest. */
  drcInterests: string[];
  targetProvinces: string[];
  entryTimeline: string;
  marketInterestNotes: string;
  // 4. Documents Upload (file names only)
  rccmCertName: string;
  nifDocName: string;
  logoName: string;
  additionalName: string;
}

export const EMPTY_FORM: RegisterFormData = {
  profile: "congolese",
  country: HOME_COUNTRY,
  companyLegalName: "",
  tradingName: "",
  rccmNumber: "",
  nationalId: "",
  nif: "",
  yearEstablished: "",
  legalForm: "",
  employees: "",
  sectorId: "",
  productsServices: "",
  province: "",
  city: "",
  website: "",
  officialEmail: "",
  dialCode: DEFAULT_DIAL_CODE,
  phone: "",
  altPhone: "",
  contactPerson: "",
  jobTitle: "",
  preferredContact: "",
  languages: [],
  interests: [],
  interestOther: "",
  headOffice: "",
  annualTurnover: "",
  currentMarkets: "",
  certifications: "",
  drcInterests: [],
  targetProvinces: [],
  entryTimeline: "",
  marketInterestNotes: "",
  rccmCertName: "",
  nifDocName: "",
  logoName: "",
  additionalName: "",
};

export interface SectorOption {
  id: string;
  label: string;
}

export interface RegisterSubmitPayload {
  plan: PlanId;
  data: RegisterFormData;
}

export interface RegisterResult {
  ok: boolean;
  companyId?: string;
  error?: "auth" | "invalid" | "server";
  /**
   * `RegisterFormData` key names the server rejected (from `issue.path`,
   * never `issue.message` — raw Zod English text must never reach the FR
   * UI). Used to re-outline the offending fields and jump the wizard to the
   * right step (see `stepForInvalidFields`).
   */
  fields?: string[];
}

/** True when the company is registered in the DRC (the default). */
export function isHomeCountry(data: RegisterFormData): boolean {
  return data.country === HOME_COUNTRY;
}

/**
 * Required-field keys per step. Congolese registries (RCCM, National ID, NIF)
 * and the province list only exist for DRC-registered companies, so foreign
 * applicants get the international equivalents instead of being blocked —
 * the portal accepts international registrations too.
 */
export function requiredForStep(
  step: WizardStep,
  data: RegisterFormData
): (keyof RegisterFormData)[] {
  // The DECLARED PROFILE decides which documents and registries apply — not the
  // country. A foreign group's DRC-registered subsidiary may legitimately
  // declare "international" (migration 00038 says so explicitly); keying off
  // country would then demand a Congolese NIF document it does not have.
  // `country` is geography only: it picks the province list vs a free-text
  // region, and the dial code.
  const congolese = !isInternational(data);
  const home = isHomeCountry(data);

  /** Keys that only apply to the Congolese path. Typed, so a typo won't compile. */
  const congoleseOnly = (
    ...keys: (keyof RegisterFormData)[]
  ): (keyof RegisterFormData)[] => (congolese ? keys : []);

  switch (step) {
    case "legal":
      return [
        "country",
        "companyLegalName",
        // Every jurisdiction issues some registration number; only the DRC-specific
        // national ID and NIF are dropped for foreign companies.
        "rccmNumber",
        ...congoleseOnly("nationalId", "nif"),
        "yearEstablished",
        "legalForm",
        "employees",
      ];
    case "professional":
      // Province is the one genuinely geographic requirement: the 26-province
      // list only exists for DRC-based companies.
      return [
        "sectorId",
        ...((home ? ["province"] : []) as (keyof RegisterFormData)[]),
        "city",
        "officialEmail",
        "phone",
      ];
    case "positioning":
      return ["contactPerson", "jobTitle", "languages", "interests"];
    case "documents":
      // Shared by both paths — the NIF document is Congolese-only.
      return ["rccmCertName", ...congoleseOnly("nifDocName")];

    // ── International path (customer design 2026-07-28) ──
    case "company_info":
      return [
        "companyLegalName",
        "country",
        "rccmNumber",
        "yearEstablished",
        "legalForm",
        "website",
        "officialEmail",
        "phone",
        "dialCode",
        "headOffice",
      ];
    case "business_profile":
      return ["sectorId", "productsServices", "employees"];
    case "market_interest":
      return ["drcInterests", "entryTimeline", "marketInterestNotes"];
    case "contact_person":
      return ["contactPerson", "jobTitle", "languages"];

    // P2-2: one plan step, shared by both paths. The plan itself lives in
    // wizard state and always has a value (defaulting to "free"), so it
    // never blocks Next.
    case "plan":
      return [];

    case "review":
      return [];
  }
}

/** True when the applicant declared an international company. */
export function isInternational(data: RegisterFormData): boolean {
  return data.profile === "international";
}

/**
 * P1-5: the international ladder only ever offers Free/Premium
 * (`INTL_REGISTER_PLANS`) — "verified" is a Congolese-only tier with no
 * international equivalent. Shared by the client (register-wizard's
 * `selectProfile`, on every profile switch) and the server
 * (`registerCompany`, as the authoritative gate for a stale restored draft
 * or any caller bypassing the wizard) so the two can never drift apart.
 */
export function coercePlanForProfile(
  profile: RegistrationProfile,
  plan: PlanId
): PlanId {
  return profile === "international" && plan === "verified" ? "free" : plan;
}

/**
 * Given the field names the server rejected (P0-5), pick the first step —
 * in this profile's own order — whose `requiredForStep` list contains one
 * of them, so the wizard can jump the applicant straight to the problem
 * instead of leaving them stuck on Review with a dead-end toast. Falls back
 * to "review" when nothing maps (e.g. a DB-level rejection with no matching
 * field), where the generic error toast is still shown.
 */
export function stepForInvalidFields(
  profile: RegistrationProfile,
  fields: string[],
  data: RegisterFormData
): WizardStep {
  if (fields.length === 0) return "review";
  for (const step of stepsForProfile(profile)) {
    const required = requiredForStep(step, data);
    if (required.some((key) => fields.includes(key))) return step;
  }
  return "review";
}

/**
 * i18n key (under the `RegisterCompany` namespace) that labels a given
 * field, for the invalid-fields banner (P0-3). Congolese/home-vs-abroad
 * wording nuance (e.g. "RCCM" vs "Registration number") lives inside each
 * step component; the banner uses the same base label those steps fall
 * back to, which is always defined for every key `requiredForStep` can
 * return.
 *
 * Typed as a full `Record` (not `Partial`) over the closed `RegisterFormData`
 * shape: a newly added form field with no entry here now fails the build
 * instead of silently falling through fieldLabelKey()'s fallback at runtime.
 */
const FIELD_LABEL_KEYS: Record<keyof RegisterFormData, string> = {
  // Code-review finding: `profile` and `interestOther` are both real
  // register-company-actions.ts zod schema keys the server can reject, but
  // neither ever appears in any requiredForStep() list, so the
  // fieldLabelKey-coverage test below (which only walks requiredForStep
  // results) could never have caught their absence. Without an entry here,
  // a server-side rejection of either fell through fieldLabelKey()'s
  // silent fallback and told the applicant "Company Legal Name" was wrong
  // when it wasn't.
  profile: "fields.companyProfile",
  interestOther: "fields.interestOther",
  country: "fields.country",
  companyLegalName: "fields.companyLegalName",
  tradingName: "fields.tradingName",
  rccmNumber: "fields.rccmNumber",
  nationalId: "fields.nationalId",
  nif: "fields.nif",
  yearEstablished: "fields.yearEstablished",
  legalForm: "fields.legalForm",
  employees: "fields.employees",
  sectorId: "fields.sector",
  productsServices: "fields.productsServices",
  province: "fields.province",
  city: "fields.city",
  website: "fields.website",
  officialEmail: "fields.officialEmail",
  phone: "fields.phone",
  dialCode: "intl.fields.dialCode",
  altPhone: "fields.altPhone",
  contactPerson: "fields.contactPerson",
  jobTitle: "fields.jobTitle",
  preferredContact: "fields.preferredContact",
  languages: "fields.languages",
  interests: "fields.interests",
  rccmCertName: "fields.rccmCertificate",
  nifDocName: "fields.nifDocument",
  logoName: "fields.companyLogo",
  additionalName: "fields.additionalDocs",
  headOffice: "intl.fields.headOffice",
  annualTurnover: "intl.fields.annualTurnover",
  currentMarkets: "intl.fields.currentMarkets",
  certifications: "intl.fields.certifications",
  drcInterests: "intl.fields.drcInterests",
  targetProvinces: "intl.fields.targetProvinces",
  entryTimeline: "intl.fields.entryTimeline",
  marketInterestNotes: "intl.fields.marketInterestNotes",
};

/** Falls back to the field key itself only if a key is somehow missing from
 *  the map above — every key `requiredForStep` can emit is covered, so this
 *  path should never actually render. */
export function fieldLabelKey(key: keyof RegisterFormData): string {
  return FIELD_LABEL_KEYS[key] ?? "fields.companyLegalName";
}

/**
 * Code-review finding: the server's rejected-field list (RegisterResult's
 * `fields`, produced from zod issue paths in register-company-actions.ts)
 * was cast straight into `keyof RegisterFormData` with no validation, then
 * rendered through fieldLabelKey() — whose fallback silently names a real
 * but WRONG field ("Company Legal Name") for anything unmapped. That was
 * only ever "safe" because every key the schema could actually reject
 * happened to already be in FIELD_LABEL_KEYS; `profile`/`interestOther`
 * proved it wasn't guaranteed. Filtering here means any FUTURE gap between
 * the schema and the label map degrades to the generic "some fields are
 * invalid" toast (no field list at all) instead of a misleading specific
 * claim — failing visibly rather than misleadingly.
 */
export function filterKnownFields(fields: string[]): (keyof RegisterFormData)[] {
  return fields.filter(
    (field): field is keyof RegisterFormData => field in FIELD_LABEL_KEYS
  );
}
