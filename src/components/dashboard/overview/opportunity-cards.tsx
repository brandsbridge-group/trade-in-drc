"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import { CalendarClock, MapPin } from "lucide-react";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import type { OpportunityStatus } from "@/lib/opportunities/types";
import type { MyOpportunities, Recommendations } from "@/lib/dashboard/overview/queries";
import { EmptyHint, OverviewCard } from "./overview-card";

/** Status = dot + label (never colour alone), as in the reference tables. */
const STATUS_DOT: Record<OpportunityStatus, { dot: string; text: string }> = {
  published: { dot: "bg-emerald-500", text: "text-emerald-700" },
  pending_review: { dot: "bg-amber-500", text: "text-amber-700" },
  rejected: { dot: "bg-red-500", text: "text-red-700" },
  draft: { dot: "bg-slate-400", text: "text-slate-600" },
  expired: { dot: "bg-slate-300", text: "text-slate-500" },
};

const SUMMARY_STATUSES: OpportunityStatus[] = ["published", "pending_review", "rejected"];

const TH = "bg-slate-50 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 first:rounded-l-lg last:rounded-r-lg";
const TD = "px-3 py-3 align-middle";

function StatusDot({ status, label }: { status: OpportunityStatus; label: string }) {
  const s = STATUS_DOT[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap text-[12px] font-medium", s.text)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} aria-hidden />
      {label}
    </span>
  );
}

interface MyOpportunitiesCardProps {
  data: MyOpportunities;
  /** "offers" for a Congolese seller, "requests" for an international buyer. */
  wording: "offers" | "requests";
  /** Narrow side column: a compact list instead of the table. */
  compact?: boolean;
}

