"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { DRC_PROVINCES } from "@/config/provinces";
import { Search, ArrowRight } from "lucide-react";

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
 * 3). Keyword + sector + province + contact-type, ending in a red submit that
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
    "h-12 w-full min-w-0 appearance-none rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition-colors duration-150 hover:border-slate-300 focus:border-market-navy focus:bg-white";

  return (
    <form
      onSubmit={onSubmit}
      className="grid w-full grid-cols-1 gap-2 rounded-2xl border border-white/70 bg-white p-2.5 text-slate-800 shadow-[0_20px_55px_-30px_rgba(2,6,23,0.7)] sm:grid-cols-2 lg:grid-cols-12 lg:gap-2.5"
    >
      {/* Keyword */}
      <div className="flex h-12 min-w-0 items-center gap-2.5 rounded-lg border border-market-navy/20 bg-white px-3.5 transition-colors duration-150 focus-within:border-market-navy focus-within:ring-2 focus-within:ring-market-navy/10 sm:col-span-2 lg:col-span-4">
        <Search className="h-4 w-4 shrink-0 text-market-red" aria-hidden />
        <input
          name="q"
          placeholder={t("keywordPlaceholder")}
          className="h-full w-full min-w-0 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
        />
      </div>

      {/* Sector */}
      <select
        name="sector"
        aria-label={t("sectorLabel")}
        defaultValue=""
        className={`${fieldClass} sm:col-span-1 lg:col-span-2`}
      >
        <option value="">{t("sectorLabel")}</option>
        {sectors.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </select>

      {/* Province */}
      <select
        name="province"
        aria-label={t("provinceLabel")}
        defaultValue=""
        className={`${fieldClass} sm:col-span-1 lg:col-span-2`}
      >
        <option value="">{t("provinceLabel")}</option>
        {DRC_PROVINCES.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>

      {/* Type of contact */}
      <select
        name="type"
        aria-label={t("typeLabel")}
        defaultValue=""
        className={`${fieldClass} sm:col-span-1 lg:col-span-2`}
      >
        <option value="">{t("typeLabel")}</option>
        {CONTACT_TYPE_KEYS.map((key) => (
          <option key={key} value={key}>
            {t(`types.${key}`)}
          </option>
        ))}
      </select>

      {/* Submit */}
      <button
        type="submit"
        className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-market-red px-5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-market-red-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-market-red focus-visible:ring-offset-2 lg:col-span-2"
      >
        {t("submit")}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </button>
    </form>
  );
}
