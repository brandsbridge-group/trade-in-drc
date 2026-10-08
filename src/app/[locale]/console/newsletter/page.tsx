import { getTranslations } from "next-intl/server";
import { Plus, TriangleAlert } from "lucide-react";
import { Link } from "@/i18n/routing";
import { PageHeader } from "@/components/console/page-header";
import { CampaignList } from "@/components/console/newsletter/campaign-list";
import { NewsletterKpis } from "@/components/console/newsletter/newsletter-kpis";
import { NAVY_PILL, NEW_CAMPAIGN_PATH } from "@/components/console/newsletter/shared";
import { getNewsletterOverview, listNewsletterCampaigns } from "@/lib/newsletter/campaign-actions";

/**
 * Newsletter home (super-admin only): the audience in numbers, then every
 * campaign. Writing happens on `new` / `[id]`; a campaign being sent advances
 * from this page while it is open.
 */
export default async function NewsletterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Admin.newsletter" });
  const [campaigns, overview] = await Promise.all([listNewsletterCampaigns(locale), getNewsletterOverview(locale)]);

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        action={
          <Link href={NEW_CAMPAIGN_PATH} className={NAVY_PILL}>
            <Plus className="size-4" aria-hidden />
            {t("newCampaign")}
          </Link>
        }
      />
      {overview.blocker && (
        <p className="flex items-start gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-[13px] font-medium text-amber-800 ring-1 ring-amber-200/70">
          <TriangleAlert className="mt-px size-4 shrink-0" aria-hidden />
          {t(`notReady.${overview.blocker}`)}
        </p>
      )}
      <NewsletterKpis overview={overview} campaigns={campaigns} />
      <CampaignList locale={locale} campaigns={campaigns} overview={overview} />
    </div>
  );
}
