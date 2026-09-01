import { redirect } from "next/navigation";

/**
 * Legacy URL.
 *
 * /register used to host a second, older company-registration wizard behind an
 * auth wall — and the login page's "Sign up" link pointed here, so a logged-out
 * visitor was bounced straight back to /login and could never create an account.
 * Account creation now lives at /signup, company registration at
 * /register-company (every in-app CTA was repointed there).
 *
 * "Register" reads as "create an account" to a visitor arriving cold, so this
 * URL forwards there. Kept as a redirect rather than removed so any external
 * link or bookmark still lands somewhere sensible.
 */
export default async function LegacyRegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/signup`);
}
