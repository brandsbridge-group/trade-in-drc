import { Suspense } from "react";
import { Check } from "lucide-react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AuthShell } from "@/components/auth-design/auth-shell";
import { AuthPageHeading } from "@/components/auth-design/auth-page-heading";
import { SignupForm } from "@/components/auth/signup-form";

/**
 * Account creation.
 *
 * This route exists because there was previously NO way to create an account:
 * the login page linked "Sign up" to /register, which redirected unauthenticated
 * visitors straight back to /login — a loop. SignupForm is rendered here
 * for logged-out visitors.
 *
 * Company registration is a separate, later step at /register-company.
 */
export default async function SignupPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ redirect?: string; context?: string }>;
}) {
  const { locale } = await params;
  const { redirect: redirectTarget, context } = await searchParams;
  const t = await getTranslations({ locale, namespace: "Auth" });

  // Already signed in? There is nothing to create.
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  // Already signed in? Nothing to create — go where they were headed (e.g.
  // /register-company), same-origin paths only.
  if (auth.user) {
    const safe = redirectTarget?.startsWith("/") && !redirectTarget.startsWith("//");
    redirect(safe ? `/${locale}${redirectTarget}` : `/${locale}/dashboard`);
  }

  // Mirror the same `?redirect=` carry-through as the /login page, so hopping
  // back and forth between the two (e.g. a visitor unsure whether they
  // already have an account) never drops the original destination.
  const loginHref = redirectTarget
    ? `/login?redirect=${encodeURIComponent(redirectTarget)}`
    : "/login";

  return (
    <AuthShell locale={locale} boxed>
      <div className="space-y-5">
        <AuthPageHeading title={t("registerTitle")} subtitle={t("registerDesc")} />
        {/* Arriving from "Register my company": sell the ACCOUNT, not the
            platform — the company form comes right after e-mail confirmation. */}
        {context === "company" && (
          <div className="rounded-lg border border-primary/15 bg-primary/5 px-4 py-3">
            <p className="text-sm font-semibold text-foreground">{t("signupContext.company.title")}</p>
            <ul className="mt-2 grid gap-1">
              {(["track", "manage", "alerts"] as const).map((k) => (
                <li key={k} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                  {t(`signupContext.company.${k}`)}
                </li>
              ))}
            </ul>
          </div>
        )}
        <Suspense fallback={null}>
          <SignupForm />
        </Suspense>
        <p className="text-center text-sm text-muted-foreground">
          {t("hasAccount")}{" "}
          <Link href={loginHref} className="font-medium text-primary underline underline-offset-4">
            {t("signIn")}
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
