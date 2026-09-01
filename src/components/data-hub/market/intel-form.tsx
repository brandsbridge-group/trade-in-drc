"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { CheckCircle2, TrendingUp } from "lucide-react";
import { submitMarketIntelRequest } from "./market-intel-actions";
import type { HeroSectorOption } from "./hero-search";

const TOAST_ID = "market-intel-request";

/** Request Custom Market Intelligence lead form (functional, admin-visible). */
export function IntelForm({ sectors }: { sectors: HeroSectorOption[] }) {
  const t = useTranslations("MarketIntel.form");
  const [pending, setPending] = React.useState(false);
  const [reference, setReference] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setPending(true);
    toast.loading(t("loading"), { id: TOAST_ID });

    try {
      const result = await submitMarketIntelRequest({
        fullName: String(fd.get("fullName") ?? ""),
        company: String(fd.get("company") ?? ""),
        sector: String(fd.get("sector") ?? ""),
        email: String(fd.get("email") ?? ""),
        message: String(fd.get("message") ?? ""),
      });

      if (result.ok) {
        setReference(result.reference ?? null);
        setDone(true);
        toast.success(t("success"), { id: TOAST_ID });
      } else {
        toast.error(t("error"), { id: TOAST_ID });
      }
    } catch {
      toast.error(t("error"), { id: TOAST_ID });
    } finally {
      setPending(false);
    }
  };

  const fieldCls =
    "h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition-colors duration-150 focus:border-market-navy";

  const header = (
    <div className="mb-4 flex items-center gap-2">
      <TrendingUp className="h-5 w-5 text-market-red" />
      <h2 className="font-display text-base font-bold text-market-navy">
        {t("title")}
      </h2>
    </div>
  );

  if (done) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        {header}
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          <p className="text-sm text-slate-700">{t("success")}</p>
          {reference && (
            <p className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-semibold text-market-navy">
              {t("successRef", { reference })}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      {header}
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            name="fullName"
            required
            maxLength={200}
            placeholder={`${t("fullName")}*`}
            aria-label={t("fullName")}
            className={fieldCls}
          />
          <input
            name="company"
            required
            maxLength={200}
            placeholder={`${t("company")}*`}
            aria-label={t("company")}
            className={fieldCls}
          />
        </div>
        <select
          name="sector"
          required
          defaultValue=""
          aria-label={t("sector")}
          className={fieldCls}
        >
          <option value="" disabled>
            {`${t("sectorPlaceholder")}*`}
          </option>
          {sectors.map((s) => (
            <option key={s.id} value={s.label}>
              {s.label}
            </option>
          ))}
        </select>
        <input
          name="email"
          type="email"
          required
          maxLength={320}
          placeholder={`${t("email")}*`}
          aria-label={t("email")}
          className={fieldCls}
        />
        <textarea
          name="message"
          rows={4}
          maxLength={5000}
          placeholder={t("message")}
          aria-label={t("message")}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-colors duration-150 focus:border-market-navy"
        />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 w-full items-center justify-center rounded-md bg-market-red text-sm font-semibold text-white transition-colors duration-150 hover:bg-market-red/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? t("submitting") : t("submit")}
        </button>
      </form>
    </div>
  );
}
