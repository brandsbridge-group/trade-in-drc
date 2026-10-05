import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { AuthShell } from "@/components/auth-design/auth-shell";
import { AuthPageHeading } from "@/components/auth-design/auth-page-heading";
import { ForgotPasswordForm } from "./form";

export default async function ForgotPasswordPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Auth" });
  return (
    <AuthShell locale={locale} boxed>
      <div className="space-y-5">
        <AuthPageHeading title={t("forgotPassword.title")} subtitle={t("forgotPassword.body")} />
        <ForgotPasswordForm />
        <div className="space-y-2 text-center text-sm text-muted-foreground">
          <p>
            <Link href="/login" className="font-medium text-primary underline underline-offset-4">
              {t("forgotPassword.backToLogin")}
            </Link>
          </p>
          <p>
            {t("noAccount")}{" "}
            <Link href="/signup" className="font-medium text-primary underline underline-offset-4">
              {t("signUp")}
            </Link>
          </p>
        </div>
      </div>
    </AuthShell>
  );
}
