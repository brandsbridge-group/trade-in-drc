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
    "h-12 w-full min-w-0 border-slate-200 bg-transparent px-3 text-sm text-slate-600 outline-none";

  return (
    <form
      onSubmit={onSubmit}
      className="flex w-full flex-col overflow-hidden rounded-lg bg-white text-slate-800 shadow-lg md:flex-row md:items-stretch"
    >
      {/* Keyword */}
      <div className="flex min-w-0 flex-1 items-center gap-2 border-b border-slate-200 pl-3 md:border-b-0 md:border-r">
        <Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
        <input
          name="q"
          placeholder={t("keywordPlaceholder")}
          className="h-12 w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-slate-400"
        />
      </div>

      {/* Sector */}
      <select
        name="sector"
        aria-label={t("sectorLabel")}
        defaultValue=""
        className={`${fieldClass} border-b md:w-44 md:border-b-0 md:border-r`}
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
        className={`${fieldClass} border-b md:w-44 md:border-b-0 md:border-r`}
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
        className={`${fieldClass} border-b md:w-44 md:border-b-0 md:border-r`}
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
        className="inline-flex items-center justify-center gap-2 bg-market-red px-6 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-market-red-dark md:py-0"
      >
        {t("submit")}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </button>
    </form>
  );
}
