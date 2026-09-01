import { getTranslations } from "next-intl/server";
import { ArrowRight, Users, CheckCircle2 } from "lucide-react";
import { Link } from "@/i18n/routing";
import { MotionEnter } from "@/components/home/motion-enter";
import { HeroDashboardPanel } from "./hero-dashboard-panel";

const TRUST_KEYS = ["verified", "bilingual", "free"] as const;

/**
 * Hero copy + platform panel. Renders transparently over the shared HeroBackdrop
 * (the wrapper section in page.tsx owns the animated background).
 */
export async function LandingHero({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "Landing.hero" });
  return (
    <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-10 pt-14 sm:pt-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:pt-24">
      {/* Copy */}
      <MotionEnter>
        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-landing-gold">
            {t("badge")}
          </p>
          <h1 className="text-4xl font-extrabold leading-[1.02] tracking-tight text-white sm:text-5xl md:text-6xl">
            {t("titleLead")}
            <span className="text-gold-gradient">{t("titleAccent")}</span>
          </h1>
          <p className="mt-4 max-w-md text-lg font-semibold text-white/90">
            {t("subtitle")}
          </p>
          <span className="mt-5 block h-1 w-16 rounded-full bg-landing-gold" />
          <p className="mt-5 max-w-md text-sm leading-relaxed text-white/70">
            {t("body")}
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/opportunities"
              className="inline-flex items-center gap-2 rounded-xl bg-landing-gold px-5 py-3 text-sm font-bold text-[var(--color-landing-navy)] shadow-lg shadow-amber-900/20 transition-transform duration-150 ease-out hover:-translate-y-0.5"
            >
              {t("ctaPrimary")}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/companies"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/5 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-colors duration-150 ease-out hover:bg-white/10"
            >
              <Users className="h-4 w-4" />
              {t("ctaSecondary")}
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/75">
            {TRUST_KEYS.map((k) => (
              <span key={k} className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-landing-gold" />
                {t(`trust.${k}`)}
              </span>
            ))}
          </div>
        </div>
      </MotionEnter>

      {/* Platform preview panel, floating over the background */}
      <MotionEnter className="w-full">
        <div className="w-full lg:pl-4">
          <HeroDashboardPanel locale={locale} />
        </div>
      </MotionEnter>
    </div>
  );
}
