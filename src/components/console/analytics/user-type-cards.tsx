"use client";

import type { CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import { Building2, Globe2, ShieldCheck, UserRound } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { SERIES_COLOR } from "@/components/dashboard/overview/activity-chart";
import { OverviewCard } from "@/components/dashboard/overview/overview-card";
import {
  ACCOUNT_KINDS,
  SEGMENT_COMPARE_KEYS,
  type AccountKind,
  type ConsoleUserTypeMetrics,
  type TeamMember,
} from "@/lib/console/user-type-metrics";

const KIND_ICON: Record<AccountKind, LucideIcon> = {
  congolese: Building2,
  international: Globe2,
  none: UserRound,
  staff: ShieldCheck,
};

/* -------------------------------------------------------------------------- */
/* One tile per type of user                                                  */
/* -------------------------------------------------------------------------- */

/**
 * The four kinds of people on the platform. Company kinds lead with their
 * number of companies (what the marketplace shows); the two others lead with
 * their number of accounts.
 */
export function UserTypeTiles({ data }: { data: ConsoleUserTypeMetrics }) {
  const t = useTranslations("Admin.analytics.types");
  const format = useFormatter();
  const n = (value: number) => format.number(value);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {ACCOUNT_KINDS.map((kind) => {
        const Icon = KIND_ICON[kind];
        const account = data.accounts[kind];
        const segment = kind === "congolese" ? data.segments.drc : kind === "international" ? data.segments.intl : null;
        const added = segment ? segment.new_current : account.new_current;
        const rows: { key: string; label: string; value: string }[] = segment
          ? [
              { key: "owners", label: t("rows.owners"), value: n(segment.owners) },
              { key: "verified", label: t("rows.verified"), value: n(segment.funnel.verified) },
              { key: "premium", label: t("rows.premium"), value: n(segment.premium) },
            ]
          : [
              { key: "active", label: t("rows.active"), value: n(account.active) },
              { key: "confirmed", label: t("rows.confirmed"), value: n(account.confirmed) },
              { key: "new", label: t("rows.newAccounts"), value: n(account.new_current) },
            ];

        return (
          <article key={kind} className="flex min-w-0 flex-col rounded-2xl bg-white p-5 ring-1 ring-slate-200/70">
            <div className="flex items-start justify-between gap-2">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-market-navy text-market-or-light">
                <Icon className="h-[18px] w-[18px]" aria-hidden />
              </span>
              {added > 0 && (
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11.5px] font-semibold tabular-nums text-emerald-700">
                  {t("added", { count: added })}
                </span>
              )}
            </div>
            <h3 className="mt-4 text-[13px] font-medium text-slate-500">{t(`${kind}.label`)}</h3>
            <p className="mt-1 flex items-baseline gap-1.5">
              <span className="font-display text-[32px] font-semibold leading-none tracking-tight tabular-nums text-market-navy">
                {n(segment ? segment.companies : account.total)}
              </span>
              <span className="text-xs text-slate-500">{t(segment ? "unitCompanies" : "unitAccounts", { count: segment ? segment.companies : account.total })}</span>
            </p>
            <p className="mt-2 text-[12px] leading-snug text-slate-500">{t(`${kind}.hint`)}</p>
            <dl className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 text-[12.5px]">
              {rows.map((row) => (
                <div key={row.key} className="flex items-baseline justify-between gap-3">
                  <dt className="min-w-0 truncate text-slate-500">{row.label}</dt>
                  <dd className="shrink-0 font-semibold tabular-nums text-market-navy">{row.value}</dd>
                </div>
              ))}
            </dl>
          </article>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Congolese vs international companies                                       */
/* -------------------------------------------------------------------------- */

const HATCH = "repeating-linear-gradient(45deg, rgba(255,255,255,0.28) 0 3px, transparent 3px 7px)";
const SEGMENT_STYLE: Record<"drc" | "intl", CSSProperties> = {
  drc: { backgroundColor: SERIES_COLOR.blue },
  // Hatching is the second encoding, so the pair reads without colour.
  intl: { backgroundColor: SERIES_COLOR.gold, backgroundImage: HATCH },
};

/**
 * Same figure for the two kinds of companies, side by side. Each row has its
 * own scale (the larger of the two), because the figures are not comparable
 * with one another — only the two bars of a row are.
 */
export function SegmentCompare({ segments }: { segments: ConsoleUserTypeMetrics["segments"] }) {
  const t = useTranslations("Admin.analytics.compare");
  const format = useFormatter();
  const keys = ["drc", "intl"] as const;

  return (
    <OverviewCard
      id="console-stats-compare"
      title={t("title")}
      subtitle={t("subtitle")}
      aside={
        <ul className="flex flex-wrap gap-3 text-xs text-slate-600" aria-label={t("legend")}>
          {keys.map((key) => (
            <li key={key} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-[3px]" style={SEGMENT_STYLE[key]} aria-hidden />
              {t(`series.${key}`)}
            </li>
          ))}
        </ul>
      }
    >
      <ul className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2" aria-hidden>
        {SEGMENT_COMPARE_KEYS.map((metric) => {
          const max = Math.max(segments.drc[metric], segments.intl[metric], 1);
          return (
            <li key={metric} className="min-w-0">
              <p className="mb-1.5 truncate text-[13px] font-medium text-market-navy">{t(`metrics.${metric}`)}</p>
              {keys.map((key) => {
                const value = segments[key][metric];
                return (
                  <div key={key} className="mt-1 flex items-center gap-2">
                    <div className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-[4px] bg-slate-100">
                      <div
                        className="h-full rounded-[4px]"
                        style={{ ...SEGMENT_STYLE[key], width: `${Math.max(value > 0 ? 2 : 0, (value / max) * 100)}%` }}
                      />
                    </div>
                    <span className="w-12 shrink-0 text-right text-[12px] tabular-nums text-slate-600">{format.number(value)}</span>
                  </div>
                );
              })}
            </li>
          );
        })}
      </ul>

      {/* A table ignores `width: 1px`, so the hiding class goes on a wrapper: on the table itself it pushes phones sideways. */}
      <div className="sr-only">
        <table>
          <caption>{t("title")}</caption>
          <thead>
            <tr>
              <th scope="col">{t("metricHeader")}</th>
              {keys.map((key) => <th key={key} scope="col">{t(`series.${key}`)}</th>)}
            </tr>
          </thead>
          <tbody>
            {SEGMENT_COMPARE_KEYS.map((metric) => (
              <tr key={metric}>
                <th scope="row">{t(`metrics.${metric}`)}</th>
                {keys.map((key) => <td key={key}>{segments[key][metric]}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </OverviewCard>
  );
}

/* -------------------------------------------------------------------------- */
/* Team                                                                       */
/* -------------------------------------------------------------------------- */

/** What each staff member handled over the period. A moderator only receives their own row. */
export function TeamCard({ team, viewerRole }: { team: TeamMember[]; viewerRole: ConsoleUserTypeMetrics["viewer_role"] }) {
  const t = useTranslations("Admin.analytics.team");
  const format = useFormatter();

  return (
    <OverviewCard
      id="console-stats-team"
      title={t(viewerRole === "super_admin" ? "title" : "titleSelf")}
      subtitle={t(viewerRole === "super_admin" ? "subtitle" : "subtitleSelf")}
      className="h-full"
    >
      {team.length === 0 ? (
        <p className="rounded-xl bg-slate-50 px-4 py-5 text-xs text-slate-500">{t("empty")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[460px] text-left text-[13px]">
            <thead>
              <tr className="text-[11.5px] text-slate-500">
                <th scope="col" className="rounded-l-xl bg-slate-50 px-3 py-2.5 font-medium">{t("member")}</th>
                <th scope="col" className="bg-slate-50 px-3 py-2.5 text-right font-medium">{t("decisions")}</th>
                <th scope="col" className="bg-slate-50 px-3 py-2.5 text-right font-medium">{t("forwarded")}</th>
                <th scope="col" className="rounded-r-xl bg-slate-50 px-3 py-2.5 text-right font-medium">{t("lastAction")}</th>
              </tr>
            </thead>
            <tbody>
              {team.map((member) => (
                <tr key={member.id} className="border-b border-slate-100 last:border-0">
                  <th scope="row" className="px-3 py-3 font-normal">
                    <span className="flex items-center gap-2">
                      <span className="truncate font-medium text-market-navy">{member.name || t("unnamed")}</span>
                      {member.is_self && (
                        <span className="rounded-full bg-market-navy px-1.5 py-0.5 text-[10.5px] font-semibold text-white">{t("you")}</span>
                      )}
                    </span>
                    <span className="flex items-center gap-1.5 text-[11.5px] text-slate-500">
                      <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", member.role === "super_admin" ? "bg-market-or" : "bg-slate-400")} />
                      {t(`roles.${member.role}`)}
                    </span>
                  </th>
                  <td className="px-3 py-3 text-right tabular-nums text-slate-700">
                    {format.number(member.decisions)}
                    {member.decisions > 0 && (
                      <span className="block text-[11.5px] text-slate-500">{t("approved", { count: member.approved })}</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-slate-700">{format.number(member.forwarded)}</td>
                  <td className="px-3 py-3 text-right text-slate-600">
                    {member.last_action_at
                      ? format.dateTime(new Date(member.last_action_at), { day: "numeric", month: "short", year: "numeric" })
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </OverviewCard>
  );
}
