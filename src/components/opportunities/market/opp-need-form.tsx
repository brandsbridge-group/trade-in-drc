"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { DRC_PROVINCES } from "@/config/provinces";
import { NEED_TYPES } from "@/lib/opportunities/board-config";
import { submitBusinessNeed } from "./business-need-actions";
import { Send } from "lucide-react";

interface SectorOption {
  id: string;
  label: string;
}

const FIELD_CLS =
  "h-10 w-full rounded-md border border-slate-300 bg-white px-2.5 text-xs text-slate-800 outline-none transition-colors duration-150 placeholder:text-slate-400 focus:border-market-navy";

function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1 block text-[11px] font-bold text-slate-800">{children}</label>;
}

/**
 * "Can't Find What You're Looking For? Submit Your Business Need" form
 * (design 2 rail). Writes to business_requests via server action.
 */
export function OppNeedForm({ sectors }: { sectors: SectorOption[] }) {
  const t = useTranslations("Opportunities.need");
  const [pending, setPending] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setPending(true);
    const id = toast.loading(t("submitting"));
    const res = await submitBusinessNeed({
      needType: String(fd.get("needType") ?? "other") as (typeof NEED_TYPES)[number],
      sector: String(fd.get("sector") ?? ""),
      province: String(fd.get("province") ?? ""),
      companyName: String(fd.get("companyName") ?? ""),
      email: String(fd.get("email") ?? ""),
    });
    setPending(false);
    if (res.ok) {
      toast.success(t("success"), { id });
      formRef.current?.reset();
    } else {
      toast.error(res.error === "invalid" ? t("invalid") : t("error"), { id });
    }
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="font-display text-base font-bold text-market-navy">{t("title")}</h2>
      <p className="mt-0.5 text-xs font-semibold text-slate-600">{t("subtitle")}</p>

      <form ref={formRef} onSubmit={onSubmit} className="mt-3 grid grid-cols-2 gap-x-3 gap-y-3">
        <div>
          <Label>{t("needType")}</Label>
          <select name="needType" defaultValue="" required className={FIELD_CLS}>
            <option value="" disabled>{t("needTypePh")}</option>
            {NEED_TYPES.map((n) => (
              <option key={n} value={n}>{t(`types.${n}`)}</option>
            ))}
          </select>
        </div>
        <div>
          <Label>{t("sector")}</Label>
          <select name="sector" defaultValue="" className={FIELD_CLS}>
            <option value="">{t("sectorPh")}</option>
            {sectors.map((s) => (
              <option key={s.id} value={s.label}>{s.label}</option>
            ))}
          </select>
        </div>
        <div>
          <Label>{t("province")}</Label>
          <select name="province" defaultValue="" className={FIELD_CLS}>
            <option value="">{t("provincePh")}</option>
            {DRC_PROVINCES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <div>
          <Label>{t("companyName")}</Label>
          <input name="companyName" required minLength={2} placeholder={t("companyNamePh")} className={FIELD_CLS} />
        </div>
        <div className="col-span-2">
          <Label>{t("email")}</Label>
          <input name="email" type="email" required placeholder={t("emailPh")} className={FIELD_CLS} />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="col-span-2 mt-1 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-market-navy text-sm font-bold text-white transition-colors duration-150 hover:bg-market-navy-deep disabled:opacity-60"
        >
          <Send className="h-4 w-4" aria-hidden /> {t("submit")}
        </button>
      </form>
    </section>
  );
}
