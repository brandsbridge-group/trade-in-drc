import { redirect } from "@/i18n/routing";

// Retired with /dashboard/rfq: creating an announcement is creating an opportunity.
export default async function DashboardNewRfqRedirectPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect({ href: "/dashboard/opportunities/new", locale });
}
