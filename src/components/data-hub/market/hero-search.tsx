"use client";

import * as React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { DRC_PROVINCES } from "@/config/provinces";
import { Search } from "lucide-react";

export interface HeroSectorOption {
  id: string;
  label: string;
}

const DATA_TYPES = ["reports", "datasets", "prices"] as const;
const TIME_RANGES = ["m12", "m24", "all"] as const;

/**
 * Data Hub hero (customer design 11): navy band with mask-faded photo edges
 * (data-viz left, skyline + DRC map right), a centered heading, and a white
 * 4-filter search bar (Sector / Province / Data Type / Time Range) that
 * navigates to /data-hub with query params driving the reports filter.
 */
export function HeroSearch({
  sectors,
  defaults,
}: {
  sectors: HeroSectorOption[];
  defaults: { sector: string; province: string; type: string; range: string };
}) {
  const t = useTranslations("MarketIntel.hero");
  const router = useRouter();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const params = new URLSearchParams();
    const sector = String(fd.get("sector") ?? "");
    const province = String(fd.get("province") ?? "");
    const type = String(fd.get("type") ?? "");
    const range = String(fd.get("range") ?? "");
    if (sector) params.set("sector", sector);
    if (province) params.set("province", province);
    if (type) params.set("type", type);
    if (range) params.set("range", range);
    const qs = params.toString();
    router.push(qs ? `/data-hub?${qs}#dashboard` : "/data-hub#dashboard");
  };

  const labelCls =
    "block text-[0.7rem] font-semibold uppercase tracking-wide text-slate-500 mb-1";
  const fieldCls =
    "h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition-colors duration-150 focus:border-market-navy";

  return (
    <section className="relative overflow-hidden bg-market-navy text-white">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-[24%] [mask-image:linear-gradient(to_right,black_40%,transparent)]">
        <Image
          src="/images/data-hub/hero-left.jpg"
          alt=""
          fill
          priority
          className="object-cover"
          sizes="24vw"
        />
        <div className="absolute inset-0 bg-market-navy/40" />
      </div>
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[40%] [mask-image:linear-gradient(to_left,black_55%,transparent)]">
        <Image
          src="/images/data-hub/hero-right.jpg"
          alt=""
          fill
          priority
          className="object-cover"
          sizes="40vw"
        />
        <div className="absolute inset-0 bg-market-navy/25" />
      </div>

      <div className="relative mx-auto w-full max-w-[1500px] px-4 py-10 md:px-6 md:py-12">
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-[2.6rem]">
          {t("title")}
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-white/85 md:text-base">
          {t("subtitle")}
        </p>

        <form
          onSubmit={onSubmit}
          className="mt-7 rounded-lg bg-white p-3 shadow-lg md:p-4"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[repeat(4,1fr)_auto]">
            <div>
              <label className={labelCls} htmlFor="dh-sector">
                {t("filters.sector")}
              </label>
              <select
                id="dh-sector"
                name="sector"
                defaultValue={defaults.sector}
                className={fieldCls}
              >
                <option value="">{t("filters.sectorAll")}</option>
                {sectors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelCls} htmlFor="dh-province">
                {t("filters.province")}
              </label>
              <select
                id="dh-province"
                name="province"
                defaultValue={defaults.province}
                className={fieldCls}
              >
                <option value="">{t("filters.provinceAll")}</option>
                {DRC_PROVINCES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelCls} htmlFor="dh-type">
                {t("filters.dataType")}
              </label>
              <select
                id="dh-type"
                name="type"
                defaultValue={defaults.type}
                className={fieldCls}
              >
                <option value="">{t("filters.dataTypeAll")}</option>
                {DATA_TYPES.map((d) => (
                  <option key={d} value={d}>
                    {t(`dataType.${d}`)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelCls} htmlFor="dh-range">
                {t("filters.timeRange")}
              </label>
              <select
                id="dh-range"
                name="range"
                defaultValue={defaults.range || "m12"}
                className={fieldCls}
              >
                {TIME_RANGES.map((r) => (
                  <option key={r} value={r}>
                    {t(`timeRange.${r}`)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-market-red px-5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-market-red/90 lg:w-auto"
              >
                <Search className="h-4 w-4" />
                {t("search")}
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
