"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, CheckCircle2, Loader2, Megaphone, Send } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Locale } from "@/config/locales";
import { submitNotice, subscribeToAlerts } from "./notices-actions";

const FIELD =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 transition-[border-color,box-shadow] duration-150 ease-out placeholder:text-slate-400 focus:border-primary/60 focus:outline-none focus:ring-4 focus:ring-primary/10";
const LABEL = "mb-1.5 block text-xs font-semibold text-slate-700";

/**
 * Weekly alerts form: e-mail + followed sectors as toggle chips. Arriving from
 * a card's "Get alerts for this sector", that sector is pre-selected.
 */
export function AlertsForm({
  sectors,
  preselected,
}: {
  sectors: { id: string; label: string }[];
  preselected: string[];
}) {
  const t = useTranslations("Notices.alerts");
  const locale = useLocale() as Locale;
  const [picked, setPicked] = useState<Set<string>>(() => new Set(preselected));
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "done" | "invalid" | "error">("idle");

  const toggle = (id: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") ?? "");
    startTransition(async () => {
      const res = await subscribeToAlerts({ email, sectorIds: [...picked], locale });
      setStatus(res.ok ? "done" : res.error === "invalid" ? "invalid" : "error");
    });
  }

  if (status === "done") {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center" role="status">
        <CheckCircle2 className="h-10 w-10 text-emerald-600" aria-hidden />
        <p className="font-display text-lg font-bold text-[var(--color-landing-navy)]">{t("successTitle")}</p>
        <p className="max-w-xs text-sm text-slate-600">
          {t("successBody", { count: picked.size })}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="alerts-email" className={LABEL}>
          {t("email")}
        </label>
        <input
          id="alerts-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder={t("emailPh")}
          className={FIELD}
        />
      </div>
      <fieldset>
        <legend className={LABEL}>
          {t("sectors")} <span className="font-normal text-slate-400">· {t("sectorsHint")}</span>
        </legend>
        <div className="flex flex-wrap gap-1.5">
          {sectors.map((s) => {
            const on = picked.has(s.id);
            return (
              <button
                key={s.id}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(s.id)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition-colors duration-150 ease-out",
                  on
                    ? "bg-[var(--color-landing-navy)] text-white ring-[var(--color-landing-navy)]"
                    : "bg-white text-slate-600 ring-slate-200 hover:ring-slate-300",
                )}
              >
                {on && <Check className="h-3 w-3" aria-hidden />}
                {s.label}
              </button>
            );
          })}
        </div>
      </fieldset>
      {(status === "invalid" || status === "error") && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {t(status === "invalid" ? "invalid" : "error")}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-market-or px-4 py-3 text-sm font-bold text-market-navy transition-colors duration-150 ease-out hover:bg-market-or-light disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
        {t("submit")}
      </button>
      <p className="text-center text-[11px] text-slate-400">{t("legal")}</p>
    </form>
  );
}

/** "Submit a notice" — gold button opening a short, account-free form. */
export function SubmitNoticeDialog() {
  const t = useTranslations("Notices.submit");
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null | undefined>(undefined);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? "");
    setError(null);
    startTransition(async () => {
      const res = await submitNotice({
        organisation: get("organisation"),
        email: get("email"),
        title: get("title"),
        link: get("link"),
        deadline: get("deadline"),
        details: get("details"),
      });
      if (res.ok) setReference(res.reference ?? null);
      else setError(res.error === "invalid" ? t("invalid") : t("error"));
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          setReference(undefined);
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex flex-none items-center gap-2 rounded-xl bg-market-or px-5 py-3 text-sm font-bold text-market-navy shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] transition-colors duration-150 ease-out hover:bg-market-or-light"
        >
          <Megaphone className="h-4 w-4" aria-hidden />
          {t("cta")}
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-lg">
        <DialogTitle className="font-display text-xl font-bold text-[var(--color-landing-navy)]">
          {t("dialogTitle")}
        </DialogTitle>
        <DialogDescription className="text-sm text-slate-500">{t("dialogBody")}</DialogDescription>

        {reference !== undefined ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center" role="status">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" aria-hidden />
            <p className="font-display text-lg font-bold text-[var(--color-landing-navy)]">{t("successTitle")}</p>
            <p className="max-w-xs text-sm text-slate-600">{t("successBody")}</p>
            {reference && (
              <p className="rounded-lg bg-slate-100 px-3 py-1.5 font-mono text-xs font-semibold text-slate-700">
                {t("reference", { ref: reference })}
              </p>
            )}
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-2 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="notice-org" className={LABEL}>
                  {t("organisation")}
                </label>
                <input id="notice-org" name="organisation" required minLength={2} maxLength={160} autoComplete="organization" className={FIELD} />
              </div>
              <div>
                <label htmlFor="notice-email" className={LABEL}>
                  {t("email")}
                </label>
                <input id="notice-email" name="email" type="email" required maxLength={200} autoComplete="email" className={FIELD} />
              </div>
            </div>
            <div>
              <label htmlFor="notice-title" className={LABEL}>
                {t("noticeTitle")}
              </label>
              <input id="notice-title" name="title" required minLength={4} maxLength={240} placeholder={t("noticeTitlePh")} className={FIELD} />
            </div>
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_160px]">
              <div>
                <label htmlFor="notice-link" className={LABEL}>
                  {t("link")}
                </label>
                <input id="notice-link" name="link" type="url" maxLength={500} placeholder="https://" className={FIELD} />
              </div>
              <div>
                <label htmlFor="notice-deadline" className={LABEL}>
                  {t("deadline")}
                </label>
                <input id="notice-deadline" name="deadline" type="date" className={FIELD} />
              </div>
            </div>
            <div>
              <label htmlFor="notice-details" className={LABEL}>
                {t("details")}
              </label>
              <textarea id="notice-details" name="details" rows={3} maxLength={2000} placeholder={t("detailsPh")} className={FIELD} />
            </div>
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={pending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-landing-navy)] px-4 py-3 text-sm font-bold text-white transition-colors duration-150 ease-out hover:bg-[#13244a] disabled:opacity-60"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
              {pending ? t("submitting") : t("send")}
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
