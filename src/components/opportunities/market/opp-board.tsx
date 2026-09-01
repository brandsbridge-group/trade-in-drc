import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { pickLocalized } from "@/lib/i18n/pick-localized";
import type { Locale } from "@/config/locales";
import type { OpportunityBoardRow } from "@/lib/opportunities/queries";
import { OPPORTUNITY_TABS, CATEGORY_DISPLAY, type OpportunityTab } from "@/lib/opportunities/board-config";
import { BadgeCheck, CalendarDays, MapPin } from "lucide-react";

interface BoardProps {
  items: OpportunityBoardRow[];
  locale: string;
  activeTab: OpportunityTab;
  /** Current non-tab filters, preserved across tab links. */
  current: { q?: string; sector?: string; region?: string };
  sectorLabels: Map<string, string>;
  hasMore: boolean;
}

function tabHref(
  tab: OpportunityTab,
  current: { q?: string; sector?: string; region?: string }
): string {
  const params = new URLSearchParams();
  if (tab !== "all") params.set("tab", tab);
  if (current.q) params.set("q", current.q);
  if (current.sector) params.set("sector", current.sector);
  if (current.region) params.set("region", current.region);
  const qs = params.toString();
  return qs ? `/opportunities?${qs}#board` : "/opportunities#board";
}

export async function OppBoard({ items, locale, activeTab, current, sectorLabels, hasMore }: BoardProps) {
  const t = await getTranslations("Opportunities");
  const dateFmt = new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <section id="board" className="scroll-mt-20 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="font-display text-lg font-bold text-market-navy">{t("board.title")}</h2>

      {/* Tabs */}
      <div className="mt-3 flex flex-wrap gap-1.5 border-b border-slate-200 pb-3">
        {OPPORTUNITY_TABS.map((tab) => {
          const active = tab.key === activeTab;
          return (
            <Link
              key={tab.key}
              href={tabHref(tab.key, current)}
              scroll={false}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors duration-150 ${
                active
                  ? "bg-market-navy text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {t(`tabs.${tab.key}`)}
            </Link>
          );
        })}
      </div>

      {/* Rows */}
      {items.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500">{t("page.empty")}</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.map((o) => {
            const disp = CATEGORY_DISPLAY[o.category];
            const Icon = disp.icon;
            const title = pickLocalized(o, "title", locale as Locale);
            const summary = pickLocalized(o, "summary", locale as Locale);
            const sectorLabel = o.sector_id ? sectorLabels.get(o.sector_id) : undefined;
            const verified =
              o.company?.status === "verified" ||
              o.company?.verification_tier === "verified" ||
              o.company?.verification_tier === "premium";
            return (
              <li
                key={o.id}
                className="grid grid-cols-[auto_1fr] items-start gap-3 py-3 lg:grid-cols-[auto_minmax(0,2.4fr)_minmax(0,1fr)_minmax(0,1fr)_auto_auto_auto] lg:items-center lg:gap-4"
              >
                {/* Icon */}
                <div className={`grid h-10 w-10 place-items-center rounded-md ${disp.iconWrap}`}>
                  <Icon className="h-5 w-5" strokeWidth={1.9} aria-hidden />
                </div>

                {/* Title + summary + sector */}
                <div className="min-w-0">
                  <div className="text-sm font-bold leading-tight text-market-navy">{title}</div>
                  <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{summary}</p>
                  {sectorLabel && (
                    <span className="mt-1 inline-block text-[10px] font-semibold text-market-red">{sectorLabel}</span>
                  )}
                </div>

                {/* Location */}
                <div className="hidden items-center gap-1.5 text-xs text-slate-600 lg:flex">
                  <MapPin className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                  {o.region ?? "—"}
                </div>

                {/* Company + verified */}
                <div className="hidden min-w-0 lg:block">
                  <div className="truncate text-xs font-semibold text-slate-700">{o.company?.name ?? "—"}</div>
                  {verified && (
                    <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-semibold text-green-600">
                      <BadgeCheck className="h-3.5 w-3.5" aria-hidden /> {t("board.verified")}
                    </span>
                  )}
                </div>

                {/* Deadline */}
                <div className="hidden items-center gap-1.5 whitespace-nowrap text-xs text-slate-600 lg:flex">
                  <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                  <span>
                    <span className="block text-[10px] text-slate-400">{t("board.deadline")}</span>
                    {o.deadline_at ? dateFmt.format(new Date(o.deadline_at)) : t("board.openEnded")}
                  </span>
                </div>

                {/* Type badge */}
                <div className="hidden lg:block">
                  <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-semibold ${disp.badge}`}>
                    {t(`badges.${disp.labelKey}`)}
                  </span>
                </div>

                {/* Actions */}
                <div className="col-span-2 mt-1 flex gap-2 lg:col-span-1 lg:mt-0 lg:flex-col lg:gap-1.5">
                  <Link
                    href={`/opportunities/${o.category}/${o.slug}`}
                    className="whitespace-nowrap rounded border border-slate-300 px-3 py-1.5 text-center text-[11px] font-semibold text-slate-700 transition-colors duration-150 hover:bg-slate-50"
                  >
                    {t("board.viewDetails")}
                  </Link>
                  <Link
                    href={`/opportunities/${o.category}/${o.slug}#interest`}
                    className="whitespace-nowrap rounded bg-market-red px-3 py-1.5 text-center text-[11px] font-semibold text-white transition-colors duration-150 hover:bg-market-red-dark"
                  >
                    {t("board.expressInterest")}
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {hasMore && (
        <div className="mt-4 flex justify-center">
          <Link
            href="/opportunities/tender"
            className="rounded-md border border-slate-300 px-5 py-2.5 text-sm font-semibold text-market-navy transition-colors duration-150 hover:bg-slate-50"
          >
            {t("board.viewMore")}
          </Link>
        </div>
      )}
    </section>
  );
}
