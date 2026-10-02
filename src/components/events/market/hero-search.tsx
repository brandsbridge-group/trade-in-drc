"use client";

import * as React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Search, CalendarDays } from "lucide-react";
import { EVENT_TYPES } from "./event-constants";

export interface SelectOption {
  value: string;
  label: string;
}

const FIELD_CLS =
  "h-12 w-full min-w-0 appearance-none rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none transition-colors duration-150 placeholder:text-slate-400 hover:border-slate-300 focus:border-market-navy focus:ring-2 focus:ring-market-navy/10";

const SUBMIT_ANCHOR = "submit-event";
const UPCOMING_ANCHOR = "upcoming-events";

function scrollToAnchor(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/**
 * Events-hub hero (design 13): full-bleed conference photo under a navy overlay,
 * centered headline + a five-field white search bar that navigates to
 * `/events?q&type&sector&location&date`. Below: browse + submit-an-event CTAs.
 */
export function EventsHeroSearch({
  sectorOptions,
  provinces,
}: {
  sectorOptions: SelectOption[];
  provinces: readonly string[];
}) {
  const t = useTranslations("EventsHub.hero");
  const tType = useTranslations("EventsHub.eventTypes");
  const router = useRouter();

  const onSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const params = new URLSearchParams();
    for (const key of ["q", "type", "sector", "location", "date"] as const) {
      const value = String(fd.get(key) ?? "").trim();
      if (value) params.set(key, value);
    }
    const query = params.toString();
    router.push(`/events${query ? `?${query}` : ""}`);
    scrollToAnchor(UPCOMING_ANCHOR);
  };

  return (
    <section className="relative isolate overflow-hidden bg-[linear-gradient(135deg,#0a1830_0%,#102b57_35%,#0d1c37_100%)]">
      <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-[22%] md:block [mask-image:linear-gradient(to_right,black_45%,transparent)]">
        <Image src="/images/events/hero-left.jpg" alt="" fill priority className="object-cover" sizes="22vw" />
      </div>
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[22%] md:block [mask-image:linear-gradient(to_left,black_45%,transparent)]">
        <Image src="/images/events/hero-right.jpg" alt="" fill priority className="object-cover" sizes="22vw" />
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(245,188,72,0.16),transparent_28%)]" aria-hidden />
      <div className="absolute inset-0 bg-market-navy/55" aria-hidden />

      <div className="relative mx-auto w-full max-w-[1500px] px-4 py-12 text-center md:px-6 md:py-16">
        <h1 className="mx-auto max-w-4xl font-display text-3xl font-bold leading-[1.12] text-white md:text-5xl">
          {t("title")}
        </h1>
        <p className="mx-auto mt-4 max-w-3xl text-sm leading-6 text-white/85 md:text-base md:leading-7">
          {t("subtitle")}
        </p>

        <form
          onSubmit={onSearch}
          className="mx-auto mt-8 grid max-w-6xl gap-2.5 rounded-[24px] border border-white/60 bg-white/95 p-3 shadow-[0_30px_90px_-40px_rgba(0,0,0,0.55)] backdrop-blur-sm sm:grid-cols-2 lg:grid-cols-6"
        >
          <div className="relative lg:col-span-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-market-red" aria-hidden />
            <input name="q" placeholder={t("keyword")} className={`${FIELD_CLS} pl-10`} />
          </div>
          <select name="type" defaultValue="" className={FIELD_CLS} aria-label={t("eventTypeAll")}>
            <option value="">{t("eventTypeAll")}</option>
            {EVENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {tType(type)}
              </option>
            ))}
          </select>
          <select name="sector" defaultValue="" className={FIELD_CLS} aria-label={t("sectorAll")}>
            <option value="">{t("sectorAll")}</option>
            {sectorOptions.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <select name="location" defaultValue="" className={FIELD_CLS} aria-label={t("locationAll")}>
            <option value="">{t("locationAll")}</option>
            {provinces.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <div className="relative">
            <input
              name="date"
              type="date"
              aria-label={t("datePlaceholder")}
              className={FIELD_CLS}
            />
            <CalendarDays
              className="pointer-events-none absolute right-3 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-slate-400 sm:block"
              aria-hidden
            />
          </div>
          <button
            type="submit"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-market-red px-4 text-sm font-bold text-white shadow-sm transition-colors duration-150 hover:bg-market-red-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-market-navy"
          >
            <Search className="h-4 w-4" aria-hidden />
            {t("search")}
          </button>
        </form>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => scrollToAnchor(UPCOMING_ANCHOR)}
            className="inline-flex h-11 items-center justify-center rounded-full border border-white/45 bg-white/5 px-6 text-sm font-bold text-white transition-colors duration-150 hover:bg-white/10"
          >
            {t("browse")}
          </button>
          <button
            type="button"
            onClick={() => scrollToAnchor(SUBMIT_ANCHOR)}
            className="inline-flex h-11 items-center justify-center rounded-full bg-market-red px-6 text-sm font-bold text-white transition-all duration-200 hover:bg-market-red-dark"
          >
            {t("submit")}
          </button>
        </div>
      </div>
    </section>
  );
}
