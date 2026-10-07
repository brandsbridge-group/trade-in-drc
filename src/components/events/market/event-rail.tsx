"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Link } from "@/i18n/routing";
import {
  CalendarPlus,
  Star,
  Check,
  MapPin,
  ChevronRight,
  Mail,
  Send,
} from "lucide-react";
import { submitEvent } from "./submit-event-actions";
import { EVENT_TYPES, POPULAR_CITIES } from "./event-constants";
import type { SelectOption } from "./hero-search";
import { subscribeToNewsletter } from "@/lib/newsletter/actions";

const FIELD_CLS =
  "h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-800 outline-none transition-colors duration-150 placeholder:text-slate-400 hover:border-slate-300 focus:border-market-navy focus:bg-white focus:ring-2 focus:ring-market-navy/10";

const WHY_KEYS = ["i1", "i2", "i3", "i4", "i5"] as const;

function RailLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1 block text-[11px] font-bold text-slate-800">
      {children} <span className="text-market-or-dark">*</span>
    </label>
  );
}

/**
 * Events-hub right rail: the functional "Submit an Event" form (writes a draft
 * content_items row via server action).
 */
export function EventRail({ sectorOptions }: { sectorOptions: SelectOption[] }) {
  const t = useTranslations("EventsHub.rail");
  const tType = useTranslations("EventsHub.eventTypes");
  const locale: "en" | "fr" = useLocale() === "fr" ? "fr" : "en";
  const [pending, setPending] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const input = {
      eventName: String(fd.get("eventName") ?? ""),
      eventType: String(fd.get("eventType") ?? "") as (typeof EVENT_TYPES)[number],
      eventTypeLabel: tType(String(fd.get("eventType") ?? "")),
      locale,
      sectorId: String(fd.get("sectorId") ?? ""),
      date: String(fd.get("date") ?? ""),
      location: String(fd.get("location") ?? ""),
      organizer: String(fd.get("organizer") ?? ""),
      email: String(fd.get("email") ?? ""),
    };
    setPending(true);
    const id = toast.loading(t("submit.submitting"));
    try {
      const res = await submitEvent(input);
      if (res.ok) {
        toast.success(res.notificationSent === false ? t("submit.savedEmailFailed") : t("submit.success"), { id });
        formRef.current?.reset();
      } else {
        toast.error(res.error === "invalid" ? t("submit.invalid") : t("submit.error"), { id });
      }
    } catch {
      toast.error(t("submit.error"), { id });
    } finally {
      setPending(false);
    }
  };

  return (
    <section
        id="submit-event"
        className="scroll-mt-24 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_18px_42px_-30px_rgba(15,23,42,0.65)]"
      >
        <div className="flex items-center gap-3 bg-[linear-gradient(135deg,#0d1d38_0%,#153b6d_100%)] px-4 py-4 text-white">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/10 text-market-or">
            <CalendarPlus className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h2 className="font-display text-base font-bold">{t("submit.title")}</h2>
            <p className="text-[11px] text-white/80">{t("submit.subtitle")}</p>
          </div>
        </div>
        <form ref={formRef} onSubmit={onSubmit} className="space-y-3.5 p-4">
          <div>
            <RailLabel>{t("submit.name")}</RailLabel>
            <input name="eventName" required minLength={2} placeholder={t("submit.namePh")} className={FIELD_CLS} />
          </div>
          <div>
            <RailLabel>{t("submit.type")}</RailLabel>
            <select name="eventType" required defaultValue="" className={FIELD_CLS}>
              <option value="" disabled>
                {t("submit.typePh")}
              </option>
              {EVENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {tType(type)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold text-slate-800">{t("submit.sector")}</label>
            <select name="sectorId" defaultValue="" className={FIELD_CLS}>
              <option value="">{t("submit.sectorPh")}</option>
              {sectorOptions.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <RailLabel>{t("submit.date")}</RailLabel>
            <input name="date" type="date" required className={FIELD_CLS} />
          </div>
          <div>
            <RailLabel>{t("submit.location")}</RailLabel>
            <input name="location" required minLength={2} placeholder={t("submit.locationPh")} className={FIELD_CLS} />
          </div>
          <div>
            <RailLabel>{t("submit.organizer")}</RailLabel>
            <input name="organizer" required minLength={2} placeholder={t("submit.organizerPh")} className={FIELD_CLS} />
          </div>
          <div>
            <RailLabel>{t("submit.email")}</RailLabel>
            <input name="email" type="email" required placeholder={t("submit.emailPh")} className={FIELD_CLS} />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="mt-1 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-market-or text-sm font-bold text-market-navy shadow-sm transition-colors duration-150 hover:bg-market-or-light disabled:opacity-60"
          >
            <Send className="h-4 w-4" aria-hidden />
            {t("submit.button")}
          </button>
        </form>
      </section>
  );
}

export function EventInfoSections() {
  const t = useTranslations("EventsHub.rail");

  return (
    <section className="mt-8 space-y-5" aria-label={t("why.title")}>
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_16px_38px_-30px_rgba(15,23,42,0.58)] md:p-6">
        <h2 className="mb-4 flex items-center gap-2.5 font-display text-lg font-bold text-market-navy">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-market-or/20 text-market-navy">
            <Star className="h-4 w-4 fill-market-or text-market-or" aria-hidden />
          </span>
          {t("why.title")}
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {WHY_KEYS.map((key) => (
            <li key={key} className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 text-sm leading-relaxed text-slate-700">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" strokeWidth={2.5} aria-hidden />
              {t(`why.${key}`)}
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-5 lg:grid-cols-12">
        <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_16px_38px_-30px_rgba(15,23,42,0.58)] md:p-6 lg:col-span-5">
          <h2 className="mb-4 flex items-center gap-2.5 font-display text-lg font-bold text-market-navy">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-market-or/15 text-market-or-dark">
              <MapPin className="h-4 w-4" aria-hidden />
            </span>
            {t("cities.title")}
          </h2>
          <ul className="grid grid-cols-2 gap-2">
            {POPULAR_CITIES.map((city) => (
              <li key={city}>
                <Link
                  href={`/events?location=${encodeURIComponent(city)}`}
                  className="group flex min-h-11 items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-sm font-medium text-slate-700 transition-colors duration-150 hover:border-market-navy/25 hover:bg-market-navy/[0.04] hover:text-market-navy"
                >
                  <span className="inline-flex min-w-0 items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400 transition-colors group-hover:text-market-or-dark" aria-hidden />
                    <span className="truncate">{city}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-market-navy" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <NewsletterPanel />
      </div>
    </section>
  );
}

function NewsletterPanel() {
  const t = useTranslations("EventsHub.rail.news");
  const [email, setEmail] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [consent, setConsent] = React.useState(false);

  const locale: "en" | "fr" = useLocale() === "fr" ? "fr" : "en";

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    try {
      const result = await subscribeToNewsletter({ email, locale, consent });
      if (!result.ok) {
        toast.error(t("error"));
        return;
      }
      setEmail("");
      toast.success(result.alreadySubscribed ? t("alreadySubscribed") : t("success"));
    } catch {
      toast.error(t("error"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-[linear-gradient(135deg,#ffffff_0%,#f7f9fc_100%)] p-5 shadow-[0_16px_38px_-30px_rgba(15,23,42,0.58)] md:p-6 lg:col-span-7">
      <div className="flex h-full flex-col justify-center">
        <div className="mb-3 inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
          <Mail className="h-3.5 w-3.5 text-market-or-dark" aria-hidden />
          Newsletter
        </div>

        <h2 className="mb-2 font-display text-lg font-bold text-market-navy">{t("title")}</h2>
        <p className="mb-4 max-w-xl text-sm leading-relaxed text-slate-500">{t("body")}</p>

        <form onSubmit={onSubmit} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("placeholder")}
            className={`${FIELD_CLS} h-11 text-sm`}
          />
          <button
            type="submit"
            disabled={busy || !consent}
            className="inline-flex h-11 items-center justify-center whitespace-nowrap rounded-lg bg-market-or px-5 text-sm font-bold text-market-navy transition-colors duration-150 hover:bg-market-or-light disabled:opacity-60"
          >
            {t("subscribe")}
          </button>
          <label className="flex items-start gap-2 text-xs leading-relaxed text-slate-500 sm:col-span-2">
            <input
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
              className="mt-0.5 accent-market-or"
            />
            <span>{t("consent")}</span>
          </label>
        </form>
      </div>
    </section>
  );
}
