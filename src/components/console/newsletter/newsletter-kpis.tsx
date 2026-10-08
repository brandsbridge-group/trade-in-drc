"use client";

import { useFormatter, useTranslations } from "next-intl";
import { MailCheck, MailQuestion, UserMinus, Users } from "lucide-react";
import { KpiTile } from "@/components/dashboard/overview/kpi-tile";
import type { NewsletterOverview } from "@/lib/newsletter/campaign-actions";
import type { NewsletterCampaign } from "@/lib/newsletter/campaign-email";

/**
 * The audience first (who a campaign sent now would reach), then who is still
 * to confirm, who left, and what has already gone out.
 */
export function NewsletterKpis({ overview, campaigns }: { overview: NewsletterOverview; campaigns: NewsletterCampaign[] }) {
  const t = useTranslations("Admin.newsletter.stats");
  const format = useFormatter();
  const { active, activeEn, activeFr, pending, unsubscribed } = overview.subscribers;

  const everConfirmed = active + unsubscribed;
  const sentCampaigns = campaigns.filter((campaign) => campaign.status === "sent").length;
  const delivered = campaigns.reduce((total, campaign) => total + campaign.sent_count, 0);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <KpiTile
        highlight
        icon={Users}
        label={t("active")}
        value={format.number(active)}
        footnote={t("activeFoot", { en: format.number(activeEn), fr: format.number(activeFr) })}
      />
      <KpiTile icon={MailQuestion} label={t("pending")} value={format.number(pending)} footnote={t("pendingFoot")} />
      <KpiTile
        icon={UserMinus}
        label={t("unsubscribed")}
        value={format.number(unsubscribed)}
        footnote={t("unsubscribedFoot", {
          rate: format.number(everConfirmed > 0 ? unsubscribed / everConfirmed : 0, { style: "percent", maximumFractionDigits: 1 }),
        })}
      />
      <KpiTile
        icon={MailCheck}
        label={t("sent")}
        value={format.number(sentCampaigns)}
        footnote={t("sentFoot", { count: delivered })}
      />
    </div>
  );
}
