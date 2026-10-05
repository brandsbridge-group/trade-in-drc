"use client";

import * as React from "react";
import { useFormatter, useTranslations } from "next-intl";
import { ArrowRight, Check, Loader2, Search } from "lucide-react";

import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { trackRequest, type TrackedRequest } from "@/lib/requests/track-actions";

const INPUT =
  "h-11 w-full min-w-0 rounded-xl bg-white px-3.5 text-sm text-market-navy outline-none ring-1 ring-slate-200 transition-colors placeholder:text-slate-400 focus:ring-2 focus:ring-market-navy/30";

/**
 * "Follow my request": reference + e-mail in, the request's trail out. The
 * reference can arrive in the address (`?ref=`), from the confirmation screen
 * or the confirmation e-mail; the e-mail is always typed.
 */
export function TrackRequestForm({ initialReference }: { initialReference: string }) {
  const t = useTranslations("RequestTracking");
  const format = useFormatter();

  const [reference, setReference] = React.useState(initialReference);
  const [email, setEmail] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [request, setRequest] = React.useState<TrackedRequest | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const result = await trackRequest({ reference, email });
      if (result.ok && result.request) {
        setRequest(result.request);
      } else {
        setError(t(result.error === "invalid" ? "invalid" : result.error === "not_found" ? "notFound" : "serverError"));
      }
    } catch {
      setError(t("serverError"));
    } finally {
      setPending(false);
    }
  };

  if (request) {
    const { tracking } = request;
    return (
      <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200/70 sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
          {t("sentOn", { date: format.dateTime(new Date(request.createdAt), { dateStyle: "long" }) })}
        </p>
        <h2 className="mt-1 font-display text-xl font-semibold text-market-navy">
          {t("resultTitle", { reference: request.reference })}
        </h2>
        {(request.productName || request.companyName) && (
          <p className="mt-1 text-sm text-slate-600">
            {[
              request.productName && t("aboutProduct", { product: request.productName }),
              request.companyName && t("aboutCompany", { company: request.companyName }),
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}

        <ol className="mt-6">
          {tracking.steps.map((step, index) => {
            const last = index === tracking.steps.length - 1;
            const declinedHere = tracking.outcome === "declined" && step.key === "outcome";
            return (
              <li key={step.key} className="relative flex gap-4 pb-6 last:pb-0">
                {!last && (
                  <span
                    className={cn("absolute left-[13px] top-7 h-[calc(100%-1.75rem)] w-px", step.state === "done" ? "bg-emerald-300" : "bg-slate-200")}
                    aria-hidden
                  />
                )}
                <span
                  className={cn(
                    "relative grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold",
                    declinedHere && "bg-slate-400 text-white",
                    !declinedHere && step.state === "done" && "bg-emerald-500 text-white",
                    step.state === "current" && "bg-market-navy text-white",
                    step.state === "upcoming" && "bg-slate-100 text-slate-400"
                  )}
                  aria-hidden
                >
                  {step.state === "done" && !declinedHere ? <Check className="h-3.5 w-3.5" /> : index + 1}
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className={cn("text-sm font-semibold", step.state === "upcoming" ? "text-slate-400" : "text-market-navy")}>
                    {t(`steps.${step.key}.title`)}
                    <span className="sr-only"> — {t(`state.${step.state}`)}</span>
                    {step.state === "current" && (
                      <span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700" aria-hidden>
                        {t("state.current")}
                      </span>
                    )}
                  </p>
                  {step.state !== "upcoming" && (
                    <p className="mt-0.5 text-[13px] leading-snug text-slate-500">
                      {declinedHere
                        ? t("declined")
                        : // A step still under way must not read as if it were over.
                          step.state === "current" && (step.key === "forwarded" || step.key === "outcome")
                          ? t(`steps.${step.key}.pending`)
                          : t(`steps.${step.key}.body`)}
                    </p>
                  )}
                  {step.at && step.key !== "received" && (
                    <p className="mt-0.5 text-xs tabular-nums text-slate-400">{format.dateTime(new Date(step.at), { dateStyle: "medium" })}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>

        <div className="mt-7 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-5">
          <button
            type="button"
            onClick={() => {
              setRequest(null);
              setReference("");
            }}
            className="rounded-full px-4 py-2 text-[13px] font-semibold text-market-navy ring-1 ring-slate-200 transition-colors hover:bg-slate-50"
          >
            {t("another")}
          </button>
          <Link href="/request" className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold text-market-navy transition-colors hover:bg-slate-100">
            {t("newRequest")}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
          <span className="ml-auto text-[13px] text-slate-500">
            {t("help")}{" "}
            <Link href="/contact" className="font-semibold text-market-navy underline-offset-2 hover:underline">
              {t("contact")}
            </Link>
          </span>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="rounded-2xl bg-white p-6 ring-1 ring-slate-200/70 sm:p-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="min-w-0">
          <label htmlFor="track-reference" className="mb-1.5 block text-[13px] font-medium text-market-navy">{t("reference")}</label>
          <input
            id="track-reference"
            className={cn(INPUT, "font-mono uppercase tracking-wide placeholder:normal-case placeholder:tracking-normal")}
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder={t("referencePlaceholder")}
            autoComplete="off"
            spellCheck={false}
            required
          />
        </div>
        <div className="min-w-0">
          <label htmlFor="track-email" className="mb-1.5 block text-[13px] font-medium text-market-navy">{t("email")}</label>
          <input
            id="track-email"
            type="email"
            inputMode="email"
            className={INPUT}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("emailPlaceholder")}
            autoComplete="email"
            required
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-[13px] font-medium text-market-red">{error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-market-navy px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-market-navy-deep disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Search className="h-4 w-4" aria-hidden />}
        {pending ? t("searching") : t("submit")}
      </button>
    </form>
  );
}
