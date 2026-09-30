import { redirect } from "next/navigation";

export default async function DataHubAdminIndex({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/console/data-hub/reports/market_report`);
}
