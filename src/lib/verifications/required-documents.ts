import { DOCUMENT_TYPE, type DocumentType } from "@/constants/status";
import { HOME_COUNTRY } from "@/config/geo";

/**
 * Documents the owner files from the dashboard's "Get verified" screen, in
 * display order. `logo`/`photo` are branding, handled on the profile editor.
 */
export const VERIFICATION_DOC_TYPES = [
  DOCUMENT_TYPE.BUSINESS_LICENSE,
  DOCUMENT_TYPE.TAX_REGISTRATION,
  DOCUMENT_TYPE.PROOF_OF_ADDRESS,
  DOCUMENT_TYPE.ADDITIONAL_DOCUMENT,
] as const;

export type VerificationDocType = (typeof VERIFICATION_DOC_TYPES)[number];

/** Rows created before 00035 have the DRC as their column default. */
export function isHomeCountry(country: string | null | undefined): boolean {
  return !country || country.trim().toLowerCase() === HOME_COUNTRY.toLowerCase();
}

/**
 * What must be on file before a company can enter the review queue. Every
 * company proves it exists (registration certificate — the RCCM in the DRC);
 * a Congolese one also files its tax ID (NIF), which a foreign company has no
 * equivalent of. Shared by the screen (button state) and the server action
 * (the actual gate).
 */
export function requiredDocTypes(country: string | null | undefined): VerificationDocType[] {
  return isHomeCountry(country)
    ? [DOCUMENT_TYPE.BUSINESS_LICENSE, DOCUMENT_TYPE.TAX_REGISTRATION]
    : [DOCUMENT_TYPE.BUSINESS_LICENSE];
}

/** Required types with no document on file yet. */
export function missingDocTypes(
  country: string | null | undefined,
  presentTypes: Iterable<DocumentType | string>
): VerificationDocType[] {
  const present = new Set<string>(presentTypes);
  return requiredDocTypes(country).filter((type) => !present.has(type));
}

/** Legal identifiers as the "Get verified" screen edits them. */
export interface LegalIdentity {
  registrationNumber: string;
  nationalId: string;
  taxId: string;
  legalForm: string;
  yearEstablished: string;
  employees: string;
}

export const EMPTY_LEGAL: LegalIdentity = {
  registrationNumber: "",
  nationalId: "",
  taxId: "",
  legalForm: "",
  yearEstablished: "",
  employees: "",
};

/** Reads `verification_summary.registration_intake.legal` (written at registration and by the owner action). */
export function legalFromSummary(summary: unknown): LegalIdentity {
  const legal =
    (summary as { registration_intake?: { legal?: Record<string, unknown> | null } | null } | null)?.registration_intake
      ?.legal ?? {};
  const text = (value: unknown) => (typeof value === "string" ? value : value == null ? "" : String(value));
  return {
    registrationNumber: text(legal.rccm_number),
    nationalId: text(legal.national_id),
    taxId: text(legal.nif),
    legalForm: text(legal.legal_form),
    yearEstablished: text(legal.year_established),
    employees: text(legal.employees),
  };
}

/**
 * Identifiers required before review — the numbers of the required documents:
 * the registration number for every company, plus the NIF in the DRC.
 */
export function missingLegalFields(
  country: string | null | undefined,
  legal: LegalIdentity
): (keyof LegalIdentity)[] {
  const required: (keyof LegalIdentity)[] = isHomeCountry(country)
    ? ["registrationNumber", "taxId"]
    : ["registrationNumber"];
  return required.filter((key) => !legal[key].trim());
}
