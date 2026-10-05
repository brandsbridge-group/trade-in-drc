import { redirect } from "@/i18n/routing";

// Retired: this page wrote announcements to `rfq_listings`, which no public page
// displays (the public /rfq board already redirects to /opportunities). A company
// publishes its offers and demands as opportunities — moderated, public, and
// answerable. The locale-aware redirect keeps the language prefix.
export default async function DashboardRfqRedirectPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect({ href: "/dashboard/opportunities/new", locale });
}
