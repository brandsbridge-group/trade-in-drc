import {
  Landmark,
  ShieldCheck,
  Crown,
  BadgeCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

/**
 * Register-company (customer design 6) shared constants.
 * All human-facing copy is resolved via the `RegisterCompany` i18n namespace —
 * these are the stable option keys + styling tokens only.
 */

/** Pricing / verification tiers shown above the wizard. Selecting one sets the
 *  wizard's `plan` (an INTENT only — actual verification is admin-driven). */
export type PlanId = "free" | "verified" | "premium";

export interface PlanMeta {
  id: PlanId;
  icon: LucideIcon;
  /** solid navy CTA vs. outline CTA (design: Free = outline, paid = solid). */
  cta: "solid" | "outline";
  /** How many ✓ bullets this tier lists (drives the i18n array iteration). */
  bulletCount: number;
}

/** Congolese ladder (three tiers) — read from the `tiers.*` namespace. */
export const REGISTER_PLANS: readonly PlanMeta[] = [
  { id: "free", icon: Landmark, cta: "outline", bulletCount: 3 },
  { id: "verified", icon: ShieldCheck, cta: "solid", bulletCount: 4 },
  { id: "premium", icon: Crown, cta: "solid", bulletCount: 4 },
] as const;

/**
 * International ladder (P1-5: only ever two tiers — Free/Premium; a
 * Congolese-only tier like "verified" is never offered here, and
 * `selectProfile` resets `plan` to "free" so one can't follow the applicant
 * in from the other path). Read from the `intl.plan.*` namespace.
 */
export const INTL_REGISTER_PLANS: readonly PlanMeta[] = [
  { id: "free", icon: BadgeCheck, cta: "outline", bulletCount: 4 },
  { id: "premium", icon: Sparkles, cta: "solid", bulletCount: 6 },
] as const;

/**
 * Which company is registering. Declared by the applicant on the
 * "Choose your company profile" cards and drives the whole form:
 * Congolese companies have RCCM/NIF/province, international ones do not.
 */
export const REGISTRATION_PROFILES = ["congolese", "international"] as const;
export type RegistrationProfile = (typeof REGISTRATION_PROFILES)[number];

/**
 * Congolese wizard steps, in order. P2-2: a single "plan" step was inserted
 * second-to-last — the pricing panel used to sit above the wizard on every
 * step (`tier-cards.tsx`, now deleted) and simply vanished for international
 * applicants (P1-4); it's now an explicit, validated step both paths share.
 */
export const CONGOLESE_STEPS = [
  "legal",
  "professional",
  "positioning",
  "documents",
  "plan",
  "review",
] as const;

/**
 * International wizard steps (customer design 2026-07-28,
 * latest-designs/2026-07-28/register-international-company.ai). P2-2: "plan"
 * (formerly "profile_plan", step 5 of 7) moved to second-to-last so both
 * paths choose their plan right before Review, in the same relative spot.
 */
export const INTERNATIONAL_STEPS = [
  "company_info",
  "business_profile",
  "market_interest",
  "contact_person",
  "documents",
  "plan",
  "review",
] as const;

/**
 * Every step name either path can show. Not an ordered list — the two paths
 * share `documents` and `review`, so concatenating them would repeat entries.
 * Use stepsForProfile() for the ordered list.
 */
export type WizardStep =
  | (typeof CONGOLESE_STEPS)[number]
  | (typeof INTERNATIONAL_STEPS)[number];

/** The ordered step list a given profile walks through. */
export function stepsForProfile(profile: RegistrationProfile): readonly WizardStep[] {
  return profile === "international" ? INTERNATIONAL_STEPS : CONGOLESE_STEPS;
}

/** Turnover bands offered on the international "Business Profile" step. */
export const TURNOVER_RANGES = [
  "under_500k",
  "500k_2m",
  "2m_10m",
  "10m_50m",
  "over_50m",
] as const;

/** What an international company wants to do in the DRC. */
export const DRC_INTERESTS = [
  "export_to_drc",
  "import_from_drc",
  "distribution",
  "investment",
  "joint_venture",
  "local_representation",
  "services",
] as const;

/** How soon they intend to act. */
export const ENTRY_TIMELINES = [
  "immediately",
  "under_3_months",
  "three_to_six_months",
  "six_to_twelve_months",
  "exploratory",
] as const;

export const LEGAL_FORMS = [
  "sarl",
  "sa",
  "sarlu",
  "scs",
  "sole",
  "cooperative",
  "other",
] as const;

export const EMPLOYEE_RANGES = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "500plus",
] as const;

export const SPOKEN_LANGUAGES = [
  "french",
  "english",
  "swahili",
  "lingala",
  "kikongo",
  "tshiluba",
] as const;

export const OPPORTUNITY_INTERESTS = [
  "investment",
  "distribution",
  "supply",
  "jointVentures",
  "technology",
  "other",
] as const;

export const PREFERRED_CONTACTS = ["email", "phone", "whatsapp"] as const;

/** Year-established options: current year back to 1960 (descending). */
export const YEAR_OPTIONS: number[] = (() => {
  const current = new Date().getFullYear();
  const out: number[] = [];
  for (let y = current; y >= 1960; y -= 1) out.push(y);
  return out;
})();

/** Shared input styling — mirrors the market surfaces (opp-need-form). */
export const FIELD_CLS =
  "h-10 w-full rounded-[0.5rem] border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition-colors duration-150 placeholder:text-slate-400 focus:border-market-navy";

/**
 * sessionStorage key holding an in-progress registration draft. Bumped
 * (v1 -> v2) by P2-2's step reorder: `stepIndex` is restored blindly
 * (register-wizard.tsx), so a draft saved under the old step order would
 * land a returning applicant on the wrong step under the new one.
 *
 * Bumped again (v2 -> v3) by P2-1's Profile Gate: the draft now also carries
 * a `phase` ("profile" | "form"). A v2 draft has no `phase` field, and the
 * restore logic in register-wizard.tsx infers one from `stepIndex` — but
 * bumping the key means that inference only ever has to handle drafts this
 * version of the wizard itself wrote, not a stale shape from before the gate
 * existed.
 */
export const DRAFT_KEY = "tidrc.register-company.draft.v3";

/** Route users are sent to when they submit while unauthenticated. */
export const LOGIN_REDIRECT = "/login?redirect=/register-company";
