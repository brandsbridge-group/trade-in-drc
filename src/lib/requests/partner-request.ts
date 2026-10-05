import type { BusinessRequestIntent } from "@/lib/supabase/types";

/**
 * Rules of the "find a local partner" request (/request): its options, the
 * three steps of the form, and field validation. Pure and shared — the form
 * validates a step before moving on, the server action validates everything
 * again with the same function, and both speak in error CODES the UI turns
 * into a sentence under the field.
 */

/** The primary needs, one per request. */
export const NEEDS = [
  "supplier",
  "distributor",
  "representative",
  "jv_partner",
  "service_provider",
  "institutional",
  "enter_market",
  "source_products",
] as const;
export type BusinessNeed = (typeof NEEDS)[number];

/** Estimated business volume, in USD ranges. */
export const VOLUMES = ["under_10k", "k10_50k", "k50_250k", "k250k_1m", "over_1m"] as const;
export type Volume = (typeof VOLUMES)[number];

export const TIMELINES = ["immediate", "m_1_3", "m_3_6", "m_6_12", "flexible"] as const;
export type Timeline = (typeof TIMELINES)[number];

/** Extra help the visitor may ask for. Nothing is ticked by default. */
export const PREFERENCES = ["verified_only", "b2b_meetings", "market_entry_support", "sponsorship"] as const;
export type Preference = (typeof PREFERENCES)[number];

/** `business_requests.intent` only knows broad families; `details.need` keeps the exact one. */
export const NEED_INTENT: Record<BusinessNeed, BusinessRequestIntent> = {
  supplier: "buy",
  distributor: "find_partner",
  representative: "local_representation",
  jv_partner: "find_partner",
  service_provider: "find_partner",
  institutional: "find_partner",
  enter_market: "market_entry",
  source_products: "buy",
};

/** Supporting document: same limits as the `request-attachments` bucket (00065). */
export const ATTACHMENT_BUCKET = "request-attachments";
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const ATTACHMENT_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "image/jpeg": "jpg",
  "image/png": "png",
};
export const ATTACHMENT_ACCEPT = Object.keys(ATTACHMENT_TYPES).join(",");
/** `inbox/<uuid>/file.<ext>` — the only shape a submitted attachment path may have. */
export const ATTACHMENT_PATH_PATTERN = /^inbox\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/file\.[a-z]{3,4}$/;

export type AttachmentError = "too_large" | "bad_type";

export function attachmentError(file: { size: number; type: string }): AttachmentError | null {
  if (!(file.type in ATTACHMENT_TYPES)) return "bad_type";
  if (file.size > MAX_ATTACHMENT_BYTES) return "too_large";
  return null;
}

export interface PartnerRequestValues {
  need: BusinessNeed | "";
  productService: string;
  sectorId: string;
  /** A DRC province, or "" for "anywhere / not decided yet". */
  targetProvince: string;
  timeline: Timeline | "";
  volume: Volume | "";
  requirement: string;
  preferences: Preference[];
  companyName: string;
  contactPerson: string;
  email: string;
  /** E.164 ("+243812345678") or "". */
  phone: string;
  country: string;
  website: string;
}

export const EMPTY_PARTNER_REQUEST: PartnerRequestValues = {
  need: "",
  productService: "",
  sectorId: "",
  targetProvince: "",
  timeline: "",
  volume: "",
  requirement: "",
  preferences: [],
  companyName: "",
  contactPerson: "",
  email: "",
  phone: "",
  country: "",
  website: "",
};

export const REQUEST_STEPS = ["need", "details", "contact"] as const;
export type RequestStep = (typeof REQUEST_STEPS)[number];

export type RequestField = keyof PartnerRequestValues;

/** Which fields each step owns: a step is valid when none of its fields has an error. */
export const STEP_FIELDS: Record<RequestStep, RequestField[]> = {
  need: ["need"],
  details: ["productService", "sectorId", "targetProvince", "timeline", "volume", "requirement", "preferences"],
  contact: ["companyName", "contactPerson", "email", "phone", "country", "website"],
};

export type FieldErrorCode = "required" | "too_short" | "too_long" | "email" | "phone" | "website" | "invalid";
export type FieldErrors = Partial<Record<RequestField, FieldErrorCode>>;

