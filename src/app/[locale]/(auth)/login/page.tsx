import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { AuthShell } from "@/components/auth-design/auth-shell";
import { AuthFormCard } from "@/components/auth-design/auth-form-card";
import { UserAuthForm } from "@/components/auth/user-auth-form";

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Auth" });
  return (
    <AuthShell locale={locale}>
      <AuthFormCard
        title={t("loginTitle")}
        subtitle={t("loginDesc")}
        footer={
          <span>
            {t("noAccount")}{" "}
            <Link href="/signup" className="text-primary underline">{t("signUp")}</Link>
          </span>
        }
      >
        <Suspense fallback={null}>
          <UserAuthForm mode="login" />
        </Suspense>
      </AuthFormCard>
    </AuthShell>
  );
}
