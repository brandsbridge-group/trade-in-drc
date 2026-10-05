import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Bell, Inbox, MailCheck, X } from "lucide-react";

import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { pickLocalized } from "@/lib/i18n/pick-localized";
import type { Locale } from "@/config/locales";
import { isOpportunityCategory, type OpportunityCategory } from "@/lib/opportunities/categories";
import { isDeadlineWindow, listOpenNotices, listSectorOptions } from "@/lib/opportunities/queries";
import {
  CATEGORY_DISPLAY,
  OPPORTUNITY_TABS,
  categoriesForTab,
  isOpportunityTab,
} from "@/lib/opportunities/board-config";
import { NoticesHero } from "@/components/opportunities/notices/notices-hero";
import { NoticesTrust } from "@/components/opportunities/notices/notices-trust";
import { NoticeCard } from "@/components/opportunities/notices/notice-card";
import { AlertsForm, SubmitNoticeDialog } from "@/components/opportunities/notices/notices-client";

type SP = {
  tab?: string;
  category?: string;
  q?: string;
  sector?: string;
  region?: string;
  deadline?: string;
  alertSector?: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Notices" });
  return { title: `${t("hero.titleLead")} ${t("hero.titleAccent")}`, description: t("hero.lead") };
}

function hrefWith(sp: SP, patch: Partial<Record<keyof SP, string | null>>, hash = "#notices") {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...sp, ...patch })) if (v) p.set(k, v);
  const s = p.toString();
  return `/opportunities${s ? `?${s}` : ""}${hash}`;
}

/**
 * Opportunities board, 2026-09 redesign ("Appels d'offres et opportunités
 * d'investissement en RDC"): navy search hero, three editorial promises, tab
 * chips with live counts, notice cards (source always cited), weekly alerts
 * and an account-free "submit a notice" band. Open notices only, soonest
 * deadline first.
 */
