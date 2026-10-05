"use client";

import * as React from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { AlertTriangle, ArrowRight, Check, CheckCircle, Clock, FileWarning, Hourglass, Inbox, Search, Timer } from "lucide-react";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/console/page-header";
import { KpiTile, KpiTileSkeleton } from "@/components/dashboard/overview/kpi-tile";
import { getVerificationQueue, type QueueCompany, type VerificationQueue } from "@/lib/verifications/actions";
import { REVIEW_TARGET_DAYS, daysBetween } from "@/lib/verifications/workflow";
import { requiredDocTypes } from "@/lib/verifications/required-documents";

type FilterTab = "to_review" | "awaiting_owner" | "all";
const TABS: FilterTab[] = ["to_review", "awaiting_owner", "all"];

const STAGE_PILL: Record<string, string> = {
  to_review: "bg-blue-50 text-blue-700",
  awaiting_owner: "bg-amber-100 text-amber-800",
};

/**
 * Verification queue: every company in the circuit, split by whose turn it is
 * (staff to review / company to answer), oldest first, with how long each file
 * has been waiting and whether it is complete.
 */
export default function VerificationsPage() {
  const t = useTranslations("Admin.verifications");
  const format = useFormatter();
  const locale = useLocale();

  const [queue, setQueue] = React.useState<VerificationQueue | null>(null);
  const [loadError, setLoadError] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<FilterTab>("to_review");
  const [search, setSearch] = React.useState("");
  const [now] = React.useState(() => new Date());
  const [attempt, setAttempt] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    getVerificationQueue(locale)
      .then((data) => {
        if (!cancelled) {
          setQueue(data);
          setLoadError(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [locale, attempt]);

  const companies = React.useMemo(() => queue?.companies ?? [], [queue]);
  const toReview = companies.filter((c) => c.stage === "to_review");
  const awaiting = companies.filter((c) => c.stage === "awaiting_owner");
  const counts: Record<FilterTab, number> = { to_review: toReview.length, awaiting_owner: awaiting.length, all: companies.length };
  const oldest = toReview.reduce((max, c) => Math.max(max, daysBetween(c.submittedAt, now)), 0);
  const late = toReview.filter((c) => daysBetween(c.submittedAt, now) > REVIEW_TARGET_DAYS).length;

  const shown = React.useMemo(() => {
    const needle = search.trim().toLowerCase();
    return companies
      .filter((c) => activeTab === "all" || c.stage === activeTab)
      .filter((c) => !needle || c.name.toLowerCase().includes(needle) || (c.ownerEmail ?? "").toLowerCase().includes(needle))
      .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
  }, [companies, activeTab, search]);

  return (
    <div className="space-y-4">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {!queue && !loadError ? (
          Array.from({ length: 4 }).map((_, i) => <KpiTileSkeleton key={i} />)
        ) : (
          <>
            <KpiTile highlight icon={Inbox} label={t("kpi.toReview")} value={format.number(toReview.length)} footnote={t("kpi.toReviewFoot")} />
            <KpiTile
              icon={Timer}
              label={t("kpi.oldest")}
              value={toReview.length ? t("days", { count: oldest }) : "—"}
              footnote={late > 0 ? t("kpi.late", { count: late, days: REVIEW_TARGET_DAYS }) : t("kpi.onTime", { days: REVIEW_TARGET_DAYS })}
            />
            <KpiTile icon={Hourglass} label={t("kpi.awaitingOwner")} value={format.number(awaiting.length)} footnote={t("kpi.awaitingOwnerFoot")} />
            <KpiTile icon={FileWarning} label={t("kpi.notSubmitted")} value={format.number(queue?.notSubmittedCount ?? 0)} footnote={t("kpi.notSubmittedFoot")} />
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label={t("title")} className="inline-flex rounded-full bg-white p-1 ring-1 ring-slate-200/70">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors",
                activeTab === tab ? "bg-market-navy text-white" : "text-slate-600 hover:text-market-navy"
              )}
            >
              {t(`tabs.${tab}`, { count: counts[tab] })}
            </button>
          ))}
        </div>
        <label className="relative min-w-0 flex-1 sm:max-w-xs">
          <span className="sr-only">{t("search")}</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("search")}
            className="h-10 w-full rounded-full border border-slate-200 bg-white pl-10 pr-3.5 text-[13px] text-slate-700 outline-none transition-colors focus:border-market-navy"
          />
        </label>
      </div>

      <div className="console-table-card">
        {loadError ? (
          <div className="p-8 text-center">
            <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-red-500" aria-hidden />
            <p className="text-sm text-slate-500">{t("loadError")}</p>
            <button type="button" onClick={() => setAttempt((n) => n + 1)} className="mt-2 text-sm font-semibold text-market-navy underline">
              {t("retry")}
            </button>
          </div>
        ) : !queue ? (
          <div className="p-8 text-center">
            <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-market-navy border-t-transparent" />
          </div>
        ) : shown.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle className="mx-auto mb-3 h-10 w-10 text-emerald-500" aria-hidden />
            <h3 className="mb-1 text-sm font-semibold text-market-navy">{t(search ? "empty.search" : `empty.${activeTab}.title`)}</h3>
            {!search && <p className="text-sm text-slate-500">{t(`empty.${activeTab}.subtitle`)}</p>}
          </div>
        ) : (
          <table className="w-full min-w-[760px] text-left text-[13px]">
            <thead>
              <tr className="text-[11.5px] font-semibold text-slate-500">
                <th className="px-4 py-3 font-semibold">{t("columns.company")}</th>
                <th className="px-4 py-3 font-semibold">{t("columns.sector")}</th>
                <th className="px-4 py-3 font-semibold">{t("columns.submitted")}</th>
                <th className="px-4 py-3 font-semibold">{t("columns.file")}</th>
                <th className="px-4 py-3 font-semibold">{t("columns.status")}</th>
                <th className="px-4 py-3 text-right font-semibold">{t("columns.action")}</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((company) => (
                <QueueRow key={company.id} company={company} now={now} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function QueueRow({ company, now }: { company: QueueCompany; now: Date }) {
  const t = useTranslations("Admin.verifications");
  const format = useFormatter();
  const waiting = daysBetween(company.submittedAt, now);
  const late = company.stage === "to_review" && waiting > REVIEW_TARGET_DAYS;
  const required = requiredDocTypes(company.country);
  const complete = company.missingDocuments.length === 0 && company.missingLegal.length === 0;

  return (
    <tr className="border-t border-slate-100">
      <td className="px-4 py-3">
        <Link href={`/console/verifications/${company.id}`} className="font-semibold text-market-navy hover:underline">
          {company.name}
        </Link>
        <p className="text-xs text-slate-500">{company.ownerEmail ?? "—"}</p>
      </td>
      <td className="px-4 py-3 text-slate-600">{company.sectorName ?? "—"}</td>
      <td className="px-4 py-3">
        <p className="text-slate-600">{format.dateTime(new Date(company.submittedAt), { day: "numeric", month: "short", year: "numeric" })}</p>
        <p className={cn("inline-flex items-center gap-1 text-xs", late ? "font-semibold text-red-700" : "text-slate-500")}>
          <Clock className="h-3 w-3" aria-hidden />
          {t("waiting", { count: waiting })}
          {late && <span className="sr-only"> — {t("lateSr")}</span>}
        </p>
      </td>
      <td className="px-4 py-3">
        {complete ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
            <Check className="h-3.5 w-3.5" aria-hidden />
            {t("file.complete")}
          </span>
        ) : (
          <span className="text-xs text-amber-800">
            <span className="font-semibold">{t("file.incomplete")}</span>
            <span className="block text-slate-500">
              {t("file.documents", { done: required.length - company.missingDocuments.length, total: required.length })}
              {company.missingLegal.length > 0 ? ` · ${t("file.legalMissing")}` : ""}
            </span>
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold", STAGE_PILL[company.stage] ?? "bg-slate-100 text-slate-600")}>
          <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
          {t(`stage.${company.stage}`)}
        </span>
        {company.resubmitted && <span className="mt-1 block text-[11px] text-slate-500">{t("badges.resubmitted")}</span>}
      </td>
      <td className="px-4 py-3 text-right">
        <Link
          href={`/console/verifications/${company.id}`}
          className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-market-navy transition-colors hover:bg-slate-200"
        >
          {t(company.stage === "to_review" ? "review" : "open")}
          <ArrowRight className="h-3 w-3" aria-hidden />
        </Link>
      </td>
    </tr>
  );
}
