import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { AuthShell } from "@/components/auth-design/auth-shell";
import { AuthFormCard } from "@/components/auth-design/auth-form-card";
import { ForgotPasswordForm } from "./form";

export default async function ForgotPasswordPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Auth.forgotPassword" });
  return (
    <AuthShell locale={locale}>
      <AuthFormCard
        title={t("title")}
        subtitle={t("body")}
        footer={
          <Link href="/login" className="text-primary underline underline-offset-4">
            {t("backToLogin")}
          </Link>
        }
      >
        <ForgotPasswordForm />
      </AuthFormCard>
    </AuthShell>
  );
}
