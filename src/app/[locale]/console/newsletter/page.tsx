import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/console/page-header";
import { listNewsletterCampaigns } from "@/lib/newsletter/campaign-actions";
import { NewsletterCampaignManager } from "./newsletter-campaign-manager";

export default async function NewsletterAdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Admin.newsletter" });
  const campaigns = await listNewsletterCampaigns(locale);

  return (
    <div className="space-y-4">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <NewsletterCampaignManager locale={locale} campaigns={campaigns} />
    </div>
  );
}
