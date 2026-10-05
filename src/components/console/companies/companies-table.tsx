"use client";

import * as React from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { ArrowUpDown, Building2, ChevronRight, Crown, Search, X } from "lucide-react";
import { Link, useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FilterSelect } from "@/components/admin/requests-table/filter-select";
import { ALL } from "@/components/admin/requests-table/shared";
import {
  COMPANY_ORIGINS,
  COMPANY_SORTS,
  COMPANY_VIEWS,
  companyViewCounts,
  filterCompanies,
  premiumActive,
  sortCompanies,
  type CompanyOrigin,
  type CompanySort,
  type CompanyView,
  type ConsoleCompanyRow,
} from "@/lib/console/companies";
import { CompanyAvatar } from "./company-avatar";
import { PremiumPill, StagePill, TierPill } from "./company-pills";

const PAGE_SIZE = 25;

/**
 * The console's company directory: quick views by verification stage with
 * their counts, search and filters shown as removable chips, and a table whose
 * rows open the company sheet.
 */
export function CompaniesTable({ rows, now }: { rows: ConsoleCompanyRow[]; /** Server time of the read, so premium reads the same on both sides. */ now: string }) {
  const t = useTranslations("Admin.companies.list");
  const tStage = useTranslations("Admin.verifications.stage");
  const tBadge = useTranslations("Trust.badge");
  const tPlan = useTranslations("AdminRequests.fulfil.plans");
  const format = useFormatter();
  const locale = useLocale();
  const router = useRouter();

  const [view, setView] = React.useState<CompanyView>("all");
  const [query, setQuery] = React.useState("");
  const [sector, setSector] = React.useState(ALL);
  const [origin, setOrigin] = React.useState(ALL);
  const [premiumOnly, setPremiumOnly] = React.useState(false);
  const [sort, setSort] = React.useState<CompanySort>("recent");
  const [shown, setShown] = React.useState(PAGE_SIZE);

  const at = React.useMemo(() => new Date(now), [now]);
  const counts = React.useMemo(() => companyViewCounts(rows), [rows]);
  const sectors = React.useMemo(
    () => Array.from(new Set(rows.map((r) => r.sectorName).filter((s): s is string => !!s))).sort((a, b) => a.localeCompare(b, locale)),
    [rows, locale]
  );

  const filtered = React.useMemo(
    () =>
      sortCompanies(
        filterCompanies(
          rows,
          { view, query, sector: sector === ALL ? null : sector, origin: origin === ALL ? null : (origin as CompanyOrigin), premiumOnly },
          at
        ),
        sort,
        locale
      ),
    [rows, view, query, sector, origin, premiumOnly, sort, at, locale]
  );
  const visible = filtered.slice(0, shown);

  // Any change of what is listed starts again from the first page.
  const narrow = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setShown(PAGE_SIZE);
  };

  const chips = [
    query.trim() ? { key: "query", label: `« ${query.trim()} »`, clear: () => setQuery("") } : null,
    sector !== ALL ? { key: "sector", label: sector, clear: () => setSector(ALL) } : null,
    origin !== ALL ? { key: "origin", label: t(`filters.origins.${origin as CompanyOrigin}`), clear: () => setOrigin(ALL) } : null,
    premiumOnly ? { key: "premium", label: t("filters.premium"), clear: () => setPremiumOnly(false) } : null,
  ].filter((chip): chip is { key: string; label: string; clear: () => void } => chip !== null);

  const clearFilters = () => {
    setQuery("");
    setSector(ALL);
    setOrigin(ALL);
    setPremiumOnly(false);
    setShown(PAGE_SIZE);
  };

  const planLabel = (plan: string | null) => (plan && tPlan.has(plan) ? tPlan(plan) : tBadge("premium"));

  return (
    <div className="space-y-3">
      {/* Quick views: where each company stands in the verification circuit. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label={t("views.label")} className="inline-flex max-w-full flex-wrap gap-0.5 rounded-xl bg-slate-200/70 p-1">
          {COMPANY_VIEWS.map((v) => {
            const active = view === v;
            return (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => narrow(setView)(v)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] transition-colors",
                  active ? "bg-white font-semibold text-market-navy ring-1 ring-slate-200" : "text-slate-600 hover:text-market-navy"
                )}
              >
                {v === "all" ? t("views.all") : tStage(v)}
                <span
                  className={cn(
                    "min-w-5 rounded-full px-1.5 text-center text-[11px] font-semibold tabular-nums leading-5",
                    v === "to_review" && counts[v] > 0
                      ? "bg-amber-100 text-amber-800"
                      : active ? "bg-slate-100 text-market-navy" : "bg-slate-300/50 text-slate-600"
                  )}
                >
                  {counts[v]}
                </span>
              </button>
            );
          })}
        </div>
        <p className="text-xs tabular-nums text-slate-500" aria-live="polite">{t("results", { count: filtered.length })}</p>
      </div>

      {/* Search, filters and order */}
      <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-200/70">
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-[minmax(0,1fr)_180px_200px_auto_220px]">
          <div className="relative col-span-2 lg:col-span-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => narrow(setQuery)(e.target.value)}
              placeholder={t("filters.search")}
              aria-label={t("filters.search")}
              className="h-9 w-full rounded-full bg-slate-100 pl-10 pr-4 text-[13px] text-market-navy outline-none transition-colors placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-market-navy/20"
            />
          </div>
          <FilterSelect label={t("filters.sector")} value={sector} onValueChange={narrow(setSector)} allLabel={t("filters.allSectors")} options={sectors} />
          <FilterSelect
            label={t("filters.origin")}
            value={origin}
            onValueChange={narrow(setOrigin)}
            allLabel={t("filters.allOrigins")}
            options={[...COMPANY_ORIGINS]}
            renderOption={(o) => t(`filters.origins.${o}`)}
          />
          <button
            type="button"
            aria-pressed={premiumOnly}
            onClick={() => narrow(setPremiumOnly)(!premiumOnly)}
            className={cn(
              "inline-flex h-9 items-center justify-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium transition-colors",
              premiumOnly ? "bg-market-navy text-market-or-light" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
            )}
          >
            <Crown className="size-3.5" aria-hidden />
            {t("filters.premium")}
          </button>
          <Select value={sort} onValueChange={(value) => setSort(value as CompanySort)}>
            <SelectTrigger className="h-9 w-full rounded-full border-slate-200 bg-white px-3.5 text-[13px] shadow-none" aria-label={t("filters.sort")}>
              <span className="flex min-w-0 items-center gap-1.5">
                <ArrowUpDown className="size-3.5 shrink-0 text-slate-400" aria-hidden />
                <SelectValue />
              </span>
            </SelectTrigger>
            <SelectContent>
              {COMPANY_SORTS.map((option) => (
                <SelectItem key={option} value={option} className="text-xs">
                  {t(`filters.sorts.${option}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {chips.length > 0 && (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {chips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={() => {
                  chip.clear();
                  setShown(PAGE_SIZE);
                }}
                aria-label={t("filters.remove", { label: chip.label })}
                className="inline-flex items-center gap-1 rounded-full bg-slate-100 py-1 pl-2.5 pr-1.5 text-xs font-medium text-market-navy transition-colors hover:bg-slate-200"
              >
                {chip.label}
                <X className="size-3.5 text-slate-500" aria-hidden />
              </button>
            ))}
            <button type="button" onClick={clearFilters} className="px-1.5 text-xs font-medium text-slate-500 underline-offset-2 transition-colors hover:text-market-navy hover:underline">
              {t("filters.clear")}
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="console-table-card">
        <table className="w-full min-w-[980px] border-collapse text-sm">
          <thead>
            <tr className="text-left">
              <th className="py-2.5 font-medium">{t("table.company")}</th>
              <th className="py-2.5 font-medium">{t("table.sector")}</th>
              <th className="py-2.5 font-medium">{t("table.file")}</th>
              <th className="py-2.5 font-medium">{t("table.tier")}</th>
              <th className="py-2.5 text-right font-medium">{t("table.products")}</th>
              <th className="py-2.5 font-medium">{t("table.owner")}</th>
              <th className="py-2.5 font-medium">{t("table.registered")}</th>
              <th className="py-2.5"><span className="sr-only">{t("table.open")}</span></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((company) => {
              const place = [company.city, company.country].filter(Boolean).join(", ");
              const premium = premiumActive(company, at);
              return (
                <tr
                  key={company.id}
                  onClick={() => router.push(`/console/companies/${company.id}`)}
                  className="cursor-pointer border-b transition-colors hover:bg-slate-50"
                >
                  <td className="py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <CompanyAvatar name={company.name} logoUrl={company.logoUrl} />
                      <div className="min-w-0">
                        {/* The row's keyboard entry point: the whole row is a mouse shortcut for it. */}
                        <Link
                          href={`/console/companies/${company.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="block max-w-[240px] truncate text-[13.5px] font-semibold text-market-navy underline-offset-2 hover:underline"
                        >
                          {company.name}
                        </Link>
                        {place && <p className="max-w-[240px] truncate text-xs text-slate-500">{place}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="max-w-[170px] py-3">
                    <p className="truncate text-[13px] text-slate-700">{company.sectorName ?? <span className="text-slate-400">{t("table.noSector")}</span>}</p>
                  </td>
                  <td className="py-3">
                    <StagePill stage={company.stage} label={tStage(company.stage)} />
                  </td>
                  <td className="py-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <TierPill tier={company.verificationTier} label={tBadge(company.verificationTier)} />
                      {premium && (
                        <PremiumPill
                          label={planLabel(company.premiumPlan)}
                          title={
                            company.premiumExpiresAt
                              ? t("table.premiumUntil", { date: format.dateTime(new Date(company.premiumExpiresAt), { dateStyle: "medium" }) })
                              : undefined
                          }
                        />
                      )}
                    </div>
                  </td>
                  <td className={cn("py-3 text-right text-[13px] tabular-nums", company.productCount > 0 ? "font-semibold text-market-navy" : "text-slate-400")}>
                    {format.number(company.productCount)}
                  </td>
                  <td className="max-w-[200px] py-3">
                    {company.ownerName || company.ownerEmail ? (
                      <>
                        <p className="truncate text-[13px] font-medium text-slate-700">{company.ownerName ?? company.ownerEmail}</p>
                        {company.ownerName && company.ownerEmail && <p className="truncate text-xs text-slate-500">{company.ownerEmail}</p>}
                      </>
                    ) : (
                      <span className="text-xs text-slate-400">{t("table.noOwner")}</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap py-3 text-[13px] tabular-nums text-slate-500">
                    {format.dateTime(new Date(company.createdAt), { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="py-3 text-right">
                    <ChevronRight className="ml-auto size-4 text-slate-300" aria-hidden />
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-14 text-center">
                  <span className="mx-auto grid size-11 place-items-center rounded-full bg-slate-100 text-slate-500" aria-hidden>
                    <Building2 className="size-5" />
                  </span>
                  <p className="mt-3 text-sm font-medium text-market-navy">{t("empty")}</p>
                  {(chips.length > 0 || view !== "all") && (
                    <button
                      type="button"
                      onClick={() => {
                        clearFilters();
                        setView("all");
                      }}
                      className="mt-2 text-xs font-medium text-slate-500 underline-offset-2 transition-colors hover:text-market-navy hover:underline"
                    >
                      {t("filters.clear")}
                    </button>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > shown && (
        <div className="text-center">
          <button
            type="button"
            onClick={() => setShown((count) => count + PAGE_SIZE)}
            className="rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-market-navy ring-1 ring-slate-200 transition-colors hover:bg-slate-50"
          >
            {t("more", { count: filtered.length - shown })}
          </button>
        </div>
      )}
    </div>
  );
}
