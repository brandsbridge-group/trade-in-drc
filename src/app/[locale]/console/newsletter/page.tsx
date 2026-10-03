import { getTranslations } from "next-intl/server";
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
    <div className="space-y-5 p-4 md:p-6">
      <header>
        <h1 className="font-display text-xl font-bold text-market-navy">{t("title")}</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-600">{t("subtitle")}</p>
      </header>
      <NewsletterCampaignManager locale={locale} campaigns={campaigns} />
    </div>
  );
}
