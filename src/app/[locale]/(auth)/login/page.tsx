import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { AuthShell } from "@/components/auth-design/auth-shell";
import { AuthPageHeading } from "@/components/auth-design/auth-page-heading";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { locale } = await params;
  const { redirect } = await searchParams;
  const t = await getTranslations({ locale, namespace: "Auth" });
  // Carry `?redirect=` through to /signup so a visitor bounced here from a
  // gated flow (e.g. /register-company) who doesn't have an account yet still
  // lands back on that flow after creating one, instead of the generic
  // dashboard default — see redirect-guard.ts's resolvePostAuthRedirect.
  const signupHref = redirect ? `/signup?redirect=${encodeURIComponent(redirect)}` : "/signup";
  return (
    <AuthShell locale={locale} boxed>
      <div className="space-y-5">
        <AuthPageHeading title={t("loginTitle")} subtitle={t("loginDesc")} />
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
        <p className="text-center text-sm text-muted-foreground">
          {t("noAccount")}{" "}
          <Link href={signupHref} className="font-medium text-primary underline underline-offset-4">
            {t("signUp")}
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
