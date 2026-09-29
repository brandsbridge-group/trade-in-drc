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
 * Short company form (brief v2, signed-in only): identify and contact the
 * company, nothing else. Verification fields, profile details and the plan
 * moved to voluntary dashboard actions; the step-*.tsx components that
 * collect them are kept for those actions.
 */
export const CONGOLESE_STEPS = ["company", "contact"] as const;

/** International adds one OPTIONAL step ("Skip this step" submits without it). */
export const INTERNATIONAL_STEPS = ["company", "contact", "market_interest"] as const;

/** Every step name either path can show. */
export type WizardStep =
  | (typeof CONGOLESE_STEPS)[number]
  | (typeof INTERNATIONAL_STEPS)[number];

/** Steps that never block submission and offer a "Skip this step" button. */
export const OPTIONAL_STEPS: readonly WizardStep[] = ["market_interest"];

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

/** Route users are sent to when they submit while unauthenticated. */
export const LOGIN_REDIRECT = "/login?redirect=/register-company";

/**
 * Where a signed-out visitor goes from the profile gate: account creation
 * first, with `context=company` (account-benefits panel on /signup) and a
 * return here once their e-mail is confirmed.
 */
export const SIGNUP_REDIRECT = "/signup?redirect=%2Fregister-company&context=company";
