import { getTranslations } from "next-intl/server";
import { VerificationBadge } from "@/components/trust/verification-badge";
import { PageHeader } from "@/components/design";

export default async function TrustPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Trust.page" });

  const pillars = [
    { titleKey: "kybTitle", bodyKey: "kybBody" },
    { titleKey: "kypTitle", bodyKey: "kypBody" },
    { titleKey: "kycTitle", bodyKey: "kycBody" },
  ] as const;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <section className="grid gap-3 md:grid-cols-3 my-6">
        {pillars.map((p) => (
          <div key={p.titleKey} className="border border-slate-200 rounded-xl p-4 bg-card">
            <h2 className="text-sm font-medium mb-1">{t(p.titleKey)}</h2>
            <p className="text-xs text-muted-foreground">{t(p.bodyKey)}</p>
          </div>
        ))}
      </section>

      <h2 className="text-sm font-semibold mt-8 mb-3">{t("tiersTitle")}</h2>
      <div className="flex flex-wrap gap-2">
        {(["none", "basic", "verified", "premium"] as const).map((tier) => (
          <VerificationBadge key={tier} tier={tier} />
        ))}
      </div>
    </div>
  );
}
