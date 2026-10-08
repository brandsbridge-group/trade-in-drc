import { CampaignComposer } from "@/components/console/newsletter/campaign-composer";
import { getNewsletterOverview } from "@/lib/newsletter/campaign-actions";

export default async function NewNewsletterCampaignPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const overview = await getNewsletterOverview(locale);
  return <CampaignComposer locale={locale} campaign={null} overview={overview} />;
}
