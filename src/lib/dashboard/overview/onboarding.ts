import { COMPANY_STATUS } from "@/constants/status";

export const ONBOARDING_STEPS = ["account", "company", "documents", "product"] as const;
export type OnboardingStepKey = (typeof ONBOARDING_STEPS)[number];

/** `done` = finished, `current` = the one to do now, `upcoming` = later. */
export type OnboardingStepState = "done" | "current" | "upcoming";

export interface OnboardingStep {
  key: OnboardingStepKey;
  state: OnboardingStepState;
  /** Where the step is done; null when it has no screen (yet). */
  href: string | null;
}

export interface OnboardingModel {
  steps: OnboardingStep[];
  doneCount: number;
  total: number;
  percent: number;
  /** Every step done — the guide stops being shown. */
  complete: boolean;
  current: OnboardingStep | null;
}

export interface OnboardingInput {
  companies: { id: string; status: string }[];
  /** Products across all the owner's companies. */
  productCount: number;
}

/** Statuses meaning "the documents were sent": in review, or already decided in the company's favour. */
const SUBMITTED: string[] = [COMPANY_STATUS.PENDING, COMPANY_STATUS.VERIFIED];

/**
 * The getting-started path of a company account, computed from real data so it
 * tracks what the owner actually did: account (always done once signed in) →
 * company registered → documents sent for verification → first product.
 */
export function buildOnboarding({ companies, productCount }: OnboardingInput): OnboardingModel {
  const hasCompany = companies.length > 0;
  const submitted = companies.some((c) => SUBMITTED.includes(c.status));
  // The company still owing documents (never sent, or sent back).
  const toVerify = companies.find((c) => !SUBMITTED.includes(c.status));

  const done: Record<OnboardingStepKey, boolean> = {
    account: true,
    company: hasCompany,
    documents: submitted,
    product: productCount > 0,
  };
  const href: Record<OnboardingStepKey, string | null> = {
    account: null,
    company: "/dashboard/companies/new",
    documents: toVerify ? `/dashboard/companies/${toVerify.id}/verification` : null,
    product: hasCompany ? "/dashboard/products/new" : null,
  };

  const firstOpen = ONBOARDING_STEPS.find((key) => !done[key]);
  const steps = ONBOARDING_STEPS.map<OnboardingStep>((key) => ({
    key,
    state: done[key] ? "done" : key === firstOpen ? "current" : "upcoming",
    href: done[key] ? null : href[key],
  }));
  const doneCount = steps.filter((s) => s.state === "done").length;

  return {
    steps,
    doneCount,
    total: steps.length,
    percent: Math.round((doneCount / steps.length) * 100),
    complete: doneCount === steps.length,
    current: steps.find((s) => s.state === "current") ?? null,
  };
}
