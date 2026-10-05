"use client";

import * as React from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarClock,
  Copy,
  Handshake,
  Inbox,
  Mail,
  MapPin,
  Package,
  Phone,
  Scale,
  Search,
  ShieldCheck,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { personInitials } from "@/lib/requests/views";
import {
  RECEIVED_VIEWS,
  filterReceivedRequests,
  productLabel,
  receivedViewCounts,
  replyMailto,
  requestKind,
  type ReceivedRequest,
  type ReceivedView,
} from "@/lib/dashboard/received-requests";

const CARD = "rounded-2xl bg-white ring-1 ring-slate-200/70";
const EYEBROW = "text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400";

/** What a request is about, in one line: the product, or the relationship sought. */
function useRequestTitle() {
  const t = useTranslations("ReceivedRequests");
  const tInterest = useTranslations("CompanyProfile.contact.interestOptions");
  const locale = useLocale();
  return (request: ReceivedRequest): string => {
    if (requestKind(request) === "quote") return productLabel(request, locale) ?? t("card.productRemoved");
    if (!request.interest) return t("kind.contact");
    const interest = tInterest.has(request.interest) ? tInterest(request.interest) : request.interest;
    return t("card.interestTitle", { interest });
  };
}

interface RequestInboxProps {
  requests: ReceivedRequest[];
  /** Requests that were unopened when the page loaded: they keep their "New" tag for the visit. */
  newIds: ReadonlySet<string>;
  /** Name the company on each request (the user owns several). */
  showCompany: boolean;
}

/**
 * The company's request inbox, laid out like a mail client: tabs and search on
 * top, the list on the left, the selected request on the right. On a phone the
 * two panes stack — the list first, then the request with a way back.
 */
