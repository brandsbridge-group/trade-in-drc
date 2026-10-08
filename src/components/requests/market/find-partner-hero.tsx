import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { BadgeCheck, ChevronRight, Clock, Gift, Search } from "lucide-react";

import { Link } from "@/i18n/routing";

const HERO_IMAGE = "/images/request/hero-handshake.jpg";

/**
 * Hero of /request: full-width navy band with the handshake photo fading in on
 * the right, its content aligned to the site's box. It states the promise and
 * the three assurances a visitor weighs before filling a form in.
 */
export async function FindPartnerHero() {
  const t = await getTranslations("FindPartner");

  const assurances = [
    { key: "free", icon: Gift },
    { key: "delay", icon: Clock },
    { key: "verified", icon: BadgeCheck },
  ] as const;

  return (
    <section className="relative isolate overflow-hidden bg-market-navy text-white">
      <div
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-[55%] md:block [mask-image:linear-gradient(to_right,transparent,black_45%)]"
        aria-hidden
      >
        <Image src={HERO_IMAGE} alt="" fill priority sizes="(min-width: 768px) 55vw, 0px" className="object-cover object-center opacity-45" />
      </div>
      <span className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-market-or/15 blur-3xl" aria-hidden />

      <div className="relative mx-auto w-full max-w-[1500px] px-4 py-12 md:px-6 md:py-16">
        <nav aria-label="Breadcrumb" className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-xs text-white/75 backdrop-blur-sm">
          <Link href="/" className="font-semibold text-market-gold transition-colors duration-150 hover:text-market-gold/80">
            {t("breadcrumb.home")}
          </Link>
          <ChevronRight className="h-3 w-3 text-white/40" aria-hidden />
          <span className="text-white/85">{t("breadcrumb.current")}</span>
        </nav>

        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-market-or-light">{t("hero.eyebrow")}</p>
        <h1 className="mt-2 max-w-xl font-display text-3xl font-semibold leading-tight tracking-tight md:text-[40px]">{t("hero.title")}</h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/75">{t("hero.subtitle")}</p>

        <ul className="mt-6 flex flex-wrap gap-2">
          {assurances.map(({ key, icon: Icon }) => (
            <li key={key} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-2 text-[13px] text-white/90 ring-1 ring-white/15">
              <Icon className="h-4 w-4 shrink-0 text-market-or-light" aria-hidden />
              {t(`trust.${key}`)}
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <Link href="/request/track" className="inline-flex items-center gap-2 font-semibold text-white underline-offset-4 transition-colors hover:text-market-or-light hover:underline">
            <Search className="h-4 w-4" aria-hidden />
            {t("hero.trackCta")}
          </Link>
          <Link href="/companies" className="font-medium text-white/70 underline-offset-4 transition-colors hover:text-white hover:underline">
            {t("hero.browseCta")}
          </Link>
        </div>
      </div>
    </section>
  );
}
