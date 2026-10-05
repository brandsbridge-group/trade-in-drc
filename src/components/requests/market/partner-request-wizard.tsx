"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Check,
  CheckCircle2,
  Copy,
  Factory,
  FileText,
  Globe2,
  Handshake,
  Landmark,
  Loader2,
  Lock,
  Package,
  RotateCcw,
  Truck,
  UploadCloud,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Link } from "@/i18n/routing";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CountryCombobox } from "@/components/forms/country-combobox";
import { PhoneNumberInput } from "@/components/auth/phone-field";
import { CaptchaWidget, isCaptchaWidgetEnabled } from "@/components/messaging/captcha-widget";
import { COUNTRIES } from "@/config/geo";
import { DRC_PROVINCES } from "@/config/provinces";
import { createClient } from "@/lib/supabase/client";
import { readLocalDraft, writeLocalDraft } from "@/lib/drafts/local-draft";
import { cn } from "@/lib/utils";
import {
  ATTACHMENT_ACCEPT,
  ATTACHMENT_BUCKET,
  EMPTY_PARTNER_REQUEST,
  NEEDS,
  PREFERENCES,
  REQUEST_STEPS,
  STEP_FIELDS,
  TIMELINES,
  VOLUMES,
  attachmentError,
  firstInvalidStep,
  stepErrors,
  validatePartnerRequest,
  type BusinessNeed,
  type FieldErrors,
  type PartnerRequestValues,
  type Preference,
  type RequestField,
  type RequestStep,
} from "@/lib/requests/partner-request";
import { createRequestAttachmentUpload, submitPartnerRequest } from "./partner-request-actions";

const DRAFT_KEY = "tidrc:partner-request:draft:v1";
/** Radix Select has no empty value: this stands for "anywhere / not decided". */
const ANY = "__any__";

const NEED_ICON: Record<BusinessNeed, LucideIcon> = {
  supplier: Factory,
  distributor: Truck,
  representative: UserRound,
  jv_partner: Handshake,
  service_provider: Briefcase,
  institutional: Landmark,
  enter_market: Globe2,
  source_products: Package,
};

const INPUT =
  "h-11 w-full min-w-0 rounded-xl bg-white px-3.5 text-sm text-market-navy outline-none ring-1 ring-slate-200 transition-colors placeholder:text-slate-400 focus:ring-2 focus:ring-market-navy/30 aria-[invalid=true]:ring-market-red/60";
const TRIGGER =
  "h-11 w-full min-w-0 rounded-xl border-0 bg-white px-3.5 text-sm shadow-none ring-1 ring-slate-200 focus:ring-2 focus:ring-market-navy/30 aria-[invalid=true]:ring-market-red/60";

interface SectorOption {
  id: string;
  label: string;
}

interface Attachment {
  name: string;
  /** Set once the file is in Storage. */
  path: string | null;
}

interface DraftShape {
  values?: Partial<PartnerRequestValues>;
  step?: number;
}

function Field({
  id,
  label,
  required,
  optionalLabel,
  error,
  hint,
  className,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  optionalLabel?: string;
  error?: string | null;
  hint?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <label htmlFor={id} className="mb-1.5 flex items-baseline gap-1.5 text-[13px] font-medium text-market-navy">
        {label}
        {required ? (
          <span className="text-market-red" aria-hidden>*</span>
        ) : (
          optionalLabel && <span className="text-xs font-normal text-slate-400">({optionalLabel})</span>
        )}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs font-medium text-market-red">{error}</p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
      )}
    </div>
  );
}

interface WizardProps {
  sectors: SectorOption[];
  /** What is already known about a signed-in visitor. */
  prefill: Partial<PartnerRequestValues>;
}

/**
 * The "find a local partner" form as three short steps — the need, the
 * details, the contact — with a named progress trail. A step is checked before
 * moving on and each problem is written under its field; what was typed is kept
 * in the browser, so leaving the page does not lose it.
 */