export const REQUIREMENT_MIN = 20;
const LIMITS: Partial<Record<RequestField, number>> = {
  productService: 300,
  requirement: 5000,
  companyName: 200,
  contactPerson: 200,
  email: 320,
  country: 100,
  website: 300,
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^\+[1-9]\d{6,14}$/;
/** A bare domain or a full address: "kivu.cd", "www.kivu.cd/fr", "https://kivu.cd". */
const WEBSITE = /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/\S*)?$/i;

const includes = <T extends string>(list: readonly T[], value: string): value is T =>
  (list as readonly string[]).includes(value);

/** Every problem in the form, keyed by field. An empty object means it can be sent. */
export function validatePartnerRequest(values: PartnerRequestValues): FieldErrors {
  const errors: FieldErrors = {};
  const text = (field: RequestField) => String(values[field] ?? "").trim();

  if (!includes(NEEDS, values.need)) errors.need = "required";

  if (!text("productService")) errors.productService = "required";
  if (!values.timeline) errors.timeline = "required";
  else if (!includes(TIMELINES, values.timeline)) errors.timeline = "invalid";
  if (values.volume && !includes(VOLUMES, values.volume)) errors.volume = "invalid";
  if (!text("requirement")) errors.requirement = "required";
  else if (text("requirement").length < REQUIREMENT_MIN) errors.requirement = "too_short";
  if (values.preferences.some((p) => !includes(PREFERENCES, p))) errors.preferences = "invalid";

  if (!text("companyName")) errors.companyName = "required";
  if (!text("contactPerson")) errors.contactPerson = "required";
  if (!text("email")) errors.email = "required";
  else if (!EMAIL.test(text("email"))) errors.email = "email";
  if (text("phone") && !PHONE.test(text("phone"))) errors.phone = "phone";
  if (!text("country")) errors.country = "required";
  if (text("website") && !WEBSITE.test(text("website"))) errors.website = "website";

  for (const [field, max] of Object.entries(LIMITS) as [RequestField, number][]) {
    if (!errors[field] && text(field).length > max) errors[field] = "too_long";
  }
  return errors;
}

/** The errors of one step only. */
export function stepErrors(values: PartnerRequestValues, step: RequestStep): FieldErrors {
  const all = validatePartnerRequest(values);
  return Object.fromEntries(STEP_FIELDS[step].filter((f) => all[f]).map((f) => [f, all[f]])) as FieldErrors;
}

/** The first step that still has an error, or null when the form is complete. */
export function firstInvalidStep(values: PartnerRequestValues): RequestStep | null {
  const all = validatePartnerRequest(values);
  return REQUEST_STEPS.find((step) => STEP_FIELDS[step].some((f) => all[f])) ?? null;
}

/** What goes in `business_requests.details` (00065): keys only, never labels. */
export interface PartnerRequestDetails {
  form: "partner_request";
  need: BusinessNeed;
  product: string;
  volume: Volume | null;
  preferences: Preference[];
  website: string | null;
}

export function partnerRequestDetails(values: PartnerRequestValues): PartnerRequestDetails {
  return {
    form: "partner_request",
    need: values.need as BusinessNeed,
    product: values.productService.trim(),
    volume: values.volume || null,
    preferences: PREFERENCES.filter((p) => values.preferences.includes(p)),
    website: values.website.trim() || null,
  };
}

/** Reads `details` back, tolerating rows written by other forms ('{}') or by hand. */
export function readPartnerRequestDetails(raw: unknown): PartnerRequestDetails | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Record<string, unknown>;
  if (d.form !== "partner_request" || typeof d.need !== "string" || !includes(NEEDS, d.need)) return null;
  return {
    form: "partner_request",
    need: d.need,
    product: typeof d.product === "string" ? d.product : "",
    volume: typeof d.volume === "string" && includes(VOLUMES, d.volume) ? d.volume : null,
    preferences: Array.isArray(d.preferences)
      ? PREFERENCES.filter((p) => (d.preferences as unknown[]).includes(p))
      : [],
    website: typeof d.website === "string" && d.website ? d.website : null,
  };
}
