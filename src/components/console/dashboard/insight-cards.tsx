"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { SERIES_COLOR } from "@/components/dashboard/overview/activity-chart";
import { EmptyHint, OverviewCard } from "@/components/dashboard/overview/overview-card";
import type { ConsoleDashboardMetrics, NamedCount } from "@/lib/console/dashboard-metrics";
import { BarList } from "./bar-list";

/** Status as a coloured dot + label (never colour alone). */
const STATUS_DOT: Record<string, string> = {
  verified: "bg-emerald-500",
  pending: "bg-amber-500",
  pending_documents: "bg-slate-400",
  rejected: "bg-red-500",
};

/** Same hatching as the activity chart: the second series never relies on colour alone. */
const HATCH = "repeating-linear-gradient(45deg, rgba(255,255,255,0.28) 0 3px, transparent 3px 7px)";

export function CategoriesCard({ categories }: { categories: ConsoleDashboardMetrics["categories"] }) {
  const t = useTranslations("Admin.dashboard.categories");
  const tCategory = useTranslations("Opportunities.categories");
  const format = useFormatter();
  return (
    <OverviewCard
      id="console-categories"
      title={t("title")}
      subtitle={t("subtitle")}
      footerLink={{ href: ROUTES.CONSOLE_OPPORTUNITIES, label: t("viewAll") }}
      className="h-full"
    >
      {categories.length === 0 ? (
        <EmptyHint text={t("empty")} />
      ) : (
        <BarList
          items={categories.map((c) => ({
            key: c.category,
            label: tCategory.has(c.category) ? tCategory(c.category) : c.category,
            value: c.published,
            valueText: format.number(c.published),
            note: [t("responses", { count: c.responses }), c.pending > 0 ? t("pending", { count: c.pending }) : null]
              .filter(Boolean)
              .join(" · "),
          }))}
        />
      )}
    </OverviewCard>
  );
}

export function SectorsCard({ sectors }: { sectors: ConsoleDashboardMetrics["sectors"] }) {
  const t = useTranslations("Admin.dashboard.sectors");
  const format = useFormatter();
  const locale = useLocale();
  return (
    <OverviewCard id="console-sectors" title={t("title")} subtitle={t("subtitle")} className="h-full">
      {sectors.length === 0 ? (
        <EmptyHint text={t("empty")} />
      ) : (
        <BarList
          items={sectors.map((s) => ({
            key: s.id,
            label: locale === "fr" ? s.name_fr : s.name_en,
            value: s.count,
            valueText: format.number(s.count),
            note: t("verified", { count: s.verified }),
          }))}
        />
      )}
    </OverviewCard>
  );
}

