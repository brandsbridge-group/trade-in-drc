"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search, MapPin, Users, Crown, Globe, ArrowRight } from "lucide-react";
import { DRC_PROVINCES } from "@/config/provinces";
import { Switch } from "@/components/ui/switch";

/** Static partnership types (design 7). Key drives i18n label; value → `?type=`. */
const PARTNERSHIP_TYPES = [
  { value: "distributor", labelKey: "typeDistributor" },
  { value: "supplier", labelKey: "typeSupplier" },
  { value: "manufacturer", labelKey: "typeManufacturer" },
  { value: "service_provider", labelKey: "typeServiceProvider" },
] as const;

export interface SectorOption {
  id: string;
  label: string;
}

const SELECT_CLASS =
  "w-full appearance-none bg-transparent text-sm text-market-navy outline-none";

/**
 * Horizontal filter strip for the Verified Companies Directory (customer design
 * 7): sector / province / partnership-type dropdowns, two toggle switches
 * (Premium Only, International Business Ready) and a red submit button that
 * navigates to `/companies?sector=&region=&type=&premium=&intl=` on submit.
 */
export function DirectoryFilterBar({ sectors }: { sectors: SectorOption[] }) {
  const t = useTranslations("VerifiedDirectory");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [sector, setSector] = React.useState(searchParams.get("sector") ?? "");
  const [region, setRegion] = React.useState(searchParams.get("region") ?? "");
  const [type, setType] = React.useState(searchParams.get("type") ?? "");
  const [premium, setPremium] = React.useState(searchParams.get("premium") === "1");
  const [intl, setIntl] = React.useState(searchParams.get("intl") === "1");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    const set = (key: string, value: string) =>
      value ? params.set(key, value) : params.delete(key);
    set("sector", sector);
    set("region", region);
    set("type", type);
    set("premium", premium ? "1" : "");
    set("intl", intl ? "1" : "");
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm lg:flex-row lg:items-center lg:gap-2"
    >
      <Search className="hidden h-5 w-5 shrink-0 text-slate-400 lg:block" aria-hidden />

      <label className="flex flex-1 items-center gap-2 border-slate-200 px-2 lg:border-l">
        <span className="sr-only">{t("filterSectorLabel")}</span>
        <select
          value={sector}
          onChange={(e) => setSector(e.target.value)}
          aria-label={t("filterSectorLabel")}
          className={SELECT_CLASS}
        >
          <option value="">{t("filterAllSectors")}</option>
          {sectors.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-1 items-center gap-2 border-slate-200 px-2 lg:border-l">
        <MapPin className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          aria-label={t("filterProvinceLabel")}
          className={SELECT_CLASS}
        >
          <option value="">{t("filterAllProvinces")}</option>
          {DRC_PROVINCES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-1 items-center gap-2 border-slate-200 px-2 lg:border-l">
        <Users className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          aria-label={t("filterTypeLabel")}
          className={SELECT_CLASS}
        >
          <option value="">{t("filterAllTypes")}</option>
          {PARTNERSHIP_TYPES.map((pt) => (
            <option key={pt.value} value={pt.value}>
              {t(pt.labelKey)}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2 border-slate-200 px-3 lg:border-l">
        <Crown className="h-4 w-4 shrink-0 text-market-gold" aria-hidden />
        <span className="whitespace-nowrap text-sm text-market-navy">{t("premiumOnly")}</span>
        <Switch checked={premium} onCheckedChange={setPremium} aria-label={t("premiumOnly")} />
      </label>

      <label className="flex items-center gap-2 border-slate-200 px-3 lg:border-l">
        <Globe className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
        <span className="whitespace-nowrap text-sm text-market-navy">{t("intlReady")}</span>
        <Switch checked={intl} onCheckedChange={setIntl} aria-label={t("intlReady")} />
      </label>

      <button
        type="submit"
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-market-red px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-market-red-dark"
      >
        {t("searchCompanies")}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </button>
    </form>
  );
}
