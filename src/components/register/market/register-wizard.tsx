"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { companiesQueryKey } from "@/hooks/use-companies";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  LogIn,
  Send,
} from "lucide-react";
import { Link, useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/auth-provider";
import { HOME_COUNTRY, DEFAULT_DIAL_CODE } from "@/config/geo";
import {
  stepsForProfile,
  DRAFT_KEY,
  LOGIN_REDIRECT,
  REGISTER_PLANS,
  INTL_REGISTER_PLANS,
  type PlanId,
  type RegistrationProfile,
  type WizardStep,
} from "./constants";
import {
  EMPTY_FORM,
  fieldLabelKey,
  filterKnownFields,
  requiredForStep,
  stepForInvalidFields,
  type RegisterFormData,
  type RegisterResult,
  type SectorOption,
} from "./types";
import { registerCompany } from "./register-company-actions";
import { uploadRegistrationDocuments, type RegistrationDocumentFiles } from "./upload-documents";
import { PlanPicker } from "./plan-picker";
import { Stepper } from "./stepper";
import { ProfileGate } from "./profile-gate";
import { StepLegal } from "./step-legal";
import { StepProfessional } from "./step-professional";
import { StepPositioning } from "./step-positioning";
import { StepDocuments } from "./step-documents";
import { StepReview } from "./step-review";
import { StepIntlCompanyInfo } from "./step-intl-company-info";
import { StepIntlBusinessProfile } from "./step-intl-business-profile";
import { StepIntlMarketInterest } from "./step-intl-market-interest";
import { StepIntlContactPerson } from "./step-intl-contact-person";
import { IntlSidebar } from "./intl-sidebar";
import { IntlStrips } from "./intl-strips";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Missing required fields for a given step (empty string / empty array). */
function missingFields(
  step: WizardStep,
  data: RegisterFormData
): Set<keyof RegisterFormData> {
  const missing = new Set<keyof RegisterFormData>();
  for (const key of requiredForStep(step, data)) {
    const value = data[key];
    if (Array.isArray(value) ? value.length === 0 : !String(value).trim()) {
      missing.add(key);
    }
  }
  // Both paths collect officialEmail — Congolese on "professional",
  // international on "company_info". Validate the format wherever it appears,
  // otherwise a typo is only caught by the server as a generic "invalid".
  const collectsEmail = step === "professional" || step === "company_info";
  if (collectsEmail && data.officialEmail && !EMAIL_RE.test(data.officialEmail)) {
    missing.add("officialEmail");
  }
  return missing;
}

export function RegisterWizard({ sectors }: { sectors: SectorOption[] }) {
  const t = useTranslations("RegisterCompany");
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const reduceMotion = useReducedMotion();

  const [plan, setPlan] = React.useState<PlanId>("free");
  const [stepIndex, setStepIndex] = React.useState(0);
  const [data, setData] = React.useState<RegisterFormData>(EMPTY_FORM);
  const [restored, setRestored] = React.useState(false);
  const [errors, setErrors] = React.useState<Set<keyof RegisterFormData>>(new Set());
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState(false);
  // Real File objects picked on the Documents step. Kept OUT of the
  // sessionStorage draft on purpose: File is not JSON-serializable, and a
  // reload should not resurrect a stale file handle. `data.*Name` still
  // carries the file name for the draft/validation/description text.
  const [documentFiles, setDocumentFiles] = React.useState<RegistrationDocumentFiles>({});
  const selectDocumentFile: React.ComponentProps<typeof StepDocuments>["onFileSelect"] = (
    field,
    file
  ) => {
    setDocumentFiles((prev) => ({ ...prev, [field]: file }));
  };
  // P2-1: the account-type decision (this) and the wizard/stepper never
  // share a screen. "profile" renders the Profile Gate only — heading, the
  // two cards, one Continue button, no pricing. "form" renders the Stepper
  // + step content. Defaults to "profile" so a fresh visitor always meets
  // the gate first.
  const [phase, setPhase] = React.useState<"profile" | "form">("profile");

  const scrollToTop = React.useCallback(() => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }, [reduceMotion]);

  // The declared profile decides which ordered step list applies. Congolese
  // companies walk the original 5 steps; international ones the 7-step
  // market-entry form from the 2026-07-28 design.
  const steps = stepsForProfile(data.profile);
  const step = steps[Math.min(stepIndex, steps.length - 1)];
  const international = data.profile === "international";
  const update = (patch: Partial<RegisterFormData>) => {
    setData((prev) => ({ ...prev, ...patch }));
    // The error banner should stop naming a field the user just fixed —
    // clear its entry from `errors` as soon as it's touched, rather than
    // waiting for the next goNext()/goBack() to wipe the whole set.
    setErrors((prev) => {
      const touched = Object.keys(patch) as (keyof RegisterFormData)[];
      if (!touched.some((key) => prev.has(key))) return prev;
      const next = new Set(prev);
      for (const key of touched) next.delete(key);
      return next;
    });
  };

  // Submitting requires a session. An anonymous visitor can fill the whole
  // form (7 steps on the international path) before that is discovered, so the
  // draft is kept in sessionStorage and restored when they come back from
  // signing in — otherwise every answer is lost at the last click.
  React.useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as {
          data?: RegisterFormData;
          plan?: PlanId;
          stepIndex?: number;
          phase?: "profile" | "form";
        };
        if (parsed.data) setData({ ...EMPTY_FORM, ...parsed.data });
        if (parsed.plan) setPlan(parsed.plan);
        if (typeof parsed.stepIndex === "number") setStepIndex(parsed.stepIndex);
        // A draft under this DRAFT_KEY version always has `phase` — the
        // fallback below only matters for the moment this shipped, when a
        // reload could race a not-yet-persisted first write. Any progress
        // past step 0 means the applicant already got through the gate.
        if (parsed.phase === "profile" || parsed.phase === "form") {
          setPhase(parsed.phase);
        } else if (typeof parsed.stepIndex === "number" && parsed.stepIndex > 0) {
          setPhase("form");
        }
      }
    } catch {
      // A corrupt or unavailable draft must never block registration.
    }
    setRestored(true);
  }, []);

  React.useEffect(() => {
    if (!restored || done) return;
    try {
      window.sessionStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ data, plan, stepIndex, phase })
      );
    } catch {
      // Private-mode / quota failures are not worth interrupting the user for.
    }
  }, [data, plan, stepIndex, phase, restored, done]);

  /** Switching profile restarts the wizard — the two paths share no step order. */
  const selectProfile = (profile: RegistrationProfile) => {
    if (profile === data.profile) return;
    setStepIndex(0);
    setErrors(new Set());
    // P1-5: the international ladder only ever offers Free/Premium — a
    // Congolese-only "verified" selection must not survive the switch (it
    // has no international equivalent, and the review screen + server would
    // otherwise carry a plan this path never actually presents).
    setPlan("free");
    // Country must NOT stay pre-filled as the DRC when someone declares an
    // international company: it silently satisfies a required field, and
    // isHomeCountry() would then demand the DRC-only NIF document on the
    // Documents step — blocking an applicant who has no such document.
    update(
      profile === "international"
        ? { profile, country: "", dialCode: "" }
        : { profile, country: HOME_COUNTRY, dialCode: DEFAULT_DIAL_CODE }
    );
  };

  // P1-6: the two paths sell different packages under the same PlanId — the
  // toast must name the one this applicant actually saw (see step-review.tsx
  // for the same namespace split on the final confirmation screen).
  const selectPlan = (p: PlanId) => {
    setPlan(p);
    const name = international ? t(`intl.plan.${p}.name`) : t(`tiers.${p}.name`);
    toast.success(t("tiers.selectedToast", { tier: name }));
  };

  const goNext = () => {
    const missing = missingFields(step, data);
    if (missing.size > 0) {
      setErrors(missing);
      toast.error(t("errors.required"));
      return;
    }
    setErrors(new Set());
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
    scrollToTop();
  };

  const goBack = () => {
    setErrors(new Set());
    setStepIndex((i) => Math.max(i - 1, 0));
  };

  /** P2-1: leaves the gate for the wizard. Doesn't touch stepIndex — a
   *  returning applicant who came back here via `backToGate` just to
   *  double-check their pick resumes where they left off. */
  const continueToForm = () => {
    setPhase("form");
    scrollToTop();
  };

  /** P2-1: the form's "Change" ghost button — the only way back to the
   *  gate once past it, so the account-type choice and the step form never
   *  compete for the same screen. */
  const backToGate = () => {
    setPhase("profile");
    scrollToTop();
  };

  /** P2-7: the stepper's back-navigation — only ever called with an already
   *  completed step index (see stepper.tsx's `clickable` gate). */
  const goToStep = (index: number) => {
    setErrors(new Set());
    setStepIndex(index);
    scrollToTop();
  };

  const submit = async () => {
    // Re-validate every step; jump to the first with a problem.
    for (let i = 0; i < steps.length; i += 1) {
      const missing = missingFields(steps[i], data);
      if (missing.size > 0) {
        setStepIndex(i);
        setErrors(missing);
        // P0-3: goNext scrolls on its own; this loop silently changed the
        // step without ever moving the viewport, so a user parked at the
        // bottom of a long page saw the button "do nothing".
        scrollToTop();
        toast.error(t("errors.required"));
        return;
      }
    }
    setSubmitting(true);
    const id = toast.loading(t("nav.submitting"));
    // P0-2: without try/catch/finally, any thrown rejection (network drop, a
    // redeploy invalidating this server-action id, a throw inside
    // createAdminClient) skipped setSubmitting(false) forever — the button
    // stayed greyed out until a full page reload.
    let res: RegisterResult;
    try {
      res = await registerCompany({ plan, data });
    } catch (e) {
      console.error("[registerCompany] threw", e);
      toast.error(t("errors.server"), { id });
      return;
    } finally {
      setSubmitting(false);
    }

    if (res.ok) {
      toast.success(t("success.title"), { id });
      // P2-8: the company row exists now, so this is the earliest point the
      // owner-scoped storage RLS (company_documents_bucket_owner_upload,
      // migrations 00001 + 00011) can accept an upload — it keys off
      // `companies.owner_id`, which cannot resolve before this insert
      // committed. A failed upload must not undo the registration that
      // already succeeded, so this only ever surfaces its own toast, never
      // blocks reaching the success screen.
      const hasFiles = Object.values(documentFiles).some(Boolean);
      if (hasFiles && res.companyId) {
        const uploadId = toast.loading(t("documents.uploading"));
        const { failed } = await uploadRegistrationDocuments(res.companyId, documentFiles);
        if (failed.length > 0) {
          toast.error(t("documents.uploadPartialFailure", { count: failed.length }), {
            id: uploadId,
          });
        } else {
          toast.success(t("documents.uploadSuccess"), { id: uploadId });
        }
      }
      // P1-2: useCompanies() no longer force-refetches on every mount (that
      // hit ~10 dashboard surfaces on every navigation, not just the one
      // right after registration). Instead, target the exact query this
      // insert affects via the shared companiesQueryKey builder, so the
      // dashboard's next render picks up the new company immediately
      // instead of waiting out the 60s staleTime.
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: companiesQueryKey(user.id) });
      }
      // The company exists now — the draft would otherwise refill the form.
      try {
        window.sessionStorage.removeItem(DRAFT_KEY);
      } catch {
        // Nothing to do; the draft is only a convenience.
      }
      setDone(true);
      scrollToTop();
      return;
    }
    if (res.error === "auth") {
      toast.error(t("errors.auth"), { id });
      router.push(LOGIN_REDIRECT);
      return;
    }
    if (res.error === "invalid") {
      // P0-5: the server rejected fields the client-side pass missed (a
      // future client/server validation mismatch). Outline them and jump to
      // the first step that actually collects one, instead of leaving the
      // applicant stuck on Review with a bare toast and nothing highlighted.
      // Code-review finding: this used to cast res.fields straight into the
      // error set unvalidated. filterKnownFields drops anything
      // fieldLabelKey() can't genuinely label, so a server rejection on an
      // unmapped field degrades to the generic "some fields are invalid"
      // toast (below) instead of pointing at the wrong specific field.
      const fields = filterKnownFields(res.fields ?? []);
      setErrors(new Set(fields));
      const targetStep = stepForInvalidFields(data.profile, fields, data);
      const targetIndex = steps.indexOf(targetStep);
      if (targetIndex >= 0) setStepIndex(targetIndex);
      scrollToTop();
      toast.error(t("errors.invalid"), { id });
      return;
    }
    toast.error(t("errors.server"), { id });
  };

  if (done) {
    return (
      <section className="mx-auto w-full max-w-[900px] px-4 py-16 text-center md:px-6">
        <CheckCircle2 className="mx-auto size-14 text-market-navy" aria-hidden />
        <h2 className="mt-4 font-display text-2xl font-bold text-market-navy">
          {t("success.title")}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
          {t("success.body")}
        </p>
        <Link
          href="/dashboard/companies"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-[0.5rem] bg-market-navy px-6 text-sm font-bold text-white transition-colors duration-150 hover:bg-market-navy-deep"
        >
          {t("success.cta")}
        </Link>
      </section>
    );
  }

  const isReview = step === "review";
  const isPlanStep = step === "plan";

  // P2-6 (docs/MOTION.md §2.7 — Gate <-> Wizard phase swap): the two phases
  // never cross-fade — mode="wait" fully exits one before the other mounts,
  // so the account-type gate and the stepper/form are never visible at the
  // same time, not even for one frame. `initial={false}` skips the mount
  // animation on first paint (nothing to swap FROM yet); every phase change
  // after that animates.
  const phaseMotionProps = reduceMotion
    ? {
        initial: false as const,
        animate: { opacity: 1 },
        exit: { opacity: 0, transition: { duration: 0.15 } },
        transition: { duration: 0.15 },
      }
    : {
        initial: { opacity: 0, translateY: 8 },
        animate: { opacity: 1, translateY: 0 },
        exit: { opacity: 0, translateY: 4, filter: "blur(2px)", transition: { duration: 0.2 } },
        transition: { type: "spring" as const, duration: 0.3, bounce: 0 },
      };

  return (
    <AnimatePresence mode="wait" initial={false}>
      {phase === "profile" ? (
        <motion.div key="profile" {...phaseMotionProps}>
          <ProfileGate
            selected={data.profile}
            onSelect={selectProfile}
            onContinue={continueToForm}
          />
        </motion.div>
      ) : (
        <motion.div key="form" {...phaseMotionProps}>
          {/* P0-6: informs, does not gate — a signed-out visitor can still fill
              in and browse the whole wizard, but is told up front that an
              account is required to submit, instead of discovering it only at
              the last click. */}
          {!authLoading && !user && (
            <div className="mx-auto mb-2 w-full max-w-[1500px] px-4 pt-6 md:px-6">
              <div
                role="status"
                className="flex flex-col items-start gap-3 rounded-[0.5rem] border border-market-navy/20 bg-market-navy/5 p-4 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3">
                  <LogIn className="mt-0.5 size-4 shrink-0 text-market-navy" aria-hidden />
                  <div>
                    <p className="font-semibold text-market-navy">
                      {t("signedOutPrompt.title")}
                    </p>
                    <p className="mt-0.5 text-slate-600">{t("signedOutPrompt.body")}</p>
                  </div>
                </div>
                <Link
                  href={LOGIN_REDIRECT}
                  className="inline-flex h-9 shrink-0 items-center justify-center rounded-[0.5rem] bg-market-navy px-4 text-sm font-semibold text-white transition-colors duration-150 hover:bg-market-navy-deep"
                >
                  {t("signedOutPrompt.cta")}
                </Link>
              </div>
            </div>
          )}

          {/* P2-1: the only way back to the account-type gate once inside the
              form — a compact ghost affordance instead of the full card pair,
              so it never competes with the stepper for attention. */}
          <div className="mx-auto flex w-full max-w-[1500px] items-center justify-between px-4 pt-6 md:px-6">
            <p className="text-sm font-medium text-slate-600">
              {t(`profileChooser.${data.profile}.title`)}
            </p>
            <button
              type="button"
              onClick={backToGate}
              data-testid="profile-change-ghost"
              className="inline-flex h-8 items-center gap-1 rounded-[0.5rem] px-2 text-sm font-semibold text-market-navy transition-colors duration-150 hover:bg-slate-100"
            >
              <ChevronLeft className="size-3.5" aria-hidden />
              {t("profileChooser.change")}
            </button>
          </div>

          <Stepper current={stepIndex} profile={data.profile} onStepClick={goToStep} />

          <section
        className={cn(
          "mx-auto w-full max-w-[1500px] px-4 pb-14 md:px-6",
          // The international design pairs the form with a premium/help
          // sidebar — but not on the plan step itself (P2-2), where the
          // sidebar's own "Get Premium" offer would duplicate the one the
          // step is already showing in the same viewport.
          international &&
            !isPlanStep &&
            // P2-5: minmax(0,1fr) let the sidebar shrink to nothing between
            // 1024-1279px (the 2.6fr form column ate the whole row before
            // the 1fr side got a floor). 280px keeps the premium card's
            // inner content (bullets, price) from wrapping into mush. Stays
            // at `lg:` on purpose — pushing the split to `xl:` would hide
            // the premium offer below the fold for the entire 1024-1279
            // band instead of narrowing it gracefully.
            "grid gap-5 pb-8 lg:grid-cols-[minmax(0,2.6fr)_minmax(280px,1fr)] lg:items-start"
        )}
      >
        <div className="rounded-[0.5rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          {/* P0-3: same information as the corner toast, but pinned at the
              top of the step it applies to — the toast alone was easy to
              miss after a step jump, especially on a long scrolled page. */}
          {errors.size > 0 && (
            <div
              role="alert"
              className="mb-6 flex items-start gap-3 rounded-[0.5rem] border border-red-200 bg-red-50 p-4 text-sm text-red-800"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-600" aria-hidden />
              <div>
                <p className="font-semibold">{t("errors.bannerTitle")}</p>
                <ul className="mt-1 list-inside list-disc space-y-0.5">
                  {Array.from(errors).map((key) => (
                    <li key={key}>{t(fieldLabelKey(key))}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {step === "company_info" && (
            <StepIntlCompanyInfo data={data} update={update} errors={errors} />
          )}
          {step === "business_profile" && (
            <StepIntlBusinessProfile
              data={data}
              update={update}
              errors={errors}
              sectors={sectors}
            />
          )}
          {step === "market_interest" && (
            <StepIntlMarketInterest data={data} update={update} errors={errors} />
          )}
          {step === "contact_person" && (
            <StepIntlContactPerson data={data} update={update} errors={errors} />
          )}
          {isPlanStep && (
            <PlanPicker
              plans={international ? INTL_REGISTER_PLANS : REGISTER_PLANS}
              selected={plan}
              onSelect={selectPlan}
              namespace={international ? "intl.plan" : "tiers"}
            />
          )}
          {step === "legal" && (
            <StepLegal data={data} update={update} errors={errors} />
          )}
          {step === "professional" && (
            <StepProfessional
              data={data}
              update={update}
              errors={errors}
              sectors={sectors}
            />
          )}
          {step === "positioning" && (
            <StepPositioning data={data} update={update} errors={errors} />
          )}
          {step === "documents" && (
            <StepDocuments
              data={data}
              update={update}
              errors={errors}
              onFileSelect={selectDocumentFile}
            />
          )}
          {isReview && (
            <StepReview
              data={data}
              plan={plan}
              sectors={sectors}
              onChangePlan={() => goToStep(steps.indexOf("plan"))}
            />
          )}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={goBack}
              disabled={stepIndex === 0}
              className={cn(
                "inline-flex h-11 items-center gap-2 rounded-[0.5rem] border border-slate-300 px-5 text-sm font-semibold text-slate-700 transition-colors duration-150 hover:bg-slate-50",
                stepIndex === 0 && "invisible"
              )}
            >
              <ArrowLeft className="size-4" aria-hidden /> {t("nav.back")}
            </button>

            {isReview ? (
              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className="inline-flex h-11 items-center gap-2 rounded-[0.5rem] bg-market-navy px-6 text-sm font-bold text-white transition-colors duration-150 hover:bg-market-navy-deep disabled:opacity-60"
              >
                <Send className="size-4" aria-hidden /> {t("nav.submit")}
              </button>
            ) : (
              <button
                type="button"
                onClick={goNext}
                className="inline-flex h-11 items-center gap-2 rounded-[0.5rem] bg-market-navy px-6 text-sm font-bold text-white transition-colors duration-150 hover:bg-market-navy-deep"
              >
                {t("nav.next")} <ArrowRight className="size-4" aria-hidden />
              </button>
            )}
          </div>
        </div>

        {/* Premium + help column, international path only (hidden on the
            plan step itself — see the grid className above). P1-6: this used
            to jump straight to the plan step via setStepIndex, skipping
            goNext's validation on every step in between. It now only records
            the choice — the applicant still walks the real, validated path
            to get there, and the card below shows the choice stuck. */}
        {international && !isPlanStep && (
          <IntlSidebar
            premiumSelected={plan === "premium"}
            onChoosePremium={() => selectPlan("premium")}
          />
        )}
      </section>

          {international && <IntlStrips />}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
