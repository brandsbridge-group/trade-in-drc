import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { COMPANY_FORM_ROUTE, SIGNUP_REDIRECT } from "@/components/register/market/constants";

/**
 * Legacy public URL.
 *
 * Company registration is no longer a public page: the form lives in the
 * dashboard (`/dashboard/companies/new`). Every public "Register my company"
 * CTA still points here, so this route only forwards — a signed-in account
 * straight to the form (the proxy sends staff on to the console), a visitor
 * to account creation first (they come back to the form once their e-mail is
 * confirmed).
 */
export default async function RegisterCompanyRedirect({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  redirect(`/${locale}${auth.user ? COMPANY_FORM_ROUTE : SIGNUP_REDIRECT}`);
}