export function MyOpportunitiesCard({ data, wording, compact = false }: MyOpportunitiesCardProps) {
  const t = useTranslations("DashboardOverview");
  const format = useFormatter();
  const locale = useLocale();
  const title = (o: { title_en: string; title_fr: string }) => (locale === "fr" ? o.title_fr : o.title_en) || o.title_en;
  const date = (iso: string | null) => (iso ? format.dateTime(new Date(iso), { day: "numeric", month: "short" }) : "—");

  const responses = (o: MyOpportunities["items"][number]) =>
    o.status === "rejected" ? (
      <Link href={`/dashboard/opportunities/${o.id}`} className="text-[12px] font-semibold text-primary hover:underline">
        {t("myOpportunities.fix")}
      </Link>
    ) : o.status === "published" ? (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
        <span className="font-semibold tabular-nums text-market-navy">{o.responses}</span>
        {o.newResponses > 0 && (
          <span className="rounded-full bg-market-cream px-1.5 text-[10.5px] font-semibold text-market-or-dark">
            {t("myOpportunities.new", { count: o.newResponses })}
          </span>
        )}
      </span>
    ) : (
      <span className="text-slate-300">—</span>
    );

  return (
    <OverviewCard
      id="overview-my-opportunities"
      title={t(`myOpportunities.title.${wording}`)}
      aside={
        data.total > 0 && (
          <ul className="flex flex-wrap gap-1" aria-label={t("myOpportunities.summaryLabel")}>
            <li className="rounded-full bg-market-navy px-2.5 py-1 text-[11px] font-medium text-white">
              {t("myOpportunities.all", { count: data.total })}
            </li>
            {SUMMARY_STATUSES.filter((s) => data.countByStatus[s]).map((s) => (
              <li key={s} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                {t(`myOpportunities.summary.${s}`, { count: data.countByStatus[s] ?? 0 })}
              </li>
            ))}
          </ul>
        )
      }
      footerLink={data.total > 0 ? { href: "/dashboard/opportunities", label: t("myOpportunities.seeAll") } : undefined}
    >
      {data.items.length === 0 ? (
        <EmptyHint
          text={t(`myOpportunities.empty.${wording}`)}
          cta={{ href: "/dashboard/opportunities/new", label: t(`myOpportunities.emptyCta.${wording}`) }}
        />
      ) : compact ? (
        <ul className="-mx-2">
          {data.items.map((o) => (
            <li key={o.id} className="flex items-start justify-between gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-slate-50">
              <div className="min-w-0">
                <Link href={`/dashboard/opportunities/${o.id}`} className="block truncate text-[13px] font-medium text-market-navy hover:underline">
                  {title(o)}
                </Link>
                <StatusDot status={o.status} label={t(`status.${o.status}`)} />
              </div>
              <div className="shrink-0 pt-0.5 text-[12px]">{responses(o)}</div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="-mx-1 overflow-x-auto">
          <table className="w-full border-separate border-spacing-0 text-[13px]">
            <thead>
              <tr>
                <th className={TH}>{t("myOpportunities.colTitle")}</th>
                <th className={TH}>{t("myOpportunities.colStatus")}</th>
                <th className={cn(TH, "hidden sm:table-cell")}>{t("myOpportunities.colResponses")}</th>
                <th className={cn(TH, "hidden md:table-cell")}>{t("myOpportunities.colDate")}</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((o) => (
                <tr key={o.id} className="transition-colors hover:bg-slate-50 [&>td]:border-b [&>td]:border-slate-100 last:[&>td]:border-0">
                  <td className={TD}>
                    <Link href={`/dashboard/opportunities/${o.id}`} className="font-medium text-market-navy hover:underline">
                      {title(o)}
                    </Link>
                    {o.status === "rejected" && o.rejected_reason && (
                      <p className="mt-0.5 text-[11.5px] text-red-600">{t("myOpportunities.reason", { reason: o.rejected_reason })}</p>
                    )}
                  </td>
                  <td className={TD}><StatusDot status={o.status} label={t(`status.${o.status}`)} /></td>
                  <td className={cn(TD, "hidden sm:table-cell")}>{responses(o)}</td>
                  <td className={cn(TD, "hidden whitespace-nowrap text-slate-500 md:table-cell")}>{date(o.published_at ?? o.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </OverviewCard>
  );
}

interface RecommendedCardProps {
  data: Recommendations;
  sectorLabel: string | null;
  provinces: string[];
  /** Wide table for international buyers (main column), compact list otherwise. */
  layout: "list" | "table";
}

export function RecommendedOpportunitiesCard({ data, sectorLabel, provinces, layout }: RecommendedCardProps) {
  const t = useTranslations("DashboardOverview");
  const tCat = useTranslations("Opportunities.categories");
  const format = useFormatter();
  const locale = useLocale();
  const title = (o: { title_en: string; title_fr: string }) => (locale === "fr" ? o.title_fr : o.title_en) || o.title_en;
  const shortDate = (iso: string) => format.dateTime(new Date(iso), { day: "numeric", month: "short" });
  const deadline = (iso: string | null) => (iso ? t("recommended.closes", { date: shortDate(iso) }) : t("recommended.noDeadline"));
  const category = (c: string) => (tCat.has(c) ? tCat(c) : c);
  const href = (o: { category: string; slug: string }) => `/opportunities/${o.category}/${o.slug}`;

  return (
    <OverviewCard
      id="overview-recommended"
      title={t(layout === "table" ? "recommended.titleDrc" : "recommended.title")}
      subtitle={sectorLabel ? t("recommended.subtitle", { sector: sectorLabel }) : undefined}
      aside={
        layout === "table" && provinces.length > 0 ? (
          <ul className="flex flex-wrap gap-1" aria-label={t("recommended.provincesLabel")}>
            {provinces.slice(0, 4).map((p) => (
              <li key={p} className="rounded-full bg-market-navy px-2.5 py-1 text-[11px] font-medium text-white">{p}</li>
            ))}
          </ul>
        ) : undefined
      }
      footerLink={data.total > 0 ? { href: "/opportunities", label: t("recommended.seeAll", { count: data.total }) } : undefined}
    >
      {data.items.length === 0 ? (
        <EmptyHint text={t("recommended.empty")} cta={{ href: "/opportunities", label: t("recommended.browse") }} />
      ) : layout === "table" ? (
        <div className="-mx-1 overflow-x-auto">
          <table className="w-full border-separate border-spacing-0 text-[13px]">
            <thead>
              <tr>
                <th className={TH}>{t("recommended.colTitle")}</th>
                <th className={cn(TH, "hidden md:table-cell")}>{t("recommended.colType")}</th>
                <th className={cn(TH, "hidden sm:table-cell")}>{t("recommended.colProvince")}</th>
                <th className={TH}>{t("recommended.colDeadline")}</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((o) => (
                <tr key={o.id} className="transition-colors hover:bg-slate-50 [&>td]:border-b [&>td]:border-slate-100 last:[&>td]:border-0">
                  <td className={TD}>
                    <Link href={href(o)} className="font-medium text-market-navy hover:underline">{title(o)}</Link>
                  </td>
                  <td className={cn(TD, "hidden text-slate-600 md:table-cell")}>{category(o.category)}</td>
                  <td className={cn(TD, "hidden text-slate-600 sm:table-cell")}>{o.region ?? "—"}</td>
                  <td className={cn(TD, "whitespace-nowrap text-slate-500")}>{o.deadline_at ? shortDate(o.deadline_at) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <ul className="-mx-2">
          {data.items.map((o) => (
            <li key={o.id} className="flex items-start gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-slate-50">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-market-cream text-market-or-dark">
                <CalendarClock className="h-4 w-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <Link href={href(o)} className="line-clamp-2 text-[13px] font-medium leading-snug text-market-navy hover:underline">
                  {title(o)}
                </Link>
                <p className="mt-0.5 flex items-center gap-1 truncate text-[11.5px] text-slate-500">
                  <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                  {[o.region, category(o.category)].filter(Boolean).join(" · ")}
                </p>
              </div>
              <span className="shrink-0 whitespace-nowrap rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                {deadline(o.deadline_at)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </OverviewCard>
  );
}
