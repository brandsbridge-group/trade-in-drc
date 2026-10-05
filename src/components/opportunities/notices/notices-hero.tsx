import { getTranslations } from "next-intl/server";
import { ChevronDown, ChevronRight, Search } from "lucide-react";

import { Link } from "@/i18n/routing";
import { DRC_PROVINCES } from "@/config/provinces";
import { DEADLINE_WINDOWS } from "@/lib/opportunities/queries";

const SELECT =
  "h-11 w-full appearance-none rounded-xl bg-slate-50 pl-3.5 pr-9 text-[13px] font-medium text-slate-700 ring-1 ring-slate-200 transition-[box-shadow,background-color] duration-150 ease-out hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/40";

/**
 * Navy header band: eyebrow, headline, lead, then the search card — keyword +
 * sector / province / deadline selects. A plain GET form (shareable URLs, works
 * without JS); the active tab / category ride along as hidden fields.
 */
export async function NoticesHero({
  locale,
  sectors,
  current,
}: {
  locale: string;
  sectors: { id: string; label: string }[];
  current: { q?: string; sector?: string; region?: string; deadline?: string; tab?: string; category?: string };
}) {
  const t = await getTranslations("Notices");

  const select = (name: string, label: string, value: string | undefined, options: { value: string; label: string }[]) => (
    <label className="relative block min-w-0">
      <span className="sr-only">{label}</span>
      <select name={name} defaultValue={value ?? ""} className={SELECT}>
        <option value="">{label}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
    </label>
  );

  return (
    <section className="relative isolate overflow-hidden bg-market-navy text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-40 -top-40 h-[440px] w-[440px] rounded-full bg-primary/40 blur-[120px]" />
        <div className="absolute -bottom-48 right-[-8%] h-[400px] w-[400px] rounded-full bg-market-or/10 blur-[120px]" />
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 pb-20 pt-6 md:px-6 md:pb-24">
        <nav aria-label={t("breadcrumbLabel")} className="flex items-center gap-1 text-xs text-white/55">
          <Link href="/" className="transition-colors duration-150 ease-out hover:text-white">
            {t("breadcrumbHome")}
          </Link>
          <ChevronRight className="h-3 w-3" aria-hidden />
          <span className="text-white/85" aria-current="page">
            {t("breadcrumbCurrent")}
          </span>
        </nav>

        <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.16em] text-market-or">{t("hero.eyebrow")}</p>
        <h1 className="mt-2 max-w-3xl font-display text-3xl font-extrabold leading-[1.1] tracking-tight md:text-[42px]">
          {t("hero.titleLead")}{" "}
          <span className="bg-gradient-to-r from-market-or to-market-or-light bg-clip-text text-transparent">
            {t("hero.titleAccent")}
          </span>
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-white/70">{t("hero.lead")}</p>

        <form
          action={`/${locale}/opportunities#notices`}
          method="get"
          role="search"
          className="mt-8 grid gap-2 rounded-2xl bg-white p-2 text-slate-900 shadow-2xl shadow-black/25 md:grid-cols-[minmax(0,1.8fr)_repeat(3,minmax(0,1fr))_auto]"
        >
          {current.tab && <input type="hidden" name="tab" value={current.tab} />}
          {current.category && <input type="hidden" name="category" value={current.category} />}
          <label className="relative block min-w-0">
            <span className="sr-only">{t("search.keyword")}</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <input
              type="search"
              name="q"
              defaultValue={current.q}
              placeholder={t("search.placeholder")}
              className="h-11 w-full rounded-xl bg-slate-50 pl-10 pr-3.5 text-[13px] text-slate-800 ring-1 ring-slate-200 transition-[box-shadow,background-color] duration-150 ease-out placeholder:text-slate-400 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </label>
          {select(
            "sector",
            t("search.sector"),
            current.sector,
            sectors.map((s) => ({ value: s.id, label: s.label })),
          )}
          {select(
            "region",
            t("search.province"),
            current.region,
            DRC_PROVINCES.map((p) => ({ value: p, label: p })),
          )}
          {select(
            "deadline",
            t("search.deadline"),
            current.deadline,
            DEADLINE_WINDOWS.filter((w) => w !== "all").map((w) => ({ value: w, label: t(`search.within.${w}`) })),
          )}
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-market-navy px-5 text-[13px] font-bold text-white transition-colors duration-150 ease-out hover:bg-[#13244a]"
          >
            <Search className="h-4 w-4" aria-hidden />
            {t("search.submit")}
          </button>
        </form>
      </div>
    </section>
  );
}
