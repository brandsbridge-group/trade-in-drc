import { notFound } from "next/navigation";
import { CampaignComposer } from "@/components/console/newsletter/campaign-composer";
import { CampaignReport } from "@/components/console/newsletter/campaign-report";
import { getNewsletterCampaign, getNewsletterOverview } from "@/lib/newsletter/campaign-actions";

/** A draft opens in the composer; anything already sent (or being sent) opens as a report. */
export default async function NewsletterCampaignPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const [campaign, overview] = await Promise.all([getNewsletterCampaign(locale, id), getNewsletterOverview(locale)]);
  if (!campaign) notFound();

  return campaign.status === "draft" ? (
    <CampaignComposer locale={locale} campaign={campaign} overview={overview} />
  ) : (
    // A status change starts the report afresh (live counts, sending state).
    <CampaignReport key={campaign.status} locale={locale} campaign={campaign} overview={overview} />
  );
}
