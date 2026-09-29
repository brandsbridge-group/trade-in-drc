"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, ChevronLeft, Send } from "lucide-react";
import { isValidPhoneNumber, parsePhoneNumber } from "react-phone-number-input";
import { companiesQueryKey } from "@/hooks/use-companies";
import { Link, useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { HOME_COUNTRY, DEFAULT_DIAL_CODE } from "@/config/geo";
import {
  stepsForProfile,
  LOGIN_REDIRECT,
  OPTIONAL_STEPS,
  SIGNUP_REDIRECT,
  type RegistrationProfile,
  type WizardStep,
} from "./constants";
import {
  EMPTY_FORM,
  fieldLabelKey,
  filterKnownFields,
  isInternational,
  requiredForStep,
  stepForInvalidFields,
  type RegisterFormData,
  type RegisterResult,
  type SectorOption,
} from "./types";
import { registerCompany } from "./register-company-actions";
import { Stepper } from "./stepper";
import { ProfileGate } from "./profile-gate";
import { StepCompany } from "./step-company";
import { StepContact } from "./step-contact";
import { StepMarketInterestOptional } from "./step-market-interest-optional";
import { IntlStrips } from "./intl-strips";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The signed-in account, used to prefill the contact step. `null` = signed out. */
export interface RegisterAccount {
  id: string;
  email: string;
  fullName: string | null;
  /** E.164, from profiles.phone (00046). */
  phone: string | null;
}

/** Missing or malformed required fields for a given step. */
export function missingFields(
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
  if (step === "contact") {
    if (data.officialEmail && !EMAIL_RE.test(data.officialEmail)) missing.add("officialEmail");
    if (data.phone && !isValidPhoneNumber(data.phone)) missing.add("phone");
  }
  return missing;
}

/**
 * What the server receives: the E.164 phone split into dialCode + national
 * number (stored as "+243 812345678"), the international head office composed
 * as "City, Country", and — when the optional step was skipped — no interests.
 */
export function toSubmitData(data: RegisterFormData, skipOptional: boolean): RegisterFormData {
  const out = { ...data };
  const parsed = data.phone ? parsePhoneNumber(data.phone) : undefined;
  if (parsed) {
    out.dialCode = `+${parsed.countryCallingCode}`;
    out.phone = parsed.nationalNumber;
  }
  if (isInternational(data)) {
    out.headOffice = [data.city.trim(), data.country].filter(Boolean).join(", ");
    if (skipOptional) {
      out.drcInterests = [];
      out.targetProvinces = [];
      out.entryTimeline = "";
    }
  }
  return out;
}

function initialData(account: RegisterAccount | null): RegisterFormData {
  if (!account) return EMPTY_FORM;
  return {
    ...EMPTY_FORM,
    // Public contact address — defaults to the login e-mail, editable.
    officialEmail: account.email,
    contactPerson: account.fullName ?? "",
    phone: account.phone ?? "",
  };
}

export function RegisterWizard({
  sectors,
  account,
}: {
  sectors: SectorOption[];
  account: RegisterAccount | null;
}) {
  const t = useTranslations("RegisterCompany");
  const router = useRouter();
  const queryClient = useQueryClient();
  const reduceMotion = useReducedMotion();

  const [stepIndex, setStepIndex] = React.useState(0);
  const [data, setData] = React.useState<RegisterFormData>(() => initialData(account));
  const [errors, setErrors] = React.useState<Set<keyof RegisterFormData>>(new Set());
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState(false);
  // P2-1: the profile choice and the step form never share a screen.
  const [phase, setPhase] = React.useState<"profile" | "form">("profile");

  const scrollToTop = React.useCallback(() => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }, [reduceMotion]);

  const steps = stepsForProfile(data.profile);
  const step = steps[Math.min(stepIndex, steps.length - 1)];
  const isLast = stepIndex === steps.length - 1;
  const isOptional = OPTIONAL_STEPS.includes(step);
  const international = data.profile === "international";

  const update = (patch: Partial<RegisterFormData>) => {
    setData((prev) => ({ ...prev, ...patch }));
    // Stop naming a field in the error banner as soon as it's touched.
    setErrors((prev) => {
      const touched = Object.keys(patch) as (keyof RegisterFormData)[];
      if (!touched.some((key) => prev.has(key))) return prev;
      const next = new Set(prev);
      for (const key of touched) next.delete(key);
      return next;
    });
  };

  /** Switching profile restarts the form — the two paths share no step order. */
  const selectProfile = (profile: RegistrationProfile) => {
    if (profile === data.profile) return;
    setStepIndex(0);
    setErrors(new Set());
    // An international company must pick its own country; a Congolese one is
    // always in the DRC (the country field is locked on that path).
    update(
      profile === "international"
        ? { profile, country: "", dialCode: "", province: "" }
        : { profile, country: HOME_COUNTRY, dialCode: DEFAULT_DIAL_CODE }
    );
  };

  /** The form only ever renders with a session: signed-out visitors create an
   *  account first and come back here once their e-mail is confirmed. */
  const continueFromGate = () => {
    if (!account) {
      router.push(SIGNUP_REDIRECT);
      return;
    }
    setPhase("form");
    scrollToTop();
  };

  const backToGate = () => {
    setPhase("profile");
    scrollToTop();
  };

  const goToStep = (index: number) => {
    setErrors(new Set());
    setStepIndex(index);
    scrollToTop();
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

  const submit = async (skipOptional = false) => {
    // Re-validate every step; jump to the first with a problem.
    for (let i = 0; i < steps.length; i += 1) {
      const missing = missingFields(steps[i], data);
      if (missing.size > 0) {
        setStepIndex(i);
        setErrors(missing);
        scrollToTop();
        toast.error(t("errors.required"));
        return;
      }
    }
    setSubmitting(true);
    const id = toast.loading(t("nav.submitting"));
    let res: RegisterResult;
    try {
      res = await registerCompany({ plan: "free", data: toSubmitData(data, skipOptional) });
    } catch (e) {
      console.error("[registerCompany] threw", e);
      toast.error(t("errors.server"), { id });
      setSubmitting(false);
      return;
    }
    setSubmitting(false);

    if (res.ok) {
      toast.success(t("success.title"), { id });
      // The dashboard's companies list must show the new company right away.
      if (account) queryClient.invalidateQueries({ queryKey: companiesQueryKey(account.id) });
      setDone(true);
      scrollToTop();
      return;
    }
    if (res.error === "auth") {
      // Session expired between page load and submit.
      toast.error(t("errors.auth"), { id });
      router.push(LOGIN_REDIRECT);
      return;
    }
    if (res.error === "invalid") {
      const fields = filterKnownFields(res.fields ?? []);
      setErrors(new Set(fields));
      const target = stepForInvalidFields(data.profile, fields, data);
      if (target) setStepIndex(steps.indexOf(target));
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
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">{t("success.body")}</p>
        <Link
          href="/dashboard/companies"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-[0.5rem] bg-market-navy px-6 text-sm font-bold text-white transition-colors duration-150 hover:bg-market-navy-deep"
        >
          {t("success.cta")}
        </Link>
      </section>
    );
  }

  // P2-6 (docs/MOTION.md §2.7): gate <-> form never cross-fade.
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

  const primaryBtn =
    "inline-flex h-11 items-center gap-2 rounded-[0.5rem] bg-market-navy px-6 text-sm font-bold text-white transition-colors duration-150 hover:bg-market-navy-deep disabled:opacity-60";

  return (
    <AnimatePresence mode="wait" initial={false}>
      {phase === "profile" ? (
        <motion.div key="profile" {...phaseMotionProps}>
          <ProfileGate
            selected={data.profile}
            onSelect={selectProfile}
            onContinue={continueFromGate}
            signedIn={Boolean(account)}
          />
        </motion.div>
      ) : (
        <motion.div key="form" {...phaseMotionProps}>
          <div className="mx-auto flex w-full max-w-[900px] items-center justify-between px-4 pt-6 md:px-6">
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

          <section className="mx-auto w-full max-w-[900px] px-4 pb-14 md:px-6">
            <div className="rounded-[0.5rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
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

              {step === "company" && (
                <StepCompany data={data} update={update} errors={errors} sectors={sectors} />
              )}
              {step === "contact" && <StepContact data={data} update={update} errors={errors} />}
              {step === "market_interest" && (
                <StepMarketInterestOptional data={data} update={update} />
              )}

              <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
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

                <div className="flex flex-wrap items-center gap-3">
                  {isOptional && (
                    <button
                      type="button"
                      onClick={() => submit(true)}
                      disabled={submitting}
                      data-testid="skip-optional"
                      className="inline-flex h-11 items-center rounded-[0.5rem] px-4 text-sm font-semibold text-slate-600 transition-colors duration-150 hover:bg-slate-100 disabled:opacity-60"
                    >
                      {t("nav.skip")}
                    </button>
                  )}
                  {isLast ? (
                    <button
                      type="button"
                      onClick={() => submit(false)}
                      disabled={submitting}
                      className={primaryBtn}
                    >
                      <Send className="size-4" aria-hidden /> {t("nav.submit")}
                    </button>
                  ) : (
                    <button type="button" onClick={goNext} className={primaryBtn}>
                      {t("nav.next")} <ArrowRight className="size-4" aria-hidden />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>

          {international && <IntlStrips />}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