export default async function OpportunitiesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SP>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations("Notices");
  const tBadge = await getTranslations("Opportunities.badges");
  const supabase = await createServerSupabaseClient();

  const rawSectors = await listSectorOptions(supabase);
  const sectors = rawSectors.map((s) => ({ id: s.id, label: pickLocalized(s, "name", locale as Locale) }));
  const sectorLabel = new Map(sectors.map((s) => [s.id, s.label] as const));

  // Filters (anything unknown is ignored rather than breaking the page).
  const tab = isOpportunityTab(sp.tab) ? sp.tab : "all";
  const category: OpportunityCategory | undefined = isOpportunityCategory(sp.category) ? sp.category : undefined;
  const sectorId = sp.sector && sectorLabel.has(sp.sector) ? sp.sector : undefined;
  const region = sp.region?.trim() || undefined;
  const keyword = sp.q?.trim() || undefined;
  const deadline = isDeadlineWindow(sp.deadline) && sp.deadline !== "all" ? sp.deadline : undefined;
  const clean: SP = { tab: tab === "all" ? undefined : tab, category, q: keyword, sector: sectorId, region, deadline };

  const allNoticeCats = categoriesForTab("all");
  const { data: notices, countsByCategory } = await listOpenNotices(supabase, {
    categories: category ? [category] : categoriesForTab(tab),
    countCategories: category ? [category] : allNoticeCats,
    sectorId,
    region,
    keyword,
    deadline,
  });
  const countFor = (key: (typeof OPPORTUNITY_TABS)[number]["key"]) =>
    categoriesForTab(key).reduce((n, c) => n + (countsByCategory[c] ?? 0), 0);

  const activeFilters = [
    keyword && { key: "q", label: `« ${keyword} »` },
    sectorId && { key: "sector", label: sectorLabel.get(sectorId) },
    region && { key: "region", label: region },
    deadline && { key: "deadline", label: t(`search.within.${deadline}`) },
  ].filter(Boolean) as { key: keyof SP; label: string }[];

  const alertPreselect = sp.alertSector && sectorLabel.has(sp.alertSector) ? [sp.alertSector] : sectorId ? [sectorId] : [];

  return (
    <div className="bg-slate-50">
      <NoticesHero locale={locale} sectors={sectors} current={{ ...clean }} />
      <NoticesTrust />

      {/* ── Notices ─────────────────────────────────────────────── */}
      <section id="notices" className="scroll-mt-16">
        <div className="mx-auto w-full max-w-7xl px-4 pb-14 pt-10 md:px-6 md:pb-20">
          <nav aria-label={t("tabsLabel")} className="-mx-4 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
            <ul className="flex w-max gap-2 md:w-auto md:flex-wrap">
              {category ? (
                <li>
                  <Link
                    href={hrefWith(clean, { category: null })}
                    scroll={false}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-landing-navy)] px-3.5 py-2 text-[13px] font-semibold text-white"
                  >
                    {tBadge(CATEGORY_DISPLAY[category].labelKey)}
                    <X className="h-3.5 w-3.5 opacity-70" aria-label={t("clearCategory")} />
                  </Link>
                </li>
              ) : (
                OPPORTUNITY_TABS.map(({ key }) => {
                  const on = key === tab;
                  return (
                    <li key={key}>
                      <Link
                        href={hrefWith(clean, { tab: key === "all" ? null : key })}
                        scroll={false}
                        aria-current={on ? "true" : undefined}
                        className={cn(
                          "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-[13px] font-semibold ring-1 transition-colors duration-150 ease-out",
                          on
                            ? "bg-[var(--color-landing-navy)] text-white ring-[var(--color-landing-navy)]"
                            : "bg-white text-[var(--color-landing-navy)] ring-slate-200 hover:ring-slate-300",
                        )}
                      >
                        {t(`tabs.${key}`)}
                        <span
                          className={cn(
                            "rounded-full px-1.5 text-[11px] tabular-nums",
                            on ? "bg-white/15 text-white" : "bg-slate-100 text-slate-500",
                          )}
                        >
                          {countFor(key)}
                        </span>
                      </Link>
                    </li>
                  );
                })
              )}
            </ul>
          </nav>

          <div className="mt-6 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-xl font-bold tracking-tight text-[var(--color-landing-navy)]">
              {t("count", { count: notices.length })}
            </h2>
            {notices.length > 1 && <span className="text-xs text-slate-500">{t("sorted")}</span>}
          </div>

          {activeFilters.length > 0 && (
            <ul className="mt-3 flex flex-wrap items-center gap-2">
              {activeFilters.map((f) => (
                <li key={f.key}>
                  <Link
                    href={hrefWith(clean, { [f.key]: null })}
                    scroll={false}
                    aria-label={t("removeFilter", { label: f.label })}
                    className="inline-flex items-center gap-1 rounded-full bg-white py-1 pl-3 pr-2 text-xs font-medium text-slate-700 ring-1 ring-slate-200 transition-colors duration-150 ease-out hover:ring-slate-300"
                  >
                    {f.label}
                    <X className="h-3 w-3 text-slate-400" aria-hidden />
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href={hrefWith({ tab: clean.tab, category }, {})}
                  scroll={false}
                  className="text-xs font-semibold text-slate-500 underline-offset-4 transition-colors duration-150 ease-out hover:text-[var(--color-landing-navy)] hover:underline"
                >
                  {t("clearAll")}
                </Link>
              </li>
            </ul>
          )}

          {notices.length === 0 ? (
            <div className="mt-4 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
              <Inbox className="h-9 w-9 text-slate-400" aria-hidden />
              <p className="font-display text-base font-bold text-[var(--color-landing-navy)]">{t("empty.title")}</p>
              <p className="max-w-md text-sm text-slate-500">{t("empty.body")}</p>
              <a
                href="#alerts"
                className="mt-1 inline-flex items-center gap-1.5 rounded-xl bg-[var(--color-landing-navy)] px-4 py-2.5 text-[13px] font-bold text-white transition-colors duration-150 ease-out hover:bg-[#13244a]"
              >
                <Bell className="h-4 w-4" aria-hidden />
                {t("empty.cta")}
              </a>
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {notices.map((n) => (
                <li key={n.id}>
                  <NoticeCard
                    notice={n}
                    locale={locale}
                    sectorLabel={n.sector_id ? (sectorLabel.get(n.sector_id) ?? null) : null}
                    alertHref={n.sector_id ? hrefWith(clean, { alertSector: n.sector_id }, "#alerts") : null}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* ── Weekly alerts ──────────────────────────────────────── */}
      <section id="alerts" className="relative isolate scroll-mt-16 overflow-hidden bg-market-navy text-white">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -right-32 -top-32 h-[380px] w-[380px] rounded-full bg-market-or/10 blur-[110px]" />
          <div className="absolute -bottom-40 -left-24 h-[360px] w-[360px] rounded-full bg-primary/35 blur-[110px]" />
        </div>
        <div className="mx-auto grid w-full max-w-7xl items-center gap-10 px-4 py-14 md:px-6 md:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:gap-16">
          <div>
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-market-or/15 text-market-or">
              <MailCheck className="h-5 w-5" aria-hidden />
            </span>
            <h2 className="mt-5 max-w-xl font-display text-3xl font-extrabold leading-tight tracking-tight md:text-[34px]">
              {t("alerts.title")}
            </h2>
            <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-white/70">{t("alerts.body")}</p>
            <ul className="mt-5 space-y-2 text-sm text-white/80">
              {(["one", "noAccount", "unsubscribe"] as const).map((k) => (
                <li key={k} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-market-or" aria-hidden />
                  {t(`alerts.points.${k}`)}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl bg-white p-5 text-slate-900 shadow-2xl shadow-black/30 md:p-7">
            <AlertsForm key={alertPreselect.join(",")} sectors={sectors} preselected={alertPreselect} />
          </div>
        </div>
      </section>

      {/* ── Submit a notice ────────────────────────────────────── */}
      <section className="bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-12 md:flex-row md:items-center md:justify-between md:px-6 md:py-14">
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl font-bold tracking-tight text-[var(--color-landing-navy)]">
              {t("submit.title")}
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{t("submit.body")}</p>
          </div>
          <SubmitNoticeDialog />
        </div>
      </section>
    </div>
  );
}
