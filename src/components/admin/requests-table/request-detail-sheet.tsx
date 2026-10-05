"use client";

import * as React from "react";
import { useFormatter, useTranslations } from "next-intl";
import type { LucideIcon } from "lucide-react";
import {
  Building2,
  CalendarClock,
  CheckCircle2,
  Crown,
  Download,
  ExternalLink,
  FileText,
  Globe2,
  Layers,
  Mail,
  MapPin,
  Package,
  Phone,
  Scale,
  Send,
  Trash2,
  UserRound,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { BusinessRequestIntent, BusinessRequestStatus } from "@/lib/supabase/types";
import { findPlan, formatPlanPrice } from "@/config/promotion-plans";
import { toast } from "sonner";
import { personInitials } from "@/lib/requests/views";
import { TIMELINES, readPartnerRequestDetails, type Timeline } from "@/lib/requests/partner-request";
import { getRequestAttachmentUrl } from "@/app/[locale]/console/requests/actions";
import type { AdminRequestRow } from "./shared";
import { StatusPicker } from "./status-picker";
import { OwnerEditor } from "./owner-editor";

const EYEBROW = "text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400";

function Fact({ icon: Icon, label, value, href }: { icon: LucideIcon; label: string; value: string | null; href?: string }) {
  if (!value) return null;
  return (
    <div className="flex min-w-0 items-start gap-2.5">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-slate-100 text-market-navy" aria-hidden>
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <dt className="text-[11px] text-slate-400">{label}</dt>
        <dd className="break-words text-[13px] font-medium text-market-navy">
          {href ? (
            <a href={href} className="underline-offset-2 transition-colors hover:text-market-or-dark hover:underline">
              {value}
            </a>
          ) : (
            value
          )}
        </dd>
      </div>
    </div>
  );
}

/**
 * A request, opened from its row: who asks, what for, who it is addressed to,
 * and the follow-up (status, owner, internal note). A side panel rather than a
 * dialog, so the list stays in view behind it.
 */
export function RequestDetailSheet({
  row,
  open,
  onOpenChange,
  busy,
  onStatus,
  onOwner,
  onSaveNote,
  onFulfil,
  onForward,
  onDelete,
}: {
  row: AdminRequestRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** A write on this request is running. */
  busy: boolean;
  onStatus: (status: BusinessRequestStatus) => void;
  onOwner: (owner: string) => void;
  onSaveNote: (note: string) => void;
  /** Opens the "grant this promotion package" flow. */
  onFulfil: () => void;
  /** Passes the request on to the company it is addressed to. */
  onForward: () => void;
  onDelete: () => void;
}) {
  const t = useTranslations("AdminRequests");
  const tIntent = useTranslations("Request.intents");
  const tFulfil = useTranslations("AdminRequests.fulfil");
  const tInterest = useTranslations("CompanyProfile.contact.interestOptions");
  const tPartner = useTranslations("FindPartner");
  const format = useFormatter();
  const [note, setNote] = React.useState("");
  const [opening, setOpening] = React.useState(false);

  React.useEffect(() => {
    setNote(row?.admin_notes ?? "");
  }, [row]);

  if (!row) return null;

  const plan = row.promotion_plan ? findPlan(row.promotion_plan) : undefined;
  // A quote request speaks of delivery; any other request of a place and a time frame.
  const isQuote = !!(row.product_id || row.quantity);
  const noteChanged = note.trim() !== (row.admin_notes ?? "");
  const details = readPartnerRequestDetails(row.details);
  // The partner form stores the time frame as a key; other forms as free text.
  const timeline =
    row.timeline && (TIMELINES as readonly string[]).includes(row.timeline)
      ? tPartner(`timelines.${row.timeline as Timeline}`)
      : row.timeline;
  const website = details?.website ? (/^https?:\/\//i.test(details.website) ? details.website : `https://${details.website}`) : null;

  const openAttachment = async () => {
    setOpening(true);
    try {
      const result = await getRequestAttachmentUrl({ id: row.id });
      if (result.ok && result.url) window.open(result.url, "_blank", "noopener");
      else toast.error(t("detail.downloadError"));
    } catch {
      toast.error(t("detail.downloadError"));
    } finally {
      setOpening(false);
    }
  };

  const interest = row.interest
    ? tInterest.has(row.interest) ? tInterest(row.interest) : row.interest
    : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="w-full gap-0 overflow-y-auto bg-slate-50 p-0 sm:max-w-xl"
      >
        <SheetHeader className="gap-0 bg-white p-5 ring-1 ring-slate-200/70">
          <div className="flex items-start gap-3 pr-8">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-market-navy font-display text-sm font-semibold text-market-or-light" aria-hidden>
              {personInitials(row.full_name)}
            </span>
            <div className="min-w-0">
              <SheetTitle className="truncate font-display text-lg font-semibold text-market-navy">{row.full_name}</SheetTitle>
              <SheetDescription className="text-[13px] text-slate-500">
                {tIntent(`${row.intent}.title` as `${BusinessRequestIntent}.title`)}
              </SheetDescription>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-slate-500">
            <StatusPicker status={row.status} disabled={busy} onChange={onStatus} />
            <span>{t("detail.submittedAt")} {format.dateTime(new Date(row.created_at), { dateStyle: "medium", timeStyle: "short" })}</span>
            {row.reference && <span className="text-slate-400">{row.reference}</span>}
          </div>
        </SheetHeader>

        <div className="space-y-3 p-4">
          <section className="rounded-2xl bg-white p-4 ring-1 ring-slate-200/70">
            <h3 className={EYEBROW}>{t("detail.sections.contact")}</h3>
            <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Fact icon={Mail} label={t("detail.contact")} value={row.email} href={`mailto:${row.email}`} />
              <Fact icon={Phone} label={t("detail.phone")} value={row.phone} href={row.phone ? `tel:${row.phone.replace(/\s+/g, "")}` : undefined} />
              <Fact icon={Building2} label={t("table.company")} value={row.company_name} />
              <Fact icon={Globe2} label={t("table.country")} value={row.country} />
              <Fact icon={UserRound} label={t("detail.submittedBy")} value={row.submitter_name} />
            </dl>
          </section>

          <section className="rounded-2xl bg-white p-4 ring-1 ring-slate-200/70">
            <h3 className={EYEBROW}>{t("detail.sections.request")}</h3>
            {(details || row.sector || row.product_name || row.quantity || row.preferred_location || row.timeline || interest) && (
              <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Fact icon={Layers} label={t("detail.need")} value={details ? tPartner(`needs.${details.need}`) : null} />
                <Fact icon={Package} label={t("detail.product")} value={row.product_name ?? (details?.product || null)} />
                <Fact icon={Scale} label={t("detail.quantity")} value={row.quantity} />
                <Fact icon={MapPin} label={t(isQuote ? "detail.deliveryPlace" : "detail.location")} value={row.preferred_location} />
                <Fact icon={CalendarClock} label={t(isQuote ? "detail.deadline" : "detail.timeline")} value={timeline} />
                <Fact icon={Scale} label={t("detail.volume")} value={details?.volume ? tPartner(`volumes.${details.volume}`) : null} />
                <Fact icon={Layers} label={t("table.sector")} value={row.sector} />
                <Fact icon={Layers} label={t("detail.interest")} value={interest} />
              </dl>
            )}
            {details && details.preferences.length > 0 && (
              <div className="mt-3">
                <p className="text-[11px] text-slate-400">{t("detail.preferences")}</p>
                <ul className="mt-1.5 flex flex-wrap gap-1.5">
                  {details.preferences.map((pref) => (
                    <li key={pref} className="rounded-full bg-market-cream px-2.5 py-1 text-xs font-medium text-market-navy">
                      {tPartner(`checkboxes.${pref}`)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {website && (
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="mt-3 inline-flex max-w-full items-center gap-1.5 text-[13px] font-medium text-market-navy underline-offset-2 transition-colors hover:text-market-or-dark hover:underline"
              >
                <ExternalLink className="size-3.5 shrink-0" aria-hidden />
                <span className="truncate">{details?.website}</span>
              </a>
            )}
            <p className="mt-3 text-[11px] text-slate-400">{t("detail.message")}</p>
            <p className="mt-1 whitespace-pre-wrap break-words rounded-xl bg-slate-50 p-3 text-[13px] leading-relaxed text-slate-700">
              {row.message || <span className="text-slate-400">{t("detail.noMessage")}</span>}
            </p>
            {row.has_attachment && (
              <div className="mt-3 flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5 ring-1 ring-slate-200/70">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white text-market-navy ring-1 ring-slate-200/70" aria-hidden>
                  <FileText className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] text-slate-400">{t("detail.attachment")}</p>
                  <p className="truncate text-[13px] font-medium text-market-navy">{row.attachment_name ?? "document"}</p>
                </div>
                <button
                  type="button"
                  onClick={openAttachment}
                  disabled={opening}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-market-navy ring-1 ring-slate-200 transition-colors hover:bg-slate-100 disabled:opacity-60"
                >
                  <Download className="size-3.5" aria-hidden />
                  {t("detail.download")}
                </button>
              </div>
            )}
          </section>

          {row.target_company_id && (
            <section className="rounded-2xl bg-white p-4 ring-1 ring-slate-200/70">
              <h3 className={EYEBROW}>{t("detail.target")}</h3>
              <p className="mt-2 font-display text-base font-semibold text-market-navy">{row.target_company_name ?? "—"}</p>
              {row.forwarded_at ? (
                <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                  <CheckCircle2 className="size-4" aria-hidden />
                  {t("forward.done", { date: format.dateTime(new Date(row.forwarded_at), { dateStyle: "medium" }) })}
                </p>
              ) : (
                <>
                  <p className="mt-1 text-xs text-slate-500">{t("forward.hint")}</p>
                  <button
                    type="button"
                    onClick={onForward}
                    disabled={busy}
                    className="mt-3 inline-flex items-center gap-2 rounded-full bg-market-navy px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-market-navy-deep disabled:opacity-60"
                  >
                    <Send className="size-3.5" aria-hidden />
                    {t("forward.cta")}
                  </button>
                </>
              )}
            </section>
          )}

          {plan && (
            <section className="rounded-2xl bg-market-cream p-4 ring-1 ring-market-or/30">
              <h3 className={EYEBROW}>{t("detail.promotionRequested")}</h3>
              <p className="mt-2 flex items-center gap-2 font-semibold text-market-navy">
                <Crown className="size-4 text-market-or-dark" aria-hidden />
                {tFulfil(`plans.${plan.id}`)} — {formatPlanPrice(plan.amountUsd)}
              </p>
              {row.status === "converted" ? (
                <p className="mt-2 text-xs font-medium text-emerald-700">{t("detail.promotionGranted")}</p>
              ) : (
                <button
                  type="button"
                  onClick={onFulfil}
                  className="mt-3 rounded-full bg-market-or px-4 py-2 text-[13px] font-semibold text-market-navy transition-colors hover:bg-market-or-light"
                >
                  {t("detail.grantPromotion")}
                </button>
              )}
            </section>
          )}

          <section className="rounded-2xl bg-white p-4 ring-1 ring-slate-200/70">
            <h3 className={EYEBROW}>{t("detail.sections.followUp")}</h3>
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-[13px] text-slate-500">{t("table.followUpOwner")}</span>
              <OwnerEditor value={row.follow_up_owner} placeholder={t("ownerPlaceholder")} disabled={busy} onSave={onOwner} />
            </div>
            <label htmlFor="request-note" className="mt-3 block text-[13px] text-slate-500">{t("addNote")}</label>
            <Textarea
              id="request-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="mt-1 bg-white text-[13px]"
            />
            <p className="mt-1 text-[11px] text-slate-400">{t("detail.noteHint")}</p>
            <div className="mt-3 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onDelete}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
              >
                <Trash2 className="size-3.5" aria-hidden />
                {t("deleteLabel")}
              </button>
              <button
                type="button"
                onClick={() => onSaveNote(note.trim())}
                disabled={busy || !noteChanged}
                className="rounded-full bg-market-navy px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-market-navy-deep disabled:opacity-40"
              >
                {t("detail.saveNote")}
              </button>
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
