"use client";

import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, Send, TriangleAlert } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { startNewsletterCampaign, type NewsletterOverview } from "@/lib/newsletter/campaign-actions";
import type { NewsletterCampaign } from "@/lib/newsletter/campaign-email";
import { GHOST_PILL, NAVY_PILL } from "./constants";

type Reviewed = Pick<NewsletterCampaign, "id" | "status" | "subject_en" | "subject_fr" | "failed_count">;

/**
 * The last look before a campaign leaves: who receives it, from whom, under
 * which subject in each language. Sending cannot be undone, so nothing starts
 * without this confirmation. A campaign to retry shows the failed recipients only.
 */
export function SendReviewDialog({
  locale,
  campaign,
  overview,
  onClose,
  onStarted,
}: {
  locale: string;
  campaign: Reviewed;
  overview: NewsletterOverview;
  onClose: () => void;
  onStarted: () => void;
}) {
  const t = useTranslations("Admin.newsletter.review");
  const format = useFormatter();
  const [busy, setBusy] = useState(false);

  const retry = campaign.status === "failed";
  const { active, activeEn, activeFr } = overview.subscribers;
  const recipients = retry ? campaign.failed_count : active;
  const blocked = overview.blocker !== null || recipients === 0;

  async function confirm() {
    setBusy(true);
    try {
      const result = await startNewsletterCampaign(locale, campaign.id);
      if (!result.ok) {
        toast.error(t(`errors.${result.error}`));
        return;
      }
      toast.success(t("started", { count: result.queued }));
      onStarted();
    } catch {
      toast.error(t("errors.server"));
    } finally {
      setBusy(false);
    }
  }

  const rows: [string, string, string?][] = [
    [
      t("recipients"),
      t(retry ? "retryRecipients" : "recipientsValue", { count: recipients }),
      retry ? undefined : t("byLanguage", { en: format.number(activeEn), fr: format.number(activeFr) }),
    ],
    [t("sender"), overview.sender ?? t("noSender")],
    [t("subjectEn"), campaign.subject_en],
    [t("subjectFr"), campaign.subject_fr],
  ];

  return (
    <Dialog open onOpenChange={(open) => !open && !busy && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-lg text-market-navy">{t(retry ? "retryTitle" : "title")}</DialogTitle>
          <DialogDescription className="text-[13px] leading-relaxed text-slate-600">
            {t(retry ? "retryBody" : "body")}
          </DialogDescription>
        </DialogHeader>

        <dl className="divide-y divide-slate-100 rounded-xl bg-slate-50 px-3 text-[13px]">
          {rows.map(([label, value, detail]) => (
            <div key={label} className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-3 py-2.5">
              <dt className="text-slate-500">{label}</dt>
              <dd className="min-w-0 break-words font-medium text-market-navy">
                {value}
                {detail && <span className="block text-xs font-normal text-slate-500">{detail}</span>}
              </dd>
            </div>
          ))}
        </dl>

        {blocked && (
          <p className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-xs font-medium text-amber-800">
            <TriangleAlert className="mt-px size-4 shrink-0" aria-hidden />
            {overview.blocker ? t(`errors.${overview.blocker}`) : t("errors.no_recipients")}
          </p>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <button type="button" onClick={onClose} disabled={busy} className={GHOST_PILL}>
            {t("cancel")}
          </button>
          <button type="button" onClick={confirm} disabled={busy || blocked} className={NAVY_PILL}>
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
            {t("confirm", { count: recipients })}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
