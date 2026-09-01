import { getTranslations } from "next-intl/server";
import { AuthShell } from "@/components/auth-design/auth-shell";
import { AuthFormCard } from "@/components/auth-design/auth-form-card";
import { VerifyEmailForm } from "./form";

export default async function VerifyEmailPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Auth.verifyEmail" });
  return (
    <AuthShell locale={locale}>
      <AuthFormCard title={t("title")}>
        <VerifyEmailForm />
      </AuthFormCard>
    </AuthShell>
  );
}