function RankedNames({ title, items, empty }: { title: string; items: NamedCount[]; empty: string }) {
  const format = useFormatter();
  return (
    <div className="min-w-0">
      <h3 className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-500">{title}</h3>
      {items.length === 0 ? (
        <p className="text-xs text-slate-500">{empty}</p>
      ) : (
        <ul className="space-y-1 text-[13px]">
          {items.map((item) => (
            <li key={item.name} className="flex items-baseline justify-between gap-2">
              <span className="truncate text-market-navy">{item.name}</span>
              <span className="shrink-0 tabular-nums text-slate-500">{format.number(item.count)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Congolese sellers vs international buyers: the two sides the marketplace connects. */
export function OriginCard({ origin }: { origin: ConsoleDashboardMetrics["origin"] }) {
  const t = useTranslations("Admin.dashboard.origin");
  const format = useFormatter();
  const total = origin.drc + origin.intl;
  const share = (value: number) => format.number(total ? value / total : 0, { style: "percent", maximumFractionDigits: 0 });
  const sides = [
    { key: "drc", value: origin.drc, style: { backgroundColor: SERIES_COLOR.blue } },
    { key: "intl", value: origin.intl, style: { backgroundColor: SERIES_COLOR.gold, backgroundImage: HATCH } },
  ] as const;

  return (
    <OverviewCard id="console-origin" title={t("title")} subtitle={t("subtitle")} className="h-full">
      {total === 0 ? (
        <EmptyHint text={t("empty")} />
      ) : (
        <>
          <div className="flex h-2.5 gap-[2px] overflow-hidden rounded-[4px]" aria-hidden>
            {sides.map((s) => (s.value > 0 ? <span key={s.key} style={{ ...s.style, flexGrow: s.value }} /> : null))}
          </div>
          <ul className="mt-3 grid grid-cols-2 gap-3">
            {sides.map((s) => (
              <li key={s.key}>
                <p className="flex items-center gap-1.5 text-xs text-slate-600">
                  <span className="h-2.5 w-2.5 rounded-[3px]" style={s.style} aria-hidden />
                  {t(s.key)}
                </p>
                <p className="mt-0.5 font-display text-lg font-semibold tabular-nums text-market-navy">
                  {format.number(s.value)}
                  <span className="ml-1.5 font-sans text-xs font-normal text-slate-500">{share(s.value)}</span>
                </p>
              </li>
            ))}
          </ul>
          <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
            <RankedNames title={t("provinces")} items={origin.provinces} empty={t("noProvinces")} />
            <RankedNames title={t("countries")} items={origin.countries} empty={t("noIntl")} />
          </div>
        </>
      )}
    </OverviewCard>
  );
}

export function TopCompaniesCard({ companies }: { companies: ConsoleDashboardMetrics["top_companies"] }) {
  const t = useTranslations("Admin.dashboard.top");
  const tStatus = useTranslations("Admin.companies.statusValues");
  return (
    <OverviewCard
      id="console-top-companies"
      title={t("title")}
      subtitle={t("subtitle")}
      footerLink={{ href: ROUTES.CONSOLE_COMPANIES, label: t("viewAll") }}
      className="h-full"
    >
      {companies.length === 0 ? (
        <EmptyHint text={t("empty")} />
      ) : (
        <ol className="divide-y divide-slate-100">
          {companies.map((company, i) => (
            <li key={company.id}>
              <Link
                href={`${ROUTES.CONSOLE_COMPANIES}/${company.id}`}
                className="flex items-center gap-3 rounded-lg py-2.5 transition-colors hover:bg-slate-50"
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-semibold tabular-nums text-market-navy">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold text-market-navy">{company.name}</span>
                  <span className="flex items-center gap-1.5 text-[11.5px] text-slate-500">
                    <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[company.status] ?? "bg-slate-400")} aria-hidden />
                    {tStatus.has(company.status) ? tStatus(company.status) : company.status}
                  </span>
                </span>
                <span className="shrink-0 text-right text-xs tabular-nums text-slate-500">
                  <span className="block font-medium text-market-navy">{t("views", { count: company.views })}</span>
                  {t("contacts", { count: company.contacts })}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </OverviewCard>
  );
}

export function PremiumCard({ premium }: { premium: ConsoleDashboardMetrics["premium"] }) {
  const t = useTranslations("Admin.dashboard.premium");
  const tPlan = useTranslations("AdminRequests.fulfil.plans");
  const format = useFormatter();
  const stats = [
    { key: "active", value: format.number(premium.active) },
    { key: "expiring", value: format.number(premium.expiring_30d) },
    {
      key: "revenue",
      value: format.number(premium.approved_amount_usd, { style: "currency", currency: "USD", maximumFractionDigits: 0 }),
    },
  ] as const;

  return (
    <OverviewCard
      id="console-premium"
      title={t("title")}
      subtitle={t("subtitle")}
      footerLink={{ href: ROUTES.CONSOLE_PREMIUM, label: t("viewAll") }}
      className="h-full"
    >
      <dl className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.key}>
            <dt className="text-[11px] leading-tight text-slate-500">{t(s.key)}</dt>
            <dd className="mt-0.5 font-display text-lg font-semibold tabular-nums text-market-navy">{s.value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-1 text-[11.5px] text-slate-500">{t("revenueFoot", { count: premium.approved_count })}</p>

      <div className="mt-4 border-t border-slate-100 pt-4">
        {premium.by_plan.length === 0 ? (
          <EmptyHint text={t("empty")} />
        ) : (
          <BarList
            items={premium.by_plan.map((p) => ({
              key: p.plan,
              label: tPlan.has(p.plan) ? tPlan(p.plan) : p.plan,
              value: p.count,
              valueText: format.number(p.count),
            }))}
          />
        )}
      </div>
    </OverviewCard>
  );
}