export function RequestInbox({ requests, newIds, showCompany }: RequestInboxProps) {
  const t = useTranslations("ReceivedRequests");
  const titleOf = useRequestTitle();

  const [view, setView] = React.useState<ReceivedView>("all");
  const [query, setQuery] = React.useState("");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  // Phones show one pane at a time; wide screens always show both.
  const [readingOnPhone, setReadingOnPhone] = React.useState(false);

  const counts = React.useMemo(() => receivedViewCounts(requests, newIds), [requests, newIds]);
  const filtered = React.useMemo(
    () => filterReceivedRequests(requests, { view, query, newIds }),
    [requests, view, query, newIds]
  );
  const selected = filtered.find((r) => r.id === selectedId) ?? filtered[0] ?? null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label={t("views.label")} className="inline-flex max-w-full flex-wrap gap-0.5 rounded-xl bg-slate-200/70 p-1">
          {RECEIVED_VIEWS.map((v) => {
            const active = view === v;
            return (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setView(v)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] transition-colors",
                  active ? "bg-white font-semibold text-market-navy ring-1 ring-slate-200" : "text-slate-600 hover:text-market-navy"
                )}
              >
                {t(`views.${v}`)}
                <span
                  className={cn(
                    "min-w-5 rounded-full px-1.5 text-center text-[11px] font-semibold tabular-nums leading-5",
                    v === "new" && counts.new > 0
                      ? "bg-blue-100 text-blue-700"
                      : active ? "bg-slate-100 text-market-navy" : "bg-slate-300/50 text-slate-600"
                  )}
                >
                  {counts[v]}
                </span>
              </button>
            );
          })}
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchPlaceholder")}
            className="h-10 w-full rounded-full bg-white pl-10 pr-4 text-[13px] text-market-navy outline-none ring-1 ring-slate-200/70 transition-colors placeholder:text-slate-400 focus:ring-2 focus:ring-market-navy/25"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className={cn(CARD, "flex flex-col items-center px-6 py-12 text-center")}>
          <span className="grid h-11 w-11 place-items-center rounded-full bg-slate-100 text-slate-500" aria-hidden>
            <Inbox className="h-5 w-5" />
          </span>
          <p className="mt-3 text-sm font-medium text-market-navy">{t("noMatch")}</p>
          <button
            type="button"
            onClick={() => {
              setView("all");
              setQuery("");
            }}
            className="mt-2 text-xs font-medium text-slate-500 underline-offset-2 transition-colors hover:text-market-navy hover:underline"
          >
            {t("clear")}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-[380px_minmax(0,1fr)]">
          <section
            aria-label={t("title")}
            className={cn(CARD, "min-w-0 p-2 lg:sticky lg:top-4 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto", readingOnPhone && "hidden lg:block")}
          >
            <ul className="space-y-0.5">
              {filtered.map((request) => (
                <li key={request.id}>
                  <RequestListItem
                    request={request}
                    title={titleOf(request)}
                    isNew={newIds.has(request.id)}
                    selected={selected?.id === request.id}
                    onSelect={() => {
                      setSelectedId(request.id);
                      setReadingOnPhone(true);
                    }}
                  />
                </li>
              ))}
            </ul>
          </section>

          {selected && (
            <div className={cn("min-w-0", !readingOnPhone && "hidden lg:block")}>
              <RequestDetail
                request={selected}
                title={titleOf(selected)}
                isNew={newIds.has(selected.id)}
                showCompany={showCompany}
                onBack={() => setReadingOnPhone(false)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RequestListItem({
  request,
  title,
  isNew,
  selected,
  onSelect,
}: {
  request: ReceivedRequest;
  title: string;
  isNew: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  const t = useTranslations("ReceivedRequests");
  const format = useFormatter();
  const origin = [request.company_name, request.country].filter(Boolean).join(" · ");

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected ? "true" : undefined}
      className={cn(
        "flex w-full min-w-0 items-start gap-3 rounded-xl p-3 text-left transition-colors",
        selected ? "bg-slate-100" : "hover:bg-slate-50"
      )}
    >
      <span
        className={cn(
          "grid h-10 w-10 shrink-0 place-items-center rounded-full text-xs font-semibold",
          selected ? "bg-market-navy text-market-or-light" : "bg-slate-100 text-market-navy"
        )}
        aria-hidden
      >
        {personInitials(request.full_name)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className={cn("truncate text-[13.5px] text-market-navy", isNew ? "font-bold" : "font-semibold")}>{request.full_name}</span>
          <span className="shrink-0 text-[11px] tabular-nums text-slate-400">
            {format.dateTime(new Date(request.forwarded_at), { day: "numeric", month: "short" })}
          </span>
        </span>
        <span className="mt-0.5 block truncate text-[13px] text-slate-700">{title}</span>
        <span className="mt-0.5 flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-xs text-slate-500">{request.message || origin || request.email}</span>
          {isNew && (
            <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-blue-700">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" aria-hidden />
              {t("card.new")}
            </span>
          )}
        </span>
      </span>
    </button>
  );
}

function Fact({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-start gap-2.5 rounded-xl bg-slate-50 p-3">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-market-navy ring-1 ring-slate-200/70" aria-hidden>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <dt className="text-[11px] text-slate-400">{label}</dt>
        <dd className="break-words text-[13.5px] font-semibold text-market-navy">{value}</dd>
      </div>
    </div>
  );
}

function RequestDetail({
  request,
  title,
  isNew,
  showCompany,
  onBack,
}: {
  request: ReceivedRequest;
  title: string;
  isNew: boolean;
  showCompany: boolean;
  onBack: () => void;
}) {
  const t = useTranslations("ReceivedRequests");
  const format = useFormatter();

  const kind = requestKind(request);
  const KindIcon = kind === "quote" ? Package : Handshake;
  const origin = [request.company_name, request.country].filter(Boolean).join(" · ");
  const subject = t("mailSubject", { reference: request.reference ?? "", subject: title });
  const hasFacts = request.quantity || request.preferred_location || request.timeline;

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(request.email);
      toast.success(t("detail.emailCopied"));
    } catch {
      toast.error(t("detail.copyFailed"));
    }
  };

  return (
    <article className={cn(CARD, "overflow-hidden")}>
      <header className="border-b border-slate-100 p-5">
        <button
          type="button"
          onClick={onBack}
          className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-market-navy transition-colors hover:bg-slate-200 lg:hidden"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          {t("detail.back")}
        </button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-market-navy font-display text-sm font-semibold text-market-or-light" aria-hidden>
              {personInitials(request.full_name)}
            </span>
            <div className="min-w-0">
              <p className={EYEBROW}>{t("card.buyer")}</p>
              <h2 className="break-words font-display text-lg font-semibold leading-snug text-market-navy">{request.full_name}</h2>
              {origin && <p className="break-words text-[13px] text-slate-500">{origin}</p>}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={replyMailto(request.email, subject)}
              className="inline-flex items-center gap-2 rounded-full bg-market-navy px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-market-navy-deep"
            >
              <Mail className="h-4 w-4" aria-hidden />
              {t("card.reply")}
            </a>
            {request.phone && (
              <a
                href={`tel:${request.phone.replace(/\s+/g, "")}`}
                className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-semibold text-market-navy ring-1 ring-slate-200 transition-colors hover:bg-slate-50"
              >
                <Phone className="h-4 w-4" aria-hidden />
                {t("detail.call")}
              </a>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-market-navy">{t(`kind.${kind}`)}</span>
          {isNew && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 font-semibold text-blue-700">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" aria-hidden />
              {t("card.new")}
            </span>
          )}
          <span className="text-slate-500">
            {t("card.receivedOn", { date: format.dateTime(new Date(request.forwarded_at), { dateStyle: "long" }) })}
          </span>
          {request.reference && <span className="tabular-nums text-slate-400">{request.reference}</span>}
        </div>
      </header>

      <div className="space-y-5 p-5">
        <section>
          <h3 className={EYEBROW}>{t("detail.request")}</h3>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-market-cream text-market-navy" aria-hidden>
                <KindIcon className="h-[18px] w-[18px]" />
              </span>
              <div className="min-w-0">
                <p className="break-words font-display text-[17px] font-semibold leading-snug text-market-navy">{title}</p>
                {showCompany && <p className="text-xs text-slate-500">{t("card.forCompany", { company: request.target_company_name })}</p>}
              </div>
            </div>
            {kind === "quote" && request.product_id && (
              <Link
                href={`${ROUTES.DASHBOARD_PRODUCTS}/${request.product_id}`}
                className="inline-flex items-center gap-1 text-[13px] font-semibold text-market-navy underline-offset-2 transition-colors hover:text-market-or-dark hover:underline"
              >
                {t("detail.viewProduct")}
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            )}
          </div>

          {hasFacts && (
            <dl className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {request.quantity && <Fact icon={Scale} label={t("card.quantity")} value={request.quantity} />}
              {request.preferred_location && <Fact icon={MapPin} label={t("card.deliveryPlace")} value={request.preferred_location} />}
              {request.timeline && <Fact icon={CalendarClock} label={t("card.deadline")} value={request.timeline} />}
            </dl>
          )}
        </section>

        <section>
          <h3 className={EYEBROW}>{t("card.message")}</h3>
          <p className="mt-2 whitespace-pre-wrap break-words rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
            {request.message || <span className="text-slate-400">{t("card.noMessage")}</span>}
          </p>
        </section>

        <section>
          <h3 className={EYEBROW}>{t("detail.contact")}</h3>
          <ul className="mt-2 divide-y divide-slate-100 rounded-xl ring-1 ring-slate-200/70">
            <li className="flex items-center gap-3 p-3">
              <Mail className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
              <a href={`mailto:${request.email}`} className="min-w-0 flex-1 truncate text-sm font-medium text-market-navy underline-offset-2 hover:underline">
                {request.email}
              </a>
              <button
                type="button"
                onClick={copyEmail}
                aria-label={t("detail.copyEmail")}
                title={t("detail.copyEmail")}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-market-navy"
              >
                <Copy className="h-4 w-4" aria-hidden />
              </button>
            </li>
            {request.phone && (
              <li className="flex items-center gap-3 p-3">
                <Phone className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                <a href={`tel:${request.phone.replace(/\s+/g, "")}`} className="min-w-0 flex-1 truncate text-sm font-medium text-market-navy underline-offset-2 hover:underline">
                  {request.phone}
                </a>
              </li>
            )}
          </ul>
        </section>
      </div>

      <footer className="flex items-center gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3 text-xs text-slate-500">
        <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
        {t("detail.checked")}
      </footer>
    </article>
  );
}
