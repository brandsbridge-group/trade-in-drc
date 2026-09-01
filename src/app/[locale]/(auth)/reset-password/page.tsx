import { getTranslations } from "next-intl/server";
import { AuthShell } from "@/components/auth-design/auth-shell";
import { AuthFormCard } from "@/components/auth-design/auth-form-card";
import { ResetPasswordForm } from "./form";

export default async function ResetPasswordPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Auth.resetPassword" });
  return (
    <AuthShell locale={locale}>
      <AuthFormCard title={t("title")}>
        <ResetPasswordForm />
      </AuthFormCard>
    </AuthShell>
  );
}
