import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { AuthShell } from "@/components/auth-design/auth-shell";
import { AuthPageHeading } from "@/components/auth-design/auth-page-heading";
import { ResetPasswordForm } from "./form";

export default async function ResetPasswordPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Auth" });
  return (
    <AuthShell locale={locale} boxed>
      <div className="space-y-5">
        <AuthPageHeading title={t("resetPassword.title")} subtitle={t("resetPassword.body")} />
        <ResetPasswordForm />
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-primary underline underline-offset-4">
            {t("forgotPassword.backToLogin")}
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