export function PartnerRequestWizard({ sectors, prefill }: WizardProps) {
  const t = useTranslations("FindPartner");
  const locale = useLocale();

  const initial = React.useMemo<PartnerRequestValues>(() => ({ ...EMPTY_PARTNER_REQUEST, ...prefill }), [prefill]);
  const [values, setValues] = React.useState<PartnerRequestValues>(initial);
  const [stepIndex, setStepIndex] = React.useState(0);
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [attachment, setAttachment] = React.useState<Attachment | null>(null);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const [captchaToken, setCaptchaToken] = React.useState<string | null>(null);
  const [trap, setTrap] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState<{ reference: string | null; emailSent: boolean; email: string } | null>(null);
  const [draftRestored, setDraftRestored] = React.useState(false);
  // The draft is read once the page is in the browser; nothing is written before.
  const [draftReady, setDraftReady] = React.useState(false);

  const topRef = React.useRef<HTMLDivElement>(null);
  const step: RequestStep = REQUEST_STEPS[stepIndex];
  const uploading = attachment !== null && attachment.path === null;

  React.useEffect(() => {
    const draft = readLocalDraft<DraftShape>(DRAFT_KEY);
    if (draft?.values) {
      setValues((current) => ({ ...current, ...draft.values, preferences: draft.values?.preferences ?? current.preferences }));
      setStepIndex(Math.min(Math.max(draft.step ?? 0, 0), REQUEST_STEPS.length - 1));
      setDraftRestored(true);
    }
    setDraftReady(true);
  }, []);

  React.useEffect(() => {
    if (!draftReady || done) return;
    const untouched = JSON.stringify(values) === JSON.stringify(initial);
    writeLocalDraft(DRAFT_KEY, untouched ? null : { values, step: stepIndex });
  }, [values, stepIndex, initial, draftReady, done]);

  const set = <K extends RequestField>(field: K, value: PartnerRequestValues[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
    setFormError(null);
  };

  const errorText = (field: RequestField): string | null => {
    const code = errors[field];
    if (!code) return null;
    return field === "need" ? t("errors.need") : t(`errors.${code}`);
  };

  const goTo = (index: number) => {
    setStepIndex(index);
    setFormError(null);
    topRef.current?.scrollIntoView({ block: "start" });
  };

  /** Shows a step's problems and puts the cursor in the first one. */
  const reveal = (found: FieldErrors) => {
    setErrors(found);
    setFormError(t("wizard.errorSummary"));
    const first = (Object.keys(found) as RequestField[])[0];
    requestAnimationFrame(() => document.getElementById(`pr-${first}`)?.focus());
  };

  const next = () => {
    const found = stepErrors(values, step);
    if (Object.keys(found).length > 0) return reveal(found);
    setErrors({});
    goTo(stepIndex + 1);
  };

  const discardDraft = () => {
    writeLocalDraft(DRAFT_KEY, null);
    setValues(initial);
    setErrors({});
    setAttachment(null);
    setDraftRestored(false);
    goTo(0);
  };

  const uploadFile = async (file: File | null | undefined) => {
    if (!file) return;
    setUploadError(null);
    const problem = attachmentError(file);
    if (problem) return setUploadError(t(`upload.${problem}`));

    setAttachment({ name: file.name, path: null });
    try {
      const slot = await createRequestAttachmentUpload({ size: file.size, type: file.type });
      if (!slot.ok || !slot.path || !slot.token) throw new Error(slot.error ?? "server");
      const { error } = await createClient().storage.from(ATTACHMENT_BUCKET).uploadToSignedUrl(slot.path, slot.token, file);
      if (error) throw error;
      setAttachment({ name: file.name, path: slot.path });
    } catch {
      setAttachment(null);
      setUploadError(t("upload.server"));
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (stepIndex < REQUEST_STEPS.length - 1) return next();

    const all = validatePartnerRequest(values);
    const blocked = firstInvalidStep(values);
    if (blocked) {
      setStepIndex(REQUEST_STEPS.indexOf(blocked));
      return reveal(Object.fromEntries(Object.entries(all).filter(([f]) => STEP_FIELDS[blocked].includes(f as RequestField))) as FieldErrors);
    }

    setSubmitting(true);
    setFormError(null);
    try {
      const result = await submitPartnerRequest({
        values,
        locale,
        attachment: attachment?.path ? { path: attachment.path, name: attachment.name } : null,
        captchaToken,
        trap,
      });
      if (!result.ok) {
        if (result.error === "validation" && result.fieldErrors) {
          const serverBlocked = REQUEST_STEPS.find((s) => STEP_FIELDS[s].some((f) => result.fieldErrors?.[f]));
          if (serverBlocked) setStepIndex(REQUEST_STEPS.indexOf(serverBlocked));
          return reveal(result.fieldErrors);
        }
        setFormError(
          result.error === "captcha" ? t("wizard.errorCaptcha") : result.error === "rate_limited" ? t("wizard.errorRate") : t("wizard.errorServer")
        );
        return;
      }
      writeLocalDraft(DRAFT_KEY, null);
      setDone({ reference: result.reference ?? null, emailSent: result.emailSent === true, email: values.email.trim() });
      topRef.current?.scrollIntoView({ block: "start" });
    } catch {
      setFormError(t("wizard.errorServer"));
    } finally {
      setSubmitting(false);
    }
  };

  const restart = () => {
    setDone(null);
    // Who is asking has not changed: only the need is cleared.
    setValues((current) => ({
      ...current,
      need: "",
      productService: "",
      sectorId: "",
      targetProvince: "",
      timeline: "",
      volume: "",
      requirement: "",
      preferences: [],
    }));
    setAttachment(null);
    setErrors({});
    setDraftRestored(false);
    setStepIndex(0);
  };

  if (done) {
    return (
      <div ref={topRef} className="scroll-mt-24 rounded-2xl bg-white p-6 ring-1 ring-slate-200/70 sm:p-10">
        <div className="mx-auto flex max-w-lg flex-col items-center text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-emerald-600" aria-hidden>
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <h2 className="mt-4 font-display text-2xl font-semibold text-market-navy">{t("done.title")}</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{t("done.body")}</p>

          {done.reference && (
            <div className="mt-6 w-full rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200/70">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">{t("done.referenceLabel")}</p>
              <div className="mt-1.5 flex flex-wrap items-center justify-center gap-2">
                <p className="font-mono text-lg font-bold tabular-nums text-market-navy">{done.reference}</p>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(done.reference ?? "");
                      toast.success(t("done.copied"));
                    } catch {
                      /* The reference stays on screen; nothing else to do. */
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-market-navy ring-1 ring-slate-200 transition-colors hover:bg-slate-100"
                >
                  <Copy className="h-3.5 w-3.5" aria-hidden />
                  {t("done.copy")}
                </button>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-slate-500">
                {done.emailSent ? t("done.emailSent", { email: done.email }) : t("done.noEmail")}
              </p>
            </div>
          )}

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {done.reference && (
              <Link
                href={`/request/track?ref=${encodeURIComponent(done.reference)}`}
                className="inline-flex items-center gap-2 rounded-full bg-market-navy px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-market-navy-deep"
              >
                {t("done.track")}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            )}
            <button
              type="button"
              onClick={restart}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-market-navy ring-1 ring-slate-200 transition-colors hover:bg-slate-50"
            >
              {t("done.another")}
            </button>
          </div>
          <Link href="/companies" className="mt-4 text-sm font-medium text-slate-500 underline-offset-2 transition-colors hover:text-market-navy hover:underline">
            {t("done.browse")}
          </Link>
        </div>
      </div>
    );
  }

  const optional = t("wizard.optional");

  return (
    <div ref={topRef} className="scroll-mt-24 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200/70">
      {/* Progress: three named steps; a finished one can be reopened. */}
      <div className="border-b border-slate-100 px-5 pb-4 pt-5 sm:px-7">
        <ol className="flex items-center gap-2">
          {REQUEST_STEPS.map((key, index) => {
            const state = index < stepIndex ? "done" : index === stepIndex ? "current" : "upcoming";
            return (
              <li key={key} className="flex min-w-0 flex-1 items-center gap-2">
                <button
                  type="button"
                  disabled={state === "upcoming"}
                  onClick={() => goTo(index)}
                  aria-current={state === "current" ? "step" : undefined}
                  className="flex min-w-0 items-center gap-2 text-left disabled:cursor-default"
                >
                  <span
                    className={cn(
                      "grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold transition-colors",
                      state === "done" && "bg-emerald-500 text-white",
                      state === "current" && "bg-market-navy text-white",
                      state === "upcoming" && "bg-slate-100 text-slate-400"
                    )}
                  >
                    {state === "done" ? <Check className="h-3.5 w-3.5" aria-hidden /> : index + 1}
                  </span>
                  <span
                    className={cn(
                      "hidden truncate text-[13px] sm:block",
                      state === "current" ? "font-semibold text-market-navy" : state === "done" ? "font-medium text-slate-600" : "text-slate-400"
                    )}
                  >
                    {t(`wizard.steps.${key}`)}
                  </span>
                </button>
                {index < REQUEST_STEPS.length - 1 && (
                  <span className={cn("h-px min-w-3 flex-1 transition-colors", index < stepIndex ? "bg-emerald-400" : "bg-slate-200")} aria-hidden />
                )}
              </li>
            );
          })}
        </ol>
        <p className="mt-3 text-xs text-slate-500 sm:hidden">
          {t("wizard.stepOf", { current: stepIndex + 1, total: REQUEST_STEPS.length })} · <span className="font-semibold text-market-navy">{t(`wizard.steps.${step}`)}</span>
        </p>
      </div>

      <form onSubmit={submit} noValidate className="px-5 py-6 sm:px-7">
        {draftRestored && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-market-cream px-4 py-2.5 text-[13px] text-market-navy">
            <span>{t("wizard.draftRestored")}</span>
            <button type="button" onClick={discardDraft} className="inline-flex items-center gap-1.5 font-semibold underline-offset-2 hover:underline">
              <RotateCcw className="h-3.5 w-3.5" aria-hidden />
              {t("wizard.draftDiscard")}
            </button>
          </div>
        )}

        {step === "need" && (
          <fieldset>
            <legend className="font-display text-xl font-semibold text-market-navy">{t("wizard.needTitle")}</legend>
            <p className="mt-1 text-sm text-slate-500">{t("wizard.needIntro")}</p>
            <div role="radiogroup" aria-invalid={!!errors.need} className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {NEEDS.map((need, index) => {
                const Icon = NEED_ICON[need];
                const active = values.need === need;
                return (
                  <button
                    key={need}
                    id={index === 0 ? "pr-need" : undefined}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => set("need", need)}
                    className={cn(
                      "flex min-w-0 items-center gap-3 rounded-xl p-3.5 text-left ring-1 transition-colors",
                      active ? "bg-market-navy text-white ring-market-navy" : "bg-white text-market-navy ring-slate-200 hover:bg-slate-50"
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-colors",
                        active ? "bg-white/10 text-market-or-light" : "bg-slate-100 text-market-navy"
                      )}
                      aria-hidden
                    >
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                    <span className="min-w-0 flex-1 text-sm font-semibold leading-snug">{t(`needs.${need}`)}</span>
                    <span
                      className={cn(
                        "grid h-5 w-5 shrink-0 place-items-center rounded-full ring-1 transition-colors",
                        active ? "bg-market-or text-market-navy ring-market-or" : "ring-slate-300"
                      )}
                      aria-hidden
                    >
                      {active && <Check className="h-3 w-3" />}
                    </span>
                  </button>
                );
              })}
            </div>
            {errors.need && <p role="alert" className="mt-3 text-xs font-medium text-market-red">{t("errors.need")}</p>}
          </fieldset>
        )}

        {step === "details" && (
          <div>
            <h2 className="font-display text-xl font-semibold text-market-navy">{t("wizard.detailsTitle")}</h2>
            <p className="mt-1 text-sm text-slate-500">{t("wizard.detailsIntro")}</p>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field id="pr-productService" label={t("fields.productService")} required error={errorText("productService")} className="sm:col-span-2">
                <input
                  id="pr-productService"
                  className={INPUT}
                  value={values.productService}
                  onChange={(e) => set("productService", e.target.value)}
                  placeholder={t("fields.productServicePlaceholder")}
                  aria-invalid={!!errors.productService}
                  aria-describedby={errors.productService ? "pr-productService-error" : undefined}
                />
              </Field>

              <Field id="pr-sectorId" label={t("fields.sector")} optionalLabel={optional}>
                <Select value={values.sectorId || undefined} onValueChange={(v) => set("sectorId", v)}>
                  <SelectTrigger id="pr-sectorId" className={TRIGGER}>
                    <SelectValue placeholder={t("fields.sectorPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {sectors.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field id="pr-targetProvince" label={t("fields.province")} optionalLabel={optional}>
                <Select value={values.targetProvince || ANY} onValueChange={(v) => set("targetProvince", v === ANY ? "" : v)}>
                  <SelectTrigger id="pr-targetProvince" className={TRIGGER}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY}>{t("fields.provinceAny")}</SelectItem>
                    {DRC_PROVINCES.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field id="pr-timeline" label={t("fields.timeline")} required error={errorText("timeline")} className="sm:col-span-2">
                <div role="radiogroup" aria-invalid={!!errors.timeline} className="flex flex-wrap gap-2">
                  {TIMELINES.map((timeline, index) => {
                    const active = values.timeline === timeline;
                    return (
                      <button
                        key={timeline}
                        id={index === 0 ? "pr-timeline" : undefined}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => set("timeline", timeline)}
                        className={cn(
                          "rounded-full px-4 py-2 text-[13px] font-medium ring-1 transition-colors",
                          active ? "bg-market-navy text-white ring-market-navy" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                        )}
                      >
                        {t(`timelines.${timeline}`)}
                      </button>
                    );
                  })}
                </div>
              </Field>

              <Field id="pr-volume" label={t("fields.volume")} optionalLabel={optional} className="sm:col-span-2">
                <Select value={values.volume || undefined} onValueChange={(v) => set("volume", v as PartnerRequestValues["volume"])}>
                  <SelectTrigger id="pr-volume" className={cn(TRIGGER, "sm:max-w-xs")}>
                    <SelectValue placeholder={t("fields.volumePlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {VOLUMES.map((v) => (
                      <SelectItem key={v} value={v}>{t(`volumes.${v}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field
                id="pr-requirement"
                label={t("fields.requirement")}
                required
                error={errorText("requirement")}
                hint={t("fields.requirementCount", { count: values.requirement.trim().length })}
                className="sm:col-span-2"
              >
                <textarea
                  id="pr-requirement"
                  rows={5}
                  className={cn(INPUT, "h-auto resize-y py-3 leading-relaxed")}
                  value={values.requirement}
                  onChange={(e) => set("requirement", e.target.value)}
                  placeholder={t("fields.requirementPlaceholder")}
                  aria-invalid={!!errors.requirement}
                  aria-describedby={errors.requirement ? "pr-requirement-error" : undefined}
                />
              </Field>

              <Field id="pr-attachment" label={t("fields.attachment")} optionalLabel={optional} error={uploadError} className="sm:col-span-2">
                {attachment ? (
                  <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3.5 py-3 ring-1 ring-slate-200/70">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-market-navy ring-1 ring-slate-200/70" aria-hidden>
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-market-navy">{attachment.name}</p>
                      <p className="text-xs text-slate-500" aria-live="polite">{uploading ? t("upload.uploading") : t("upload.done")}</p>
                    </div>
                    {!uploading && (
                      <button
                        type="button"
                        onClick={() => setAttachment(null)}
                        aria-label={t("upload.remove")}
                        title={t("upload.remove")}
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-500 transition-colors hover:bg-slate-200 hover:text-market-navy"
                      >
                        <X className="h-4 w-4" aria-hidden />
                      </button>
                    )}
                  </div>
                ) : (
                  <label
                    htmlFor="pr-attachment"
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragging(false);
                      void uploadFile(e.dataTransfer.files?.[0]);
                    }}
                    className={cn(
                      "flex cursor-pointer flex-col items-center gap-1 rounded-xl border border-dashed px-4 py-5 text-center transition-colors",
                      dragging ? "border-market-navy bg-slate-50" : "border-slate-300 hover:border-market-navy/60 hover:bg-slate-50"
                    )}
                  >
                    <UploadCloud className="h-5 w-5 text-market-navy/70" aria-hidden />
                    <span className="text-[13px] font-medium text-market-navy">{t("upload.title")}</span>
                    <span className="text-xs text-slate-500">{t("upload.hint")}</span>
                    <input
                      id="pr-attachment"
                      type="file"
                      accept={ATTACHMENT_ACCEPT}
                      className="sr-only"
                      onChange={(e) => {
                        void uploadFile(e.target.files?.[0]);
                        e.target.value = "";
                      }}
                    />
                  </label>
                )}
              </Field>

              <fieldset className="min-w-0 sm:col-span-2">
                <legend className="mb-2 flex items-baseline gap-1.5 text-[13px] font-medium text-market-navy">
                  {t("fields.preferences")} <span className="text-xs font-normal text-slate-400">({optional})</span>
                </legend>
                <div className="flex flex-wrap gap-2">
                  {PREFERENCES.map((pref: Preference) => {
                    const checked = values.preferences.includes(pref);
                    return (
                      <label
                        key={pref}
                        className={cn(
                          "inline-flex cursor-pointer items-center gap-2 rounded-full px-3.5 py-2 text-[13px] ring-1 transition-colors",
                          checked ? "bg-market-cream font-medium text-market-navy ring-market-or/50" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                        )}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={checked}
                          onChange={() =>
                            set("preferences", checked ? values.preferences.filter((p) => p !== pref) : [...values.preferences, pref])
                          }
                        />
                        <span
                          className={cn(
                            "grid h-4 w-4 shrink-0 place-items-center rounded ring-1 transition-colors",
                            checked ? "bg-market-navy text-white ring-market-navy" : "ring-slate-300"
                          )}
                          aria-hidden
                        >
                          {checked && <Check className="h-3 w-3" />}
                        </span>
                        {t(`checkboxes.${pref}`)}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            </div>
          </div>
        )}

        {step === "contact" && (
          <div>
            <h2 className="font-display text-xl font-semibold text-market-navy">{t("wizard.contactTitle")}</h2>
            <p className="mt-1 text-sm text-slate-500">{t("wizard.contactIntro")}</p>

            {/* What is about to be sent, with a way back to change it. */}
            {values.need && (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200/70">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">{t("wizard.recapTitle")}</p>
                  <p className="truncate text-sm font-semibold text-market-navy">
                    {t(`needs.${values.need}`)}
                    {values.productService.trim() && <span className="font-normal text-slate-600"> — {values.productService.trim()}</span>}
                  </p>
                </div>
                <button type="button" onClick={() => goTo(1)} className="text-[13px] font-semibold text-market-navy underline-offset-2 hover:underline">
                  {t("wizard.recapEdit")}
                </button>
              </div>
            )}

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field id="pr-companyName" label={t("fields.companyName")} required error={errorText("companyName")}>
                <input
                  id="pr-companyName"
                  className={INPUT}
                  autoComplete="organization"
                  value={values.companyName}
                  onChange={(e) => set("companyName", e.target.value)}
                  placeholder={t("fields.companyNamePlaceholder")}
                  aria-invalid={!!errors.companyName}
                />
              </Field>
              <Field id="pr-contactPerson" label={t("fields.contactPerson")} required error={errorText("contactPerson")}>
                <input
                  id="pr-contactPerson"
                  className={INPUT}
                  autoComplete="name"
                  value={values.contactPerson}
                  onChange={(e) => set("contactPerson", e.target.value)}
                  placeholder={t("fields.contactPersonPlaceholder")}
                  aria-invalid={!!errors.contactPerson}
                />
              </Field>
              <Field id="pr-email" label={t("fields.email")} required error={errorText("email")}>
                <input
                  id="pr-email"
                  type="email"
                  inputMode="email"
                  className={INPUT}
                  autoComplete="email"
                  value={values.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder={t("fields.emailPlaceholder")}
                  aria-invalid={!!errors.email}
                />
              </Field>
              <Field id="pr-phone" label={t("fields.phone")} optionalLabel={optional} error={errorText("phone")}>
                <PhoneNumberInput id="pr-phone" value={values.phone} onChange={(v) => set("phone", v ?? "")} invalid={!!errors.phone} />
              </Field>
              <Field id="pr-country" label={t("fields.country")} required error={errorText("country")}>
                <CountryCombobox
                  id="pr-country"
                  value={values.country}
                  onChange={(v) => set("country", v)}
                  options={COUNTRIES}
                  placeholder={t("fields.countryPlaceholder")}
                  searchPlaceholder={t("fields.countrySearch")}
                  emptyText={t("fields.countryNoResults")}
                />
              </Field>
              <Field id="pr-website" label={t("fields.website")} optionalLabel={optional} error={errorText("website")}>
                <input
                  id="pr-website"
                  className={INPUT}
                  inputMode="url"
                  autoComplete="url"
                  value={values.website}
                  onChange={(e) => set("website", e.target.value)}
                  placeholder={t("fields.websitePlaceholder")}
                  aria-invalid={!!errors.website}
                />
              </Field>
            </div>

            {/* A field no person sees or fills in: anything typed here marks an automated sender. */}
            <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden>
              <label htmlFor="pr-fax">Fax</label>
              <input id="pr-fax" name="fax" tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} />
            </div>

            {isCaptchaWidgetEnabled() && (
              <div className="mt-5">
                <CaptchaWidget onToken={setCaptchaToken} />
              </div>
            )}

            <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-slate-500">
              <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              {t("wizard.privacy")}
            </p>
          </div>
        )}

        {formError && (
          <p role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-2.5 text-[13px] font-medium text-market-red">
            {formError}
          </p>
        )}

        <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-5">
          {stepIndex > 0 ? (
            <button
              type="button"
              onClick={() => goTo(stepIndex - 1)}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-market-navy transition-colors hover:bg-slate-100"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              {t("wizard.back")}
            </button>
          ) : (
            <span />
          )}
          <button
            type="submit"
            disabled={submitting || uploading}
            className="inline-flex items-center gap-2 rounded-full bg-market-navy px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-market-navy-deep disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {stepIndex < REQUEST_STEPS.length - 1 ? t("wizard.next") : submitting ? t("wizard.submitting") : t("wizard.submit")}
            {stepIndex < REQUEST_STEPS.length - 1 && <ArrowRight className="h-4 w-4" aria-hidden />}
          </button>
        </div>
      </form>
    </div>
  );
}

