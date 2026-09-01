"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { submitBuyingRequest } from "./buying-request-actions";
import {
  Briefcase,
  Eye,
  Globe,
  MapPinned,
  MessagesSquare,
  Send,
  ShieldCheck,
} from "lucide-react";

interface SectorOption {
  id: string;
  label: string;
}

const WHY_ITEMS = [
  { key: "verifiedProfiles", Icon: ShieldCheck },
  { key: "localAccess", Icon: MapPinned },
  { key: "b2bSupport", Icon: MessagesSquare },
  { key: "visibility", Icon: Eye },
  { key: "exportPotential", Icon: Globe },
  { key: "facilitation", Icon: Briefcase },
] as const;

const FIELD_CLS =
  "h-10 w-full rounded border border-slate-300 bg-white px-2.5 text-xs text-slate-800 outline-none transition-colors duration-150 placeholder:text-slate-400 focus:border-market-navy";

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="mb-1 block text-[11px] font-bold text-slate-800">
      {children} {required && <span className="text-market-red">*</span>}
    </label>
  );
}

/**
 * Right rail (design 1): the "Can't Find What You're Looking For?" buying
 * request form (design-exact fields, writes business_requests via server
 * action) + "Why Use the Marketplace" benefits panel.
 */
export function MarketRail({ sectors }: { sectors: SectorOption[] }) {
  const t = useTranslations("MarketHome.rail");
  const [pending, setPending] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const input = {
      productNeeded: String(fd.get("productNeeded") ?? ""),
      sector: String(fd.get("sector") ?? ""),
      quantity: String(fd.get("quantity") ?? ""),
      country: String(fd.get("country") ?? ""),
      companyName: String(fd.get("companyName") ?? ""),
      email: String(fd.get("email") ?? ""),
      phone: `${String(fd.get("dial") ?? "+243")} ${String(fd.get("phone") ?? "")}`.trim(),
      additional: String(fd.get("additional") ?? ""),
    };
    setPending(true);
    const id = toast.loading(t("form.submitting"));
    const res = await submitBuyingRequest(input);
    setPending(false);
    if (res.ok) {
      toast.success(t("form.success"), { id });
      formRef.current?.reset();
    } else {
      toast.error(res.error === "invalid" ? t("form.invalid") : t("form.error"), { id });
    }
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm" aria-label={t("formTitle")}>
        <div className="bg-market-navy px-4 py-3.5 text-white">
          <h2 className="font-display text-base font-bold">{t("formTitle")}</h2>
          <p className="mt-0.5 text-xs text-white/80">{t("formSubtitle")}</p>
        </div>
        <form ref={formRef} onSubmit={onSubmit} className="grid grid-cols-2 gap-x-3 gap-y-3.5 p-4">
          <div>
            <Label required>{t("form.productNeeded")}</Label>
            <input name="productNeeded" required minLength={2} placeholder={t("form.productNeededPh")} className={FIELD_CLS} />
          </div>
          <div>
            <Label required>{t("form.category")}</Label>
            <select name="sector" className={FIELD_CLS} defaultValue="">
              <option value="">{t("form.categoryPh")}</option>
              {sectors.map((s) => (
                <option key={s.id} value={s.label}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <Label required>{t("form.quantity")}</Label>
            <input name="quantity" placeholder={t("form.quantityPh")} className={FIELD_CLS} />
          </div>
          <div>
            <Label required>{t("form.country")}</Label>
            <input name="country" required minLength={2} placeholder={t("form.countryPh")} className={FIELD_CLS} />
          </div>
          <div>
            <Label required>{t("form.companyName")}</Label>
            <input name="companyName" required minLength={2} placeholder={t("form.companyNamePh")} className={FIELD_CLS} />
          </div>
          <div>
            <Label required>{t("form.email")}</Label>
            <input name="email" type="email" required placeholder={t("form.emailPh")} className={FIELD_CLS} />
          </div>
          <div>
            <Label required>{t("form.phone")}</Label>
            <div className="flex gap-1.5">
              <select name="dial" defaultValue="+243" className="h-10 w-[4.5rem] rounded border border-slate-300 bg-white px-1 text-xs text-slate-800 outline-none">
                <option value="+243">🇨🇩 +243</option>
                <option value="+1">+1</option>
                <option value="+33">+33</option>
                <option value="+44">+44</option>
                <option value="+86">+86</option>
                <option value="+90">+90</option>
              </select>
              <input name="phone" required minLength={6} placeholder={t("form.phonePh")} className={FIELD_CLS} />
            </div>
          </div>
          <div>
            <Label>{t("form.additional")}</Label>
            <textarea name="additional" rows={3} placeholder={t("form.additionalPh")} className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none transition-colors duration-150 placeholder:text-slate-400 focus:border-market-navy" />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="col-span-2 mt-1 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-market-red text-sm font-bold text-white transition-colors duration-150 hover:bg-market-red-dark disabled:opacity-60"
          >
            <Send className="h-4 w-4" aria-hidden />
            {t("form.submit")}
          </button>
        </form>
      </section>

      <section className="flex flex-1 flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-sm" aria-label={t("whyTitle")}>
        <h2 className="mb-4 text-center font-display text-sm font-bold text-market-navy">{t("whyTitle")}</h2>
        <div className="grid flex-1 grid-cols-2 content-around gap-x-3 gap-y-4">
          {WHY_ITEMS.map(({ key, Icon }) => (
            <div key={key} className="flex items-start gap-2">
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-market-navy" strokeWidth={1.75} aria-hidden />
              <div>
                <div className="text-xs font-bold leading-tight text-slate-800">{t(`items.${key}.title`)}</div>
                <p className="mt-0.5 text-[10px] leading-snug text-slate-500">{t(`items.${key}.body`)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
