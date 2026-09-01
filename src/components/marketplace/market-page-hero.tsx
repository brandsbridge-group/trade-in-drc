import Image from "next/image";
import { getTranslations } from "next-intl/server";
import {
  ArrowRight,
  PlayCircle,
  Users,
  Globe,
  Handshake,
  ShieldCheck,
  Boxes,
  BarChart3,
  Building2,
  Network,
} from "lucide-react";

import { Link } from "@/i18n/routing";
import { MotionEnter } from "@/components/home/motion-enter";

/** The four inline hero stats — value comes from live counts, label from i18n. */
export interface HeroStat {
  key: string;
  value: string;
}

const STAT_ICONS = [Users, Globe, Handshake, ShieldCheck] as const;

/** Right-hand "A Central Hub for Global Trade in DRC" panel rows. */
const HUB_ROWS = [
  { key: "discover", Icon: Users },
  { key: "find", Icon: Boxes },
  { key: "intelligence", Icon: BarChart3 },
  { key: "facilitate", Icon: Building2 },
  { key: "network", Icon: Network },
] as const;

/**
 * Marketplace hero (customer design: marketplace-drc-business.ai). Two columns:
 * headline + live stats + CTAs on the left, the port photograph with the dark
 * "central hub" panel floating over it on the right.
 */
export async function MarketPageHero({ stats }: { stats: HeroStat[] }) {
  const t = await getTranslations("MarketplacePage.hero");

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto grid w-full max-w-[1500px] items-center gap-8 px-4 py-8 md:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:py-10">
        {/* Copy + stats + CTAs */}
        <MotionEnter>
          <div>
            <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-[var(--color-landing-navy)] md:text-5xl">
              {t("titleLead")}
              <span className="block text-primary">{t("titleAccent")}</span>
            </h1>
            <p className="mt-3 font-display text-lg font-bold text-[var(--color-landing-navy)] md:text-xl">
              {t("tagline")}
            </p>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600">
              {t("body")}
            </p>

            {/* Live platform stats */}
            <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4">
              {stats.map((stat, i) => {
                const Icon = STAT_ICONS[i] ?? ShieldCheck;
                return (
                  <div key={stat.key} className="flex min-w-0 items-center gap-2">
                    <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-primary text-white">
                      <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <dt className="font-display text-sm font-bold leading-tight text-primary">
                        {stat.value}
                      </dt>
                      <dd className="text-[11px] leading-tight text-slate-500">
                        {t(`stats.${stat.key}`)}
                      </dd>
                    </div>
                  </div>
                );
              })}
            </dl>

            {/* CTAs */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/register-company"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white transition-colors duration-150 ease-out hover:bg-[#003a8c]"
              >
                {t("ctaJoin")}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href="/opportunities"
                className="inline-flex items-center gap-2 rounded-lg border-2 border-primary px-5 py-2.5 text-sm font-bold text-primary transition-colors duration-150 ease-out hover:bg-primary/5"
              >
                {t("ctaExplore")}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href="/about/how-it-works"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-landing-navy)] transition-colors duration-150 ease-out hover:text-primary"
              >
                <PlayCircle className="h-7 w-7 text-primary" strokeWidth={1.75} aria-hidden />
                {t("ctaHowItWorks")}
              </Link>
            </div>
          </div>
        </MotionEnter>

        {/* Port photograph + floating hub panel */}
        <MotionEnter className="w-full">
          <div className="relative overflow-hidden rounded-xl">
            <Image
              src="/images/marketplace/hero-port.jpg"
              alt={t("imageAlt")}
              width={1686}
              height={1080}
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="h-[260px] w-full object-cover md:h-[330px]"
            />
            <div className="absolute inset-y-0 right-0 hidden w-[46%] items-center bg-gradient-to-l from-[var(--color-landing-navy)] via-[var(--color-landing-navy)]/95 to-transparent md:flex">
              <div className="w-full p-5 pl-8">
                <p className="font-display text-base font-bold leading-snug text-white">
                  {t("hub.title")}
                </p>
                <span className="mt-3 mb-3 block h-px w-full bg-white/25" />
                <ul className="space-y-2.5">
                  {HUB_ROWS.map(({ key, Icon }) => (
                    <li key={key} className="flex items-center gap-2.5 text-[13px] text-white/90">
                      <Icon className="h-4 w-4 flex-none text-white/70" strokeWidth={1.75} aria-hidden />
                      {t(`hub.${key}`)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Hub list stacks under the photo on small screens. */}
          <ul className="mt-3 grid gap-2 rounded-xl bg-[var(--color-landing-navy)] p-4 md:hidden">
            <li className="font-display text-sm font-bold text-white">{t("hub.title")}</li>
            {HUB_ROWS.map(({ key, Icon }) => (
              <li key={key} className="flex items-center gap-2.5 text-[13px] text-white/90">
                <Icon className="h-4 w-4 flex-none text-white/70" strokeWidth={1.75} aria-hidden />
                {t(`hub.${key}`)}
              </li>
            ))}
          </ul>
        </MotionEnter>
      </div>
    </section>
  );
}
