"use client";

import * as React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { DRC_PROVINCES } from "@/config/provinces";
import { OPPORTUNITY_TABS } from "@/lib/opportunities/board-config";
import { Search, ListChecks, Send } from "lucide-react";

interface SectorOption {
  id: string;
  label: string;
}

/**
 * Opportunities hero (customer design 2): full-bleed navy photo band
 * (businessmen left, mining right) with a centered heading, a 4-field white
 * search card (keyword / type / sector / province), and Browse / Submit CTAs.
 */
export function OppHero({ sectors }: { sectors: SectorOption[] }) {
  const t = useTranslations("Opportunities.hero");
  const router = useRouter();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const params = new URLSearchParams();
    const q = String(fd.get("q") ?? "").trim();
    const tab = String(fd.get("tab") ?? "");
    const sector = String(fd.get("sector") ?? "");
    const region = String(fd.get("region") ?? "");
    if (q) params.set("q", q);
    if (tab && tab !== "all") params.set("tab", tab);
    if (sector) params.set("sector", sector);
    if (region) params.set("region", region);
    const qs = params.toString();
    router.push(qs ? `/opportunities?${qs}#board` : "/opportunities#board");
  };

  const fieldCls =
    "h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition-colors duration-150 focus:border-market-navy";

  return (
    <section className="relative overflow-hidden bg-market-navy text-white">
      {/* Photo edges from the design artwork */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-[26%] [mask-image:linear-gradient(to_right,black_45%,transparent)]">
        <Image src="/images/opportunities/hero-left.jpg" alt="" fill priority className="object-cover" sizes="26vw" />
      </div>
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[42%] [mask-image:linear-gradient(to_left,black_55%,transparent)]">
        <Image src="/images/opportunities/hero-right.jpg" alt="" fill priority className="object-cover" sizes="42vw" />
        <div className="absolute inset-0 bg-market-navy/25" />
      </div>

      <div className="relative mx-auto w-full max-w-[1500px] px-4 py-8 text-center md:px-6">
        <h1 className="font-display text-2xl font-bold tracking-tight md:text-[2rem]">{t("title")}</h1>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-white/85">{t("subtitle")}</p>

        {/* 4-field search card */}
        <form
          onSubmit={onSubmit}
          className="mx-auto mt-6 grid max-w-5xl grid-cols-1 gap-3 rounded-xl bg-white p-3 text-left shadow-lg sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_auto]"
        >
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">{t("keyword")}</label>
            <div className="relative">
              <input name="q" placeholder={t("keywordPh")} className={`${fieldCls} pr-9`} />
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">{t("type")}</label>
            <select name="tab" defaultValue="all" className={fieldCls}>
              {OPPORTUNITY_TABS.map((tab) => (
                <option key={tab.key} value={tab.key}>{t(`types.${tab.key}`)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">{t("sector")}</label>
            <select name="sector" defaultValue="" className={fieldCls}>
              <option value="">{t("allSectors")}</option>
              {sectors.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">{t("province")}</label>
            <select name="region" defaultValue="" className={fieldCls}>
              <option value="">{t("allProvinces")}</option>
              {DRC_PROVINCES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-market-red px-5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-market-red-dark"
            >
              <Search className="h-4 w-4" aria-hidden /> {t("search")}
            </button>
          </div>
        </form>

        {/* CTAs */}
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link
            href="/opportunities#board"
            className="inline-flex items-center gap-2 rounded-md bg-market-red px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-market-red-dark"
          >
            <ListChecks className="h-4 w-4" aria-hidden /> {t("browse")}
          </Link>
          <Link
            href="/dashboard/opportunities/new"
            className="inline-flex items-center gap-2 rounded-md border border-white/70 bg-transparent px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-white/10"
          >
            <Send className="h-4 w-4" aria-hidden /> {t("submit")}
          </Link>
        </div>
      </div>
    </section>
  );
}
