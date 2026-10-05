import { getTranslations } from "next-intl/server";
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  CalendarClock,
  ExternalLink,
  FileDown,
  LifeBuoy,
  MapPin,
} from "lucide-react";

import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import type { Locale } from "@/config/locales";
import { pickLocalized } from "@/lib/i18n/pick-localized";
import type { NoticeRow } from "@/lib/opportunities/queries";
import { CATEGORY_DISPLAY, tabOfCategory } from "@/lib/opportunities/board-config";

const DAY_MS = 86_400_000;

/** Whole days left before a deadline (0 on the day itself), null when open-ended. */
function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / DAY_MS));
}

/** Type badge per board tab: tenders blue, partnership green, investment gold. */
const TAB_BADGE = {
  tenders: "bg-primary/10 text-primary",
  partnership: "bg-emerald-50 text-emerald-700",
  investment: "bg-market-or/15 text-market-or-dark",
} as const;

/** Deadline pill: red ≤ 7 days, amber ≤ 21, green beyond, grey when open-ended. */
function deadlineTone(days: number | null) {
  if (days === null) return "bg-slate-100 text-slate-600";
  if (days <= 7) return "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200";
  if (days <= 21) return "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200";
  return "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200";
}

const PRIMARY =
  "inline-flex items-center justify-center gap-1.5 rounded-xl bg-[var(--color-landing-navy)] px-4 py-2.5 text-[13px] font-bold text-white transition-colors duration-150 ease-out hover:bg-[#13244a]";
const SECONDARY =
  "inline-flex items-center justify-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-[13px] font-semibold text-[var(--color-landing-navy)] ring-1 ring-slate-200 transition-colors duration-150 ease-out hover:bg-slate-50";

/**
 * One notice: type + sector badges and a deadline countdown, the title and
 * issuer, four facts (estimate, province, dossier, source — the source is
 * always cited), then the three actions from the brief.
 */
export async function NoticeCard({
  notice: o,
  locale,
  sectorLabel,
  alertHref,
}: {
  notice: NoticeRow;
  locale: string;
  sectorLabel: string | null;
  alertHref: string | null;
}) {
  const t = await getTranslations("Notices.card");
  const tBadge = await getTranslations("Opportunities.badges");

  const tab = tabOfCategory(o.category);
  const title = pickLocalized(o, "title", locale as Locale);
  const summary = pickLocalized(o, "summary", locale as Locale);
  const days = daysUntil(o.deadline_at);
  const verified =
    o.company?.status === "verified" &&
    (o.company.verification_tier === "verified" || o.company.verification_tier === "premium");

  const dateFmt = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Kinshasa" });
  const money = new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 });
  const currency = o.budget_currency ?? "USD";
  const amount =
    o.budget_min && o.budget_max && o.budget_min !== o.budget_max
      ? `${money.format(o.budget_min)} – ${money.format(o.budget_max)} ${currency}`
      : o.budget_min || o.budget_max
        ? `${money.format((o.budget_max ?? o.budget_min) as number)} ${currency}`
        : null;
  const estimate = amount ? (tab === "investment" ? t("sought", { amount }) : amount) : null;
  const recorded = o.published_at ? dateFmt.format(new Date(o.published_at)) : null;
  const href = `/opportunities/${o.category}/${o.slug}`;

  const facts: { label: string; value: React.ReactNode }[] = [
    { label: t("facts.estimate"), value: estimate ?? <span className="text-slate-400">{t("undisclosed")}</span> },
    { label: t("facts.province"), value: o.region ?? <span className="text-slate-400">—</span> },
    {
      label: t("facts.documents"),
      value: o.document_url ? (
        <a
          href={o.document_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
        >
          <FileDown className="h-3.5 w-3.5" aria-hidden />
          {t("dossier")}
        </a>
      ) : (
        <span className="text-slate-500">{t("onRequest")}</span>
      ),
    },
    {
      label: t("facts.source"),
      value: o.source_url ? (
        <span>
          <a
            href={o.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
          >
            {o.source_name || t("originalNotice")}
            <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
          {recorded && <span className="text-slate-500"> · {t("recorded", { date: recorded })}</span>}
        </span>
      ) : (
        <span>
          {o.source_name || t("direct")}
          {recorded && <span className="text-slate-500"> · {recorded}</span>}
        </span>
      ),
    },
  ];

  return (
    <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70 transition-shadow duration-150 ease-out hover:shadow-md md:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[11px] font-bold",
            tab ? TAB_BADGE[tab] : "bg-slate-100 text-slate-600",
          )}
        >
          {tBadge(CATEGORY_DISPLAY[o.category].labelKey)}
        </span>
        {sectorLabel && (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
            {sectorLabel}
          </span>
        )}
        <span
          className={cn(
            "ml-auto inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold",
            deadlineTone(days),
          )}
        >
          <CalendarClock className="h-3.5 w-3.5" aria-hidden />
          {days === null ? t("openEnded") : t("closesIn", { days })}
        </span>
      </div>

      <h3 className="mt-4 font-display text-lg font-bold leading-snug text-[var(--color-landing-navy)] md:text-xl">
        <Link href={href} className="transition-colors duration-150 ease-out hover:text-primary">
          {title}
        </Link>
      </h3>
      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px] text-slate-500">
        <span className="inline-flex items-center gap-1 font-medium text-slate-700">
          {o.company?.name ?? t("issuerUnknown")}
          {verified && <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" aria-label={t("verified")} />}
        </span>
        {o.region && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" aria-hidden />
            {o.region}
          </span>
        )}
      </p>
      {summary && <p className="mt-2 line-clamp-2 max-w-3xl text-[13.5px] leading-relaxed text-slate-600">{summary}</p>}

      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-slate-100 pt-4 md:grid-cols-4">
        {facts.map((f) => (
          <div key={f.label} className="min-w-0">
            <dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">{f.label}</dt>
            <dd className="mt-1 text-[13.5px] font-medium leading-snug text-[var(--color-landing-navy)]">{f.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Link href={href} className={cn(PRIMARY, "group")}>
          {t("view")}
          <ArrowRight
            className="h-3.5 w-3.5 transition-transform duration-150 ease-out group-hover:translate-x-0.5"
            aria-hidden
          />
        </Link>
        {alertHref && (
          <Link href={alertHref} className={SECONDARY}>
            <Bell className="h-4 w-4" aria-hidden />
            {t("alert")}
          </Link>
        )}
        <Link href="/services" className={SECONDARY}>
          <LifeBuoy className="h-4 w-4" aria-hidden />
          {t("support")}
        </Link>
      </div>
    </article>
  );
}
