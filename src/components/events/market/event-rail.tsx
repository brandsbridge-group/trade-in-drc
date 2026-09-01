"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
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

const FIELD_CLS =
  "h-10 w-full rounded border border-slate-300 bg-white px-2.5 text-xs text-slate-800 outline-none transition-colors duration-150 placeholder:text-slate-400 focus:border-market-navy";

const WHY_KEYS = ["i1", "i2", "i3", "i4", "i5"] as const;

function RailLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1 block text-[11px] font-bold text-slate-800">
      {children} <span className="text-market-red">*</span>
    </label>
  );
}

/**
 * Events-hub right rail (design 13): the functional "Submit an Event" form
 * (writes a draft content_items row via server action), the "Why Use" benefits
 * panel, a popular-cities list, and a newsletter signup.
 */
export function EventRail({ sectorOptions }: { sectorOptions: SelectOption[] }) {
  const t = useTranslations("EventsHub.rail");
  const tType = useTranslations("EventsHub.eventTypes");
  const [pending, setPending] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const input = {
      eventName: String(fd.get("eventName") ?? ""),
      eventType: String(fd.get("eventType") ?? "") as (typeof EVENT_TYPES)[number],
      sectorId: String(fd.get("sectorId") ?? ""),
      date: String(fd.get("date") ?? ""),
      location: String(fd.get("location") ?? ""),
      organizer: String(fd.get("organizer") ?? ""),
      email: String(fd.get("email") ?? ""),
    };
    setPending(true);
    const id = toast.loading(t("submit.submitting"));
    const res = await submitEvent(input);
    setPending(false);
    if (res.ok) {
      toast.success(t("submit.success"), { id });
      formRef.current?.reset();
    } else {
      toast.error(res.error === "invalid" ? t("submit.invalid") : t("submit.error"), { id });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Submit an Event */}
      <section
        id="submit-event"
        className="scroll-mt-24 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
      >
        <div className="flex items-center gap-2 bg-market-navy px-4 py-3.5 text-white">
          <CalendarPlus className="h-5 w-5 text-market-gold" aria-hidden />
          <div>
            <h2 className="font-display text-base font-bold">{t("submit.title")}</h2>
            <p className="text-[11px] text-white/80">{t("submit.subtitle")}</p>
          </div>
        </div>
        <form ref={formRef} onSubmit={onSubmit} className="space-y-3 p-4">
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
            className="mt-1 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-market-red text-sm font-bold text-white transition-colors duration-150 hover:bg-market-red-dark disabled:opacity-60"
          >
            <Send className="h-4 w-4" aria-hidden />
            {t("submit.button")}
          </button>
        </form>
      </section>

      {/* Why Use */}
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-bold text-market-navy">
          <Star className="h-4 w-4 fill-market-gold text-market-gold" aria-hidden />
          {t("why.title")}
        </h2>
        <ul className="space-y-2.5">
          {WHY_KEYS.map((key) => (
            <li key={key} className="flex items-start gap-2 text-xs text-slate-700">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" strokeWidth={2.5} aria-hidden />
              {t(`why.${key}`)}
            </li>
          ))}
        </ul>
      </section>

      {/* Popular Cities */}
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-bold text-market-navy">
          <MapPin className="h-4 w-4 text-market-red" aria-hidden />
          {t("cities.title")}
        </h2>
        <ul className="divide-y divide-slate-100">
          {POPULAR_CITIES.map((city) => (
            <li key={city}>
              <Link
                href={`/events?location=${encodeURIComponent(city)}`}
                className="flex items-center justify-between py-2 text-sm text-slate-700 transition-colors duration-150 hover:text-market-navy"
              >
                <span className="inline-flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" aria-hidden />
                  {city}
                </span>
                <ChevronRight className="h-4 w-4 text-slate-400" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <NewsletterPanel />
    </div>
  );
}

function NewsletterPanel() {
  const t = useTranslations("EventsHub.rail.news");
  const [email, setEmail] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      setEmail("");
      toast.success(t("success"));
    }, 400);
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-2 flex items-center gap-2 font-display text-sm font-bold text-market-navy">
        <Mail className="h-4 w-4 text-market-red" aria-hidden />
        {t("title")}
      </h2>
      <p className="mb-3 text-xs text-slate-500">{t("body")}</p>
      <form onSubmit={onSubmit} className="space-y-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("placeholder")}
          className={FIELD_CLS}
        />
        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-10 w-full items-center justify-center rounded-md bg-market-red text-sm font-bold text-white transition-colors duration-150 hover:bg-market-red-dark disabled:opacity-60"
        >
          {t("subscribe")}
        </button>
      </form>
    </section>
  );
}
