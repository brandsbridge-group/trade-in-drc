import { getTranslations } from "next-intl/server";
import { CheckCircle2 } from "lucide-react";
import { Link } from "@/i18n/routing";
import { HeroSearch, HeroMockupCard } from "@/components/design";
import { MotionEnter } from "@/components/home/motion-enter";

const TRUST_KEYS = ["verified", "bilingual", "free"] as const;

export async function HeroSection({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "Home.hero" });
  return (
    <section className="bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-4 py-10 md:py-14 grid md:grid-cols-[1fr_360px] gap-8 items-center">
        <MotionEnter>
          <div>
            <p className="text-xs uppercase tracking-wide opacity-80 mb-2">{t("tagline")}</p>
            <h1 className="text-3xl md:text-4xl font-semibold leading-tight mb-3 max-w-xl">{t("headline")}</h1>
            <p className="text-sm opacity-90 mb-6 max-w-md">{t("subline")}</p>
            <HeroSearch />
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <Link
                href="/companies"
                className="text-xs bg-white text-primary px-3 py-1.5 rounded-md font-medium"
              >
                {t("cta.browse")}
              </Link>
              <Link href="/about" className="text-xs text-white/90 underline">
                {t("cta.howItWorks")}
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-4 text-[11px] text-white/85">
              {TRUST_KEYS.map((k) => (
                <span key={k} className="inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {t(`cta.trust.${k}`)}
                </span>
              ))}
            </div>
          </div>
        </MotionEnter>
        <HeroMockupCard locale={locale} />
      </div>
    </section>
  );
}
