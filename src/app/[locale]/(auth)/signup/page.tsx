import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AuthShell } from "@/components/auth-design/auth-shell";
import { AuthFormCard } from "@/components/auth-design/auth-form-card";
import { UserAuthForm } from "@/components/auth/user-auth-form";

/**
 * Account creation.
 *
 * This route exists because there was previously NO way to create an account:
 * the login page linked "Sign up" to /register, which redirected unauthenticated
 * visitors straight back to /login — a loop. UserAuthForm already implemented
 * signup; nothing rendered it for a logged-out visitor.
 *
 * Company registration is a separate, later step at /register-company.
 */
export default async function SignupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Auth" });

  // Already signed in? There is nothing to create.
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  if (auth.user) redirect(`/${locale}/dashboard`);

  return (
    <AuthShell locale={locale}>
      <AuthFormCard
        title={t("registerTitle")}
        subtitle={t("registerDesc")}
        footer={
          <span>
            {t("hasAccount")}{" "}
            <Link href="/login" className="text-primary underline">
              {t("signIn")}
            </Link>
          </span>
        }
      >
        <Suspense fallback={null}>
          <UserAuthForm mode="signup" />
        </Suspense>
      </AuthFormCard>
    </AuthShell>
  );
}
