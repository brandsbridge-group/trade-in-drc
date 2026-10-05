import { AuthShell } from "@/components/auth-design/auth-shell";
import { VerifyEmailForm } from "./form";

export default async function VerifyEmailPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <AuthShell locale={locale} boxed>
      <VerifyEmailForm />
    </AuthShell>
  );
}
