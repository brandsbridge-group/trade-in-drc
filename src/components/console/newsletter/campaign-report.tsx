"use client";

import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowLeft, CircleAlert, Copy, Loader2, MailCheck, Percent, Play, RotateCcw, Users } from "lucide-react";
import { Link, useRouter } from "@/i18n/routing";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/console/page-header";
import { KpiTile } from "@/components/dashboard/overview/kpi-tile";
import { duplicateNewsletterCampaign, type NewsletterOverview } from "@/lib/newsletter/campaign-actions";
import { CAMPAIGN_LANGUAGES, campaignText, type CampaignLanguage, type NewsletterCampaign } from "@/lib/newsletter/campaign-email";
import { EmailPreview } from "./email-preview";
import { SendReviewDialog } from "./send-review-dialog";
import { GHOST_PILL, NAVY_PILL, campaignPath, campaignSubject } from "./constants";
import { CampaignStatusPill, DeliveryBar } from "./shared";
import { useCampaignDelivery } from "./use-campaign-delivery";

/**
 * A campaign that left the draft stage: how its delivery went (live while it
 * is being sent) and what subscribers received. Its content is frozen — to
 * reuse it, duplicate it into a new draft.
 */
export function CampaignReport({
  locale,
  campaign,
  overview,
}: {
  locale: string;
  campaign: NewsletterCampaign;
  overview: NewsletterOverview;
}) {
  const t = useTranslations("Admin.newsletter");
  const format = useFormatter();
  const router = useRouter();
  const [language, setLanguage] = useState<CampaignLanguage>(locale === "fr" ? "fr" : "en");
  const [retrying, setRetrying] = useState(false);
  const [duplicating, setDuplicating] = useState(false);

  const { counts, state, resume } = useCampaignDelivery(locale, campaign, (progress) => {
    if (progress.failed > 0) toast.warning(t("delivery.doneWithFailures", { sent: progress.sent, failed: progress.failed }));
    else toast.success(t("delivery.done", { count: progress.sent }));
    router.refresh();
  });

  async function duplicate() {
    setDuplicating(true);
    try {
      const result = await duplicateNewsletterCampaign(locale, campaign.id);
      if (!result.ok) {
        toast.error(t("list.duplicateError"));
        return;
      }
      toast.success(t("list.duplicated"));
      router.push(campaignPath(result.id));
    } catch {
      toast.error(t("list.duplicateError"));
    } finally {
      setDuplicating(false);
    }
  }

  const { subject, body } = campaignText(campaign, language);
  const rate = counts.total > 0 ? counts.sent / counts.total : 0;
  const day = (value: string) => format.dateTime(new Date(value), { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="space-y-4">
      <Link
        href={ROUTES.CONSOLE_NEWSLETTER}
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 transition-colors hover:text-market-navy"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("composer.back")}
      </Link>

      {/* The actions wrap under the title on a phone (PageHeader's own action slot does not shrink). */}
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <PageHeader title={campaignSubject(campaign, locale)} subtitle={campaign.sent_at ? t("report.sentOn", { date: day(campaign.sent_at) }) : t("report.createdOn", { date: day(campaign.created_at) })} />
        <div className="flex flex-wrap items-center gap-2">
          <CampaignStatusPill status={campaign.status} onCanvas />
          <button type="button" onClick={duplicate} disabled={duplicating} className={GHOST_PILL}>
            {duplicating ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Copy className="size-4" aria-hidden />}
            {t("report.duplicate")}
          </button>
          {campaign.status === "failed" && (
            <button type="button" onClick={() => setRetrying(true)} className={NAVY_PILL}>
              <RotateCcw className="size-4" aria-hidden />
              {t("delivery.retry")}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile highlight icon={MailCheck} label={t("report.delivered")} value={format.number(counts.sent)} footnote={t("report.deliveredFoot", { total: format.number(counts.total) })} />
        <KpiTile icon={Users} label={t("report.recipients")} value={format.number(counts.total)} footnote={t("report.recipientsFoot")} />
        <KpiTile icon={CircleAlert} label={t("report.failed")} value={format.number(counts.failed)} footnote={t(counts.failed > 0 ? "report.failedFoot" : "report.noFailure")} />
        <KpiTile icon={Percent} label={t("report.rate")} value={format.number(rate, { style: "percent", maximumFractionDigits: 1 })} footnote={t("report.rateFoot")} />
      </div>

      {campaign.status === "sending" && (
        <section className="rounded-2xl bg-white p-4 ring-1 ring-slate-200/70" aria-live="polite">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[13px] font-medium text-market-navy">
              {state === "stalled"
                ? t("delivery.stalled")
                : state === "waiting"
                  ? t("delivery.waiting")
                  : t("delivery.sending", { sent: format.number(counts.sent), total: format.number(counts.total) })}
            </p>
            {state === "stalled" && (
              <button type="button" onClick={resume} className={cn(GHOST_PILL, "px-3 py-1.5")}>
                <Play className="size-3.5" aria-hidden />
                {t("delivery.resume")}
              </button>
            )}
          </div>
          <DeliveryBar {...counts} label={t("list.delivery")} className="mt-3 h-2" />
          <p className="mt-2 text-xs text-slate-500">{t("delivery.keepOpen")}</p>
        </section>
      )}

      <div className="grid items-start gap-4 xl:grid-cols-2">
        <section className="space-y-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200/70 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-market-navy">{t("report.content")}</h2>
            <div role="group" aria-label={t("composer.languageTabs")} className="inline-flex gap-0.5 rounded-xl bg-slate-200/70 p-1">
              {CAMPAIGN_LANGUAGES.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={language === option}
                  onClick={() => setLanguage(option)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-[13px] transition-colors",
                    language === option ? "bg-white font-semibold text-market-navy ring-1 ring-slate-200" : "text-slate-600 hover:text-market-navy"
                  )}
                >
                  {t(`preview.language.${option}`)}
                </button>
              ))}
            </div>
          </div>
          <dl className="space-y-3 text-[13px]">
            <div>
              <dt className="text-xs font-medium text-slate-500">{t("composer.subject")}</dt>
              <dd lang={language} className="mt-1 font-semibold text-market-navy">{subject}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">{t("composer.body")}</dt>
              <dd lang={language} className="mt-1 whitespace-pre-wrap leading-relaxed text-slate-700">{body}</dd>
            </div>
          </dl>
        </section>

        <div className="xl:sticky xl:top-4">
          <EmailPreview
            language={language}
            subject={subject}
            body={body}
            linkUrl={campaign.link_url}
            photoUrl={campaign.photo_url}
            sender={overview.sender}
          />
        </div>
      </div>

      {retrying && (
        <SendReviewDialog
          locale={locale}
          campaign={campaign}
          overview={overview}
          onClose={() => setRetrying(false)}
          onStarted={() => {
            setRetrying(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
