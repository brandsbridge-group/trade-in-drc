import { getTranslations } from "next-intl/server";
import { ShieldCheck } from "lucide-react";

export async function LandingTrustRibbon({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "Landing.ribbon" });
  return (
    <section className="bg-[var(--color-landing-navy)] text-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-2 px-4 py-4 text-center text-sm font-medium">
        <ShieldCheck className="h-4 w-4 text-landing-gold" />
        <span>{t("lead")}</span>
        <span className="text-landing-gold">{t("accent")}</span>
      </div>
    </section>
  );
}
