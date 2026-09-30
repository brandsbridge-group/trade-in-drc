import { getTranslations } from "next-intl/server";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import { Link } from "@/i18n/routing";
import type { Locale } from "@/config/locales";
import { MotionEnter } from "@/components/home/motion-enter";
import { HeroDashboardPanel } from "./hero-dashboard-panel";
import { loadHeroPanelData } from "./hero-panel-data";

const TRUST_KEYS = ["verified", "bilingual", "free"] as const;

/**
 * Homepage hero. Renders transparently over the shared HeroBackdrop (the
 * wrapper section in page.tsx owns the video). Left: brand pill, headline and
 * CTAs. Right: the interactive dashboard, fed with live data. The platform
 * counts sit outside the hero, in PlatformIndicators.
 */
export async function LandingHero({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "Landing.hero" });
  const panel = await loadHeroPanelData(locale as Locale);
  return (
    <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)] items-center gap-10 px-4 pb-16 pt-14 sm:pb-20 sm:pt-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:pt-24">
      {/* Copy */}
      <MotionEnter>
        <div>
          <p className="inline-flex max-w-full items-center gap-2.5 rounded-full bg-white/[0.08] py-1 pl-1 pr-3.5 ring-1 ring-white/15 backdrop-blur-md">
            <span className="rounded-full bg-market-or px-3 py-1 text-xs font-bold tracking-wide text-market-navy">
              {t("brand")}
            </span>
            <span className="truncate text-xs font-medium text-white/75">{t("badge")}</span>
          </p>

          <h1 className="mt-6 text-balance text-[1.9rem] font-bold leading-[1.1] tracking-[-0.02em] text-white sm:text-[2.4rem] xl:text-[2.75rem]">
            {t.rich("title", {
              accent: (chunks) => (
                <span className="bg-[linear-gradient(135deg,#E4C98A_0%,#CBA14E_55%,#B68B3A_100%)] bg-clip-text text-transparent">
                  {chunks}
                </span>
              ),
            })}
          </h1>

          <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-white/70">{t("body")}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/market"
              className="group inline-flex items-center gap-2 rounded-full bg-market-or px-6 py-3 text-sm font-bold text-market-navy shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_10px_30px_-10px_rgba(203,161,78,0.6)] transition-colors duration-150 ease-out hover:bg-market-or-light"
            >
              {t("ctaMarket")}
              <ArrowRight className="h-4 w-4 transition-transform duration-150 ease-out group-hover:translate-x-0.5" aria-hidden />
            </Link>
            <Link
              href="/opportunities"
              className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-6 py-3 text-sm font-semibold text-white ring-1 ring-inset ring-white/25 backdrop-blur-md transition-colors duration-150 ease-out hover:bg-white/[0.12]"
            >
              {t("ctaOpportunities")}
            </Link>
          </div>

          <ul className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/65">
            {TRUST_KEYS.map((k) => (
              <li key={k} className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-market-or" aria-hidden />
                {t(`trust.${k}`)}
              </li>
            ))}
          </ul>
        </div>
      </MotionEnter>

      {/* Platform preview panel, floating over the background */}
      <MotionEnter className="w-full">
        <div className="w-full lg:pl-4">
          <HeroDashboardPanel locale={locale} data={panel} />
        </div>
      </MotionEnter>
    </div>
  );
}
