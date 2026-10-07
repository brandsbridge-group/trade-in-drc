"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { DRC_PROVINCES } from "@/config/provinces";
import { Search, ArrowRight, ChevronDown } from "lucide-react";

interface SectorOption {
  id: string;
  label: string;
}

/** Static "Type of contact" facet values (no schema column — passed as `type`). */
const CONTACT_TYPE_KEYS = [
  "suppliers",
  "distributors",
  "representatives",
  "serviceProviders",
  "institutional",
  "investment",
] as const;

/**
 * White 4-field faceted search card that floats over the hero (customer design
 * 3). Keyword + sector + province + contact-type, ending in a gold submit that
 * deep-links into the companies directory with the chosen URL params.
 */
export function ContactSearchCard({ sectors }: { sectors: SectorOption[] }) {
  const t = useTranslations("LocalContacts.search");
  const router = useRouter();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const q = String(fd.get("q") ?? "").trim();
    const sector = String(fd.get("sector") ?? "");
    const province = String(fd.get("province") ?? "");
    const type = String(fd.get("type") ?? "");

    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (sector) params.set("sector", sector);
    if (province) params.set("region", province);
    if (type) params.set("type", type);

    const query = params.toString();
    router.push(query ? `/companies?${query}` : "/companies");
  };

  const fieldClass =
    "h-14 w-full min-w-0 appearance-none rounded-md border border-slate-200 bg-white px-3.5 pr-10 text-sm text-slate-800 outline-none transition-colors duration-150 hover:border-slate-300 focus:border-market-or focus:ring-2 focus:ring-market-or/15";
  const labelClass = "mb-1.5 block text-xs font-semibold text-slate-600";

  return (
    <form
      onSubmit={onSubmit}
      className="grid w-full grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 text-slate-800 shadow-[0_20px_55px_-30px_rgba(2,6,23,0.48)] sm:gap-4 sm:p-5 lg:grid-cols-2"
    >
      {/* Keyword */}
      <label className="min-w-0 lg:col-span-2">
        <span className={labelClass}>{t("keywordPlaceholder")}</span>
        <span className="flex h-14 min-w-0 items-center gap-3 rounded-md border border-slate-200 bg-white px-3.5 transition-colors duration-150 focus-within:border-market-or focus-within:ring-2 focus-within:ring-market-or/15">
          <Search className="h-4 w-4 shrink-0 text-market-or-dark" aria-hidden />
          <input
            name="q"
            aria-label={t("keywordPlaceholder")}
            className="h-full w-full min-w-0 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
          />
        </span>
      </label>

      {/* Sector */}
      <label className="relative min-w-0">
        <span className={labelClass}>{t("sectorLabel")}</span>
        <select name="sector" aria-label={t("sectorLabel")} defaultValue="" className={fieldClass}>
          <option value="">{t("sectorLabel")}</option>
          {sectors.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute bottom-5 right-3.5 h-4 w-4 text-slate-500" aria-hidden />
      </label>

      {/* Province */}
      <label className="relative min-w-0">
        <span className={labelClass}>{t("provinceLabel")}</span>
        <select name="province" aria-label={t("provinceLabel")} defaultValue="" className={fieldClass}>
          <option value="">{t("provinceLabel")}</option>
          {DRC_PROVINCES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute bottom-5 right-3.5 h-4 w-4 text-slate-500" aria-hidden />
      </label>

      {/* Type of contact */}
      <label className="relative min-w-0">
        <span className={labelClass}>{t("typeLabel")}</span>
        <select name="type" aria-label={t("typeLabel")} defaultValue="" className={fieldClass}>
          <option value="">{t("typeLabel")}</option>
          {CONTACT_TYPE_KEYS.map((key) => (
            <option key={key} value={key}>
              {t(`types.${key}`)}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute bottom-5 right-3.5 h-4 w-4 text-slate-500" aria-hidden />
      </label>

      {/* Submit */}
      <button
        type="submit"
        className="inline-flex h-14 items-center justify-center gap-2 rounded-md bg-market-or px-5 text-sm font-bold text-market-navy shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] transition-colors duration-150 hover:bg-market-or-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-market-or focus-visible:ring-offset-2"
      >
        {t("submit")}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </button>
    </form>
  );
}
