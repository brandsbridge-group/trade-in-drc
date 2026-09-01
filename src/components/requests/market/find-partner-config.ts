/**
 * Client-safe option keys for the Find-a-Local-Partner form (design 10).
 * Kept in a plain module (no "use server") so client components can import the
 * arrays directly; the server action re-declares the intent mapping it needs.
 */

/** The 8 primary needs shown as selectable tiles. */
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

/** Options for the "Type of Contact Needed" select. */
export const CONTACT_TYPES = [
  "supplier",
  "distributor",
  "representative",
  "jv_partner",
  "service_provider",
  "institutional",
  "buyer",
  "agent",
  "other",
] as const;

/** Estimated-business-volume ranges (stored as the readable label). */
export const VOLUMES = [
  "under_10k",
  "k10_50k",
  "k50_250k",
  "k250k_1m",
  "over_1m",
] as const;

/** Expected-timeline options (stored as the key). */
export const TIMELINES = [
  "immediate",
  "m_1_3",
  "m_3_6",
  "m_6_12",
  "flexible",
] as const;

/** The 4 preference checkboxes below the form. */
export const PREFERENCES = [
  "verified_only",
  "b2b_meetings",
  "market_entry_support",
  "sponsorship",
] as const;

export type Preference = (typeof PREFERENCES)[number];

/** A compact dial-code set for the phone field prefix. */
export const DIAL_CODES = [
  "+1",
  "+33",
  "+44",
  "+243",
  "+242",
  "+32",
  "+49",
  "+34",
  "+39",
  "+86",
  "+90",
  "+971",
  "+27",
  "+254",
  "+256",
  "+260",
] as const;

/** Supporting-document upload constraints. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_UPLOAD =
  ".pdf,.doc,.docx,.pptx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation";
