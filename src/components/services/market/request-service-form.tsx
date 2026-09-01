"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ClipboardList, Lock, Send, CheckCircle2 } from "lucide-react";
import { DRC_PROVINCES } from "@/config/provinces";
import { SERVICES } from "./services-config";
import { submitServiceRequest } from "./services-actions";

interface SectorOption {
  id: string;
  label: string;
}

const FIELD =
  "h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition-colors duration-150 placeholder:text-slate-400 focus:border-market-navy";
const TIMELINES = ["immediate", "1_3_months", "3_6_months", "6_plus_months"] as const;

function Label({ children, req }: { children: React.ReactNode; req?: boolean }) {
  return (
    <label className="mb-1 block text-xs font-semibold text-slate-700">
      {children} {req && <span className="text-market-red">*</span>}
    </label>
  );
}

/** "Request a Service" form (design Our Services) → business_requests. */
export function RequestServiceForm({ sectors }: { sectors: SectorOption[] }) {
  const t = useTranslations("Services.form");
  const [pending, setPending] = React.useState(false);
  const [reference, setReference] = React.useState<string | null>(null);
  const formRef = React.useRef<HTMLFormElement>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setPending(true);
    const id = toast.loading(t("submitting"));
    const res = await submitServiceRequest({
      fullName: String(fd.get("fullName") ?? ""),
      company: String(fd.get("company") ?? ""),
      country: String(fd.get("country") ?? ""),
      email: String(fd.get("email") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      sector: String(fd.get("sector") ?? ""),
      serviceNeeded: String(fd.get("serviceNeeded") ?? "other") as ServiceIntent,
      preferredLocation: String(fd.get("preferredLocation") ?? ""),
      timeline: String(fd.get("timeline") ?? ""),
      message: String(fd.get("message") ?? ""),
    });
    setPending(false);
    if (res.ok) {
      toast.success(t("success"), { id });
      setReference(res.reference ?? "—");
      formRef.current?.reset();
    } else {
      toast.error(res.error === "invalid" ? t("invalid") : t("error"), { id });
    }
  };

  if (reference) {
    return (
      <section id="request-service" className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center py-6 text-center">
          <CheckCircle2 className="h-14 w-14 text-green-600" aria-hidden />
          <h3 className="mt-3 font-display text-lg font-bold text-market-navy">{t("successTitle")}</h3>
          <p className="mt-1 text-sm text-slate-500">{t("successBody")}</p>
          <div className="mt-4 rounded-md border border-dashed border-green-300 bg-green-50 px-6 py-3">
            <div className="text-[0.66rem] font-semibold uppercase tracking-wide text-slate-500">{t("requestId")}</div>
            <div className="font-display text-lg font-bold text-green-700">{reference}</div>
          </div>
          <button
            type="button"
            onClick={() => setReference(null)}
            className="mt-5 rounded-md border border-market-navy px-5 py-2.5 text-sm font-semibold text-market-navy transition-colors duration-150 hover:bg-market-navy/5"
          >
            {t("another")}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section id="request-service" className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <ClipboardList className="mt-0.5 h-7 w-7 shrink-0 text-market-navy" strokeWidth={1.75} aria-hidden />
        <div>
          <h2 className="font-display text-lg font-bold text-market-navy">{t("title")}</h2>
          <p className="text-sm text-slate-500">{t("subtitle")}</p>
        </div>
      </div>

      <form ref={formRef} onSubmit={onSubmit} className="mt-4 grid gap-4 sm:grid-cols-3">
        <div><Label req>{t("fullName")}</Label><input name="fullName" required minLength={2} placeholder={t("fullNamePh")} className={FIELD} /></div>
        <div><Label req>{t("company")}</Label><input name="company" required minLength={2} placeholder={t("companyPh")} className={FIELD} /></div>
        <div><Label req>{t("country")}</Label><input name="country" required minLength={2} placeholder={t("countryPh")} className={FIELD} /></div>

        <div><Label req>{t("email")}</Label><input name="email" type="email" required placeholder={t("emailPh")} className={FIELD} /></div>
        <div><Label req>{t("phone")}</Label><input name="phone" required minLength={6} placeholder={t("phonePh")} className={FIELD} /></div>
        <div>
          <Label req>{t("sector")}</Label>
          <select name="sector" defaultValue="" className={FIELD}>
            <option value="">{t("sectorPh")}</option>
            {sectors.map((s) => <option key={s.id} value={s.label}>{s.label}</option>)}
          </select>
        </div>

        <div>
          <Label req>{t("serviceNeeded")}</Label>
          <select name="serviceNeeded" defaultValue="" required className={FIELD}>
            <option value="" disabled>{t("serviceNeededPh")}</option>
            {SERVICES.map((s) => <option key={s.intent} value={s.intent}>{t(`services.${s.key}`)}</option>)}
          </select>
        </div>
        <div>
          <Label>{t("location")}</Label>
          <select name="preferredLocation" defaultValue="" className={FIELD}>
            <option value="">{t("locationPh")}</option>
            {DRC_PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <Label>{t("timeline")}</Label>
          <select name="timeline" defaultValue="" className={FIELD}>
            <option value="">{t("timelinePh")}</option>
            {TIMELINES.map((tl) => <option key={tl} value={tl}>{t(`timelines.${tl}`)}</option>)}
          </select>
        </div>

        <div className="sm:col-span-3">
          <Label>{t("message")}</Label>
          <textarea name="message" rows={3} placeholder={t("messagePh")} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition-colors duration-150 placeholder:text-slate-400 focus:border-market-navy" />
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:col-span-3">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-11 items-center gap-2 rounded-md bg-market-navy px-6 text-sm font-bold text-white transition-colors duration-150 hover:bg-market-navy-deep disabled:opacity-60"
          >
            {t("submit")} <Send className="h-4 w-4" aria-hidden />
          </button>
          <p className="flex items-center gap-1.5 text-xs text-slate-400">
            <Lock className="h-3.5 w-3.5" aria-hidden /> {t("privacy")}
          </p>
        </div>
      </form>
    </section>
  );
}

type ServiceIntent = Parameters<typeof submitServiceRequest>[0]["serviceNeeded"];
