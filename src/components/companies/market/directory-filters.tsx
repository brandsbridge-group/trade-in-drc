"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { DIRECTORY_SORT, directoryHref, type DirectoryParams, type DirectorySort } from "@/lib/companies/directory";

export interface FilterOption {
  value: string;
  label: string;
}

interface DirectoryFiltersProps {
  params: DirectoryParams;
  sectors: FilterOption[];
  /** Countries that actually have a verified company; the select is hidden when there is only one. */
  countries: string[];
  /** Provinces that actually have a verified company (of the selected country, if any). */
  provinces: string[];
}

const SELECT =
  "h-10 w-full appearance-none rounded-full bg-white pl-4 pr-9 text-[13px] font-medium text-market-navy ring-1 ring-slate-200 outline-none transition-colors hover:ring-slate-300 focus-visible:ring-2 focus-visible:ring-market-navy bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2364748b%22 stroke-width=%222.5%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:12px] bg-[right_14px_center] bg-no-repeat";

/**
 * Directory filters. Each change applies at once (the URL is the state, the
 * server page re-queries); every option listed has at least one company behind
 * it. Active filters are repeated as removable chips.
 */
export function DirectoryFilters({ params, sectors, countries, provinces }: DirectoryFiltersProps) {
  const t = useTranslations("VerifiedDirectory.page.filters");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const go = (patch: Partial<DirectoryParams>) =>
    startTransition(() => router.replace(directoryHref(params, { ...patch, page: 1 }), { scroll: false }));

  const sectorLabel = sectors.find((s) => s.value === params.sector)?.label;
  const chips = [
    params.q && { key: "q", label: t("query", { q: params.q }), clear: { q: "" } },
    sectorLabel && { key: "sector", label: sectorLabel, clear: { sector: "" } },
    params.country && { key: "country", label: params.country, clear: { country: "", province: "" } },
    params.province && { key: "province", label: params.province, clear: { province: "" } },
    params.premiumOnly && { key: "tier", label: t("tierPremium"), clear: { premiumOnly: false } },
  ].filter(Boolean) as { key: string; label: string; clear: Partial<DirectoryParams> }[];

  return (
    <section aria-label={t("label")} className={cn("space-y-3", pending && "opacity-70")} aria-busy={pending}>
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2 lg:flex lg:flex-none">
          <select aria-label={t("sector")} value={params.sector} onChange={(e) => go({ sector: e.target.value })} className={cn(SELECT, "lg:w-56")}>
            <option value="">{t("allSectors")}</option>
            {sectors.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          {countries.length > 1 && (
            <select
              aria-label={t("country")}
              value={params.country}
              onChange={(e) => go({ country: e.target.value, province: "" })}
              className={cn(SELECT, "lg:w-56")}
            >
              <option value="">{t("allCountries")}</option>
              {countries.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}
          {provinces.length > 0 && (
            <select aria-label={t("province")} value={params.province} onChange={(e) => go({ province: e.target.value })} className={cn(SELECT, "lg:w-52")}>
              <option value="">{t("allProvinces")}</option>
              {provinces.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
          <div role="group" aria-label={t("tier")} className="inline-flex rounded-full bg-white p-1 ring-1 ring-slate-200">
            {[
              { premium: false, label: t("tierAll") },
              { premium: true, label: t("tierPremium") },
            ].map((option) => (
              <button
                key={option.label}
                type="button"
                aria-pressed={params.premiumOnly === option.premium}
                onClick={() => go({ premiumOnly: option.premium })}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors",
                  params.premiumOnly === option.premium ? "bg-market-navy text-white" : "text-slate-600 hover:text-market-navy"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          <select
            aria-label={t("sort")}
            value={params.sort}
            onChange={(e) => go({ sort: e.target.value as DirectorySort })}
            className={cn(SELECT, "w-auto min-w-44")}
          >
            <option value={DIRECTORY_SORT.RECENT}>{t("sortRecent")}</option>
            <option value={DIRECTORY_SORT.AZ}>{t("sortAz")}</option>
          </select>
        </div>
      </div>

      {chips.length > 0 && (
        <ul aria-label={t("active")} className="flex flex-wrap items-center gap-1.5">
          {chips.map((chip) => (
            <li key={chip.key}>
              <button
                type="button"
                onClick={() => go(chip.clear)}
                aria-label={t("remove", { name: chip.label })}
                className="inline-flex items-center gap-1.5 rounded-full bg-market-navy/5 py-1 pl-3 pr-2 text-xs font-medium text-market-navy transition-colors hover:bg-market-navy/10"
              >
                {chip.label}
                <X className="h-3 w-3" aria-hidden />
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => go({ q: "", sector: "", country: "", province: "", premiumOnly: false })}
              className="px-2 py-1 text-xs font-semibold text-slate-500 underline-offset-2 transition-colors hover:text-market-navy hover:underline"
            >
              {t("clear")}
            </button>
          </li>
        </ul>
      )}
    </section>
  );
}
