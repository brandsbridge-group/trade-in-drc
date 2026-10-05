"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertCircle, ArrowLeft, ArrowRight, Check, ChevronLeft, FileCheck2, Package, Send } from "lucide-react";
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

/** Draft of the form, kept in this browser so a reload or a detour loses nothing. */
const draftKey = (accountId: string) => `tidrc:register-company:draft:v1:${accountId}`;

interface WizardDraft {
  data: RegisterFormData;
  stepIndex: number;
}

/** Storage can be unavailable (private mode, blocked site data): never let it break the form. */
export function readDraft(accountId: string): WizardDraft | null {
  try {
    const raw = window.localStorage.getItem(draftKey(accountId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<WizardDraft>;
    if (!parsed.data || typeof parsed.data !== "object") return null;
    // Only keys the form still knows, so an old draft cannot inject stale fields.
    const known = Object.fromEntries(
      Object.entries(parsed.data).filter(([key]) => key in EMPTY_FORM)
    ) as Partial<RegisterFormData>;
    return { data: { ...EMPTY_FORM, ...known }, stepIndex: Number(parsed.stepIndex) || 0 };
  } catch {
    return null;
  }
}

function writeDraft(accountId: string, draft: WizardDraft | null) {
  try {
    if (draft) window.localStorage.setItem(draftKey(accountId), JSON.stringify(draft));
    else window.localStorage.removeItem(draftKey(accountId));
  } catch {
    // Nothing to do: the form simply works without a draft.
  }
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
  const [createdId, setCreatedId] = React.useState<string | null>(null);
  // Draft: restored once after mount (never during render — the server has no
  // storage, so reading it there would break hydration), then saved on change.
  const [draftRestored, setDraftRestored] = React.useState(false);
  const draftReady = React.useRef(false);
  // P2-1: the profile choice and the step form never share a screen.
  const [phase, setPhase] = React.useState<"profile" | "form">("profile");

  const accountId = account?.id;
  React.useEffect(() => {
    if (!accountId) return;
    const draft = readDraft(accountId);
    if (draft) {
      setData(draft.data);
      setStepIndex(draft.stepIndex);
      setPhase("form");
      setDraftRestored(true);
    }
    draftReady.current = true;
  }, [accountId]);

  React.useEffect(() => {
    // Only once the form is open: the gate alone is not worth a draft.
    if (!accountId || !draftReady.current || phase !== "form" || done) return;
    writeDraft(accountId, { data, stepIndex });
  }, [accountId, data, stepIndex, phase, done]);

  const discardDraft = () => {
    if (accountId) writeDraft(accountId, null);
    setData(initialData(account));
    setStepIndex(0);
    setErrors(new Set());
    setDraftRestored(false);
    setPhase("profile");
  };

  const scrollToTop = React.useCallback(() => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }, [reduceMotion]);

  const steps = stepsForProfile(data.profile);
  const step = steps[Math.min(stepIndex, steps.length - 1)];
  const isLast = stepIndex === steps.length - 1;
  const isOptional = OPTIONAL_STEPS.includes(step);

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
      if (account) {
        queryClient.invalidateQueries({ queryKey: companiesQueryKey(account.id) });
        writeDraft(account.id, null);
      }
      setCreatedId(res.companyId ?? null);
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
    if (res.error === "staff") {
      toast.error(t("errors.staff"), { id });
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
    const nextSteps = [
      { key: "documents", icon: FileCheck2 },
      { key: "product", icon: Package },
    ] as const;
    return (
      <section className="mx-auto w-full max-w-[720px]">
        <div className="relative overflow-hidden rounded-3xl bg-market-navy p-7 text-center text-white sm:p-9">
          <span aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-market-or/25 blur-3xl" />
          <span className="relative mx-auto grid size-14 place-items-center rounded-full bg-market-or text-market-navy">
            <Check className="size-7" aria-hidden />
          </span>
          <h2 className="relative mt-4 font-display text-2xl font-bold">{t("success.title")}</h2>
          <p className="relative mx-auto mt-2 max-w-md text-sm leading-relaxed text-white/70">{t("success.body")}</p>
        </div>

        <div className="mt-4 rounded-2xl bg-white p-5 ring-1 ring-slate-200/70">
          <p className="font-display text-base font-semibold text-market-navy">{t("success.nextTitle")}</p>
          <ol className="mt-3 space-y-2.5">
            {nextSteps.map(({ key, icon: Icon }) => (
              <li key={key} className="flex items-start gap-3 rounded-xl bg-slate-50 p-3.5">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-market-or-dark ring-1 ring-slate-200/70" aria-hidden>
                  <Icon className="size-[17px]" />
                </span>
                <span className="min-w-0 text-left">
                  <span className="block text-sm font-semibold text-market-navy">{t(`success.next.${key}.title`)}</span>
                  <span className="block text-xs leading-relaxed text-slate-500">{t(`success.next.${key}.body`)}</span>
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              href={createdId ? `/dashboard/companies/${createdId}/verification` : "/dashboard"}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-market-navy px-6 text-sm font-bold text-white transition-colors duration-150 hover:bg-market-navy-deep"
            >
              {t("success.cta")} <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-semibold text-market-navy transition-colors duration-150 hover:bg-slate-100"
            >
              {t("success.dashboardCta")}
            </Link>
          </div>
        </div>
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
    "inline-flex h-11 items-center gap-2 rounded-full bg-market-navy px-6 text-[13px] font-semibold text-white transition-colors duration-150 hover:bg-market-navy-deep disabled:opacity-60";

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
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-slate-600">
              {t(`profileChooser.${data.profile}.title`)}
            </p>
            <button
              type="button"
              onClick={backToGate}
              data-testid="profile-change-ghost"
              className="inline-flex h-8 items-center gap-1 rounded-full px-3 text-[13px] font-semibold text-market-navy transition-colors duration-150 hover:bg-white"
            >
              <ChevronLeft className="size-3.5" aria-hidden />
              {t("profileChooser.change")}
            </button>
          </div>

          <Stepper current={stepIndex} profile={data.profile} onStepClick={goToStep} />

          <section className="mt-4">
            <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200/70 md:p-7">
              {draftRestored && (
                <div className="mb-6 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-market-cream px-4 py-3 text-[13px] text-market-navy">
                  <p>{t("draft.restored")}</p>
                  <button
                    type="button"
                    onClick={discardDraft}
                    data-testid="draft-discard"
                    className="font-semibold underline underline-offset-4"
                  >
                    {t("draft.discard")}
                  </button>
                </div>
              )}

              {errors.size > 0 && (
                <div
                  role="alert"
                  className="mb-6 flex items-start gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-800 ring-1 ring-red-200"
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
                    "inline-flex h-11 items-center gap-2 rounded-full bg-slate-100 px-5 text-[13px] font-semibold text-market-navy transition-colors duration-150 hover:bg-slate-200",
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
                      className="inline-flex h-11 items-center rounded-full px-4 text-[13px] font-semibold text-slate-600 transition-colors duration-150 hover:bg-slate-100 disabled:opacity-60"
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
              <p className="mt-3 text-right text-xs text-slate-400">{t("draft.saved")}</p>
            </div>
          </section>

        </motion.div>
      )}
    </AnimatePresence>
  );
}
