"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2 } from "lucide-react";

import { useAuth } from "@/lib/auth/auth-provider";
import { COUNTRIES } from "@/config/geo";
import { submitOfferRequest, type OfferRequestInput } from "./offer-request-actions";

type Step = 1 | 2 | "done";

const FIELD =
  "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 transition-[background-color,border-color,box-shadow] duration-150 ease-out placeholder:text-slate-400 focus:border-primary/60 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10";
const LABEL = "mb-1 block text-xs font-semibold text-slate-700";

/**
 * "Request a quote" (wireframe 2026-09, offer detail). Step 1 is the need
 * (quantity, delivery place, deadline, details), step 2 the requester's
 * contact. No account needed; the lead is triaged by the team (see
 * submitOfferRequest). Steps swap instantly — focus moves to the new step's
 * first field so keyboard and screen-reader users follow along.
 */
export function OfferRequestForm({ productId }: { productId: string }) {
  const t = useTranslations("OfferDetail.request");
  const { user } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  const [values, setValues] = useState({
    quantity: "",
    deliveryPlace: "",
    deadline: "",
    details: "",
    fullName: "",
    companyName: "",
    email: "",
    phone: "",
    country: "",
  });
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);
  const stepChanged = useRef(false);

  useEffect(() => {
    if (!stepChanged.current) return;
    if (step === "done") doneRef.current?.focus();
    else firstFieldRef.current?.focus();
  }, [step]);

  const set = (key: keyof typeof values) => (e: { target: { value: string } }) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  function goTo(next: Step) {
    stepChanged.current = true;
    setError(null);
    setStep(next);
  }

  function submit() {
    setError(null);
    const payload: OfferRequestInput = {
      productId,
      ...values,
      email: values.email || user?.email || "",
    };
    startTransition(async () => {
      const res = await submitOfferRequest(payload);
      if (res.ok) {
        setReference(res.reference ?? null);
        goTo("done");
      } else {
        setError(t(res.error === "invalid" ? "errorInvalid" : "errorServer"));
      }
    });
  }

  if (step === "done") {
    return (
      <div ref={doneRef} tabIndex={-1} className="text-center focus:outline-none" role="status">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-50 ring-8 ring-emerald-50/50">
          <CheckCircle2 className="h-7 w-7 text-emerald-600" aria-hidden />
        </span>
        <p className="mt-3 font-display text-base font-bold text-[var(--color-landing-navy)]">
          {t("doneTitle")}
        </p>
        <p className="mt-1 text-[13px] leading-relaxed text-slate-600">{t("doneBody")}</p>
        {reference && (
          <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-[13px] text-slate-700">
            {t("reference")} <span className="font-mono font-semibold">{reference}</span>
          </p>
        )}
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (step === 1) goTo(2);
        else submit();
      }}
    >
      <ol className="flex items-center gap-2" aria-label={t(step === 1 ? "step1" : "step2")}>
        {([1, 2] as const).map((n) => {
          const current = step === n;
          const done = step === 2 && n === 1;
          return (
            <li key={n} className="flex flex-1 items-center gap-2" aria-current={current ? "step" : undefined}>
              <span
                className={`grid h-6 w-6 flex-none place-items-center rounded-full text-[11px] font-bold transition-colors duration-150 ease-out ${
                  current
                    ? "bg-primary text-white"
                    : done
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-100 text-slate-400"
                }`}
              >
                {done ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> : n}
              </span>
              <span
                className={`truncate text-xs font-semibold ${current ? "text-[var(--color-landing-navy)]" : "text-slate-400"}`}
              >
                {t(n === 1 ? "stepNeed" : "stepContact")}
              </span>
              {n === 1 && <span aria-hidden className="h-px flex-1 bg-slate-200" />}
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-xs text-slate-500">{t(step === 1 ? "step1" : "step2")}</p>

      {step === 1 ? (
        <div className="mt-3 space-y-3">
          <div>
            <label htmlFor="rq-quantity" className={LABEL}>{t("quantity")}</label>
            <input
              ref={firstFieldRef}
              id="rq-quantity"
              required
              maxLength={120}
              value={values.quantity}
              onChange={set("quantity")}
              placeholder={t("quantityPlaceholder")}
              className={FIELD}
            />
          </div>
          <div>
            <label htmlFor="rq-place" className={LABEL}>{t("deliveryPlace")}</label>
            <input
              id="rq-place"
              required
              minLength={2}
              maxLength={160}
              value={values.deliveryPlace}
              onChange={set("deliveryPlace")}
              placeholder={t("deliveryPlacePlaceholder")}
              className={FIELD}
            />
          </div>
          <div>
            <label htmlFor="rq-deadline" className={LABEL}>{t("deadline")}</label>
            <input
              id="rq-deadline"
              maxLength={120}
              value={values.deadline}
              onChange={set("deadline")}
              placeholder={t("deadlinePlaceholder")}
              className={FIELD}
            />
          </div>
          <div>
            <label htmlFor="rq-details" className={LABEL}>{t("details")}</label>
            <textarea
              id="rq-details"
              rows={3}
              maxLength={2000}
              value={values.details}
              onChange={set("details")}
              placeholder={t("detailsPlaceholder")}
              className={`${FIELD} resize-y`}
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white transition-colors duration-150 ease-out hover:bg-[#003a8c]"
          >
            {t("continue")}
          </button>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <div>
            <label htmlFor="rq-name" className={LABEL}>{t("fullName")}</label>
            <input
              ref={firstFieldRef}
              id="rq-name"
              required
              minLength={2}
              maxLength={160}
              autoComplete="name"
              value={values.fullName}
              onChange={set("fullName")}
              className={FIELD}
            />
          </div>
          <div>
            <label htmlFor="rq-company" className={LABEL}>{t("companyName")}</label>
            <input
              id="rq-company"
              maxLength={160}
              autoComplete="organization"
              value={values.companyName}
              onChange={set("companyName")}
              className={FIELD}
            />
          </div>
          <div>
            <label htmlFor="rq-email" className={LABEL}>{t("email")}</label>
            <input
              id="rq-email"
              type="email"
              required
              maxLength={200}
              autoComplete="email"
              value={values.email || user?.email || ""}
              onChange={set("email")}
              className={FIELD}
            />
          </div>
          <div>
            <label htmlFor="rq-phone" className={LABEL}>{t("phone")}</label>
            <input
              id="rq-phone"
              type="tel"
              maxLength={40}
              autoComplete="tel"
              value={values.phone}
              onChange={set("phone")}
              className={FIELD}
            />
          </div>
          <div>
            <label htmlFor="rq-country" className={LABEL}>{t("country")}</label>
            <select
              id="rq-country"
              required
              value={values.country}
              onChange={set("country")}
              className={FIELD}
            >
              <option value="" disabled>
                {t("countryPlaceholder")}
              </option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p role="alert" className="text-[13px] text-[var(--color-drc-red)]">
              {error}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => goTo(1)}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors duration-150 ease-out hover:bg-slate-50"
            >
              {t("back")}
            </button>
            <button
              type="submit"
              disabled={pending}
              className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white transition-colors duration-150 ease-out hover:bg-[#003a8c] disabled:opacity-60"
            >
              {pending ? t("sending") : t("send")}
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
