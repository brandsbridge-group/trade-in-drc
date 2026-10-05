import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowRight, Building2, Home, Mail, Search, ShoppingBag, Target } from "lucide-react";
import { Link } from "@/i18n/routing";
import { BLUR } from "@/components/home/landing/blur-data";
import { BackButton } from "@/components/layout/back-button";

export async function generateMetadata() {
  const t = await getTranslations("NotFound");
  return { title: t("metaTitle"), robots: { index: false } };
}

/**
 * 404 for a route under a language prefix that calls `notFound()`. An address
 * that matches no route at all gets the simpler `app/not-found.tsx` instead:
 * do NOT add a `[locale]/[...rest]` catch-all to route those here — it took
 * over every page inside a route group (`(auth)`, `(public)`: login, signup,
 * pricing, services, request…) and served them this 404 (removed 2026-10-05).
 * It says what happened in plain words, then offers the three ways out a lost
 * visitor needs — search, go back, or pick a section. The dashboard and the
 * console hide the site's navbar and footer, so the page stands on its own.
 */
export default async function NotFound() {
  const [t, locale] = await Promise.all([getTranslations("NotFound"), getLocale()]);

  const links = [
    { key: "market", href: "/market", icon: ShoppingBag },
    { key: "companies", href: "/companies", icon: Building2 },
    { key: "opportunities", href: "/opportunities", icon: Target },
    { key: "contact", href: "/contact", icon: Mail },
  ] as const;

  return (
    <main>
      <section className="relative isolate overflow-hidden bg-market-navy text-white">
        {/* Same DRC network map as the homepage's closing band; its square edges fade into the navy. */}
        <div
          className="pointer-events-none absolute inset-y-0 right-0 hidden w-[58%] md:block [mask-image:radial-gradient(ellipse_at_60%_50%,black_36%,transparent_72%)]"
          aria-hidden
        >
          <Image
            src="/images/landing/drc-map.webp"
            alt=""
            fill
            sizes="(min-width: 768px) 58vw, 0px"
            placeholder="blur"
            blurDataURL={BLUR.drcMap}
            className="scale-[1.3] object-contain opacity-80 mix-blend-lighten"
          />
        </div>

        <div className="relative mx-auto w-full max-w-6xl px-4 py-16 md:py-24">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-market-or-light">{t("eyebrow")}</p>
          <p className="mt-2 font-display text-[88px] font-semibold leading-none tracking-tight text-white/15 md:text-[128px]" aria-hidden>
            404
          </p>
          <h1 className="-mt-3 max-w-xl font-display text-3xl font-semibold leading-tight tracking-tight md:-mt-5 md:text-[40px]">{t("title")}</h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/75">{t("body")}</p>

          {/* A plain GET form to the site search: works without JavaScript. */}
          <form action={`/${locale}/search`} method="get" role="search" className="mt-7 flex max-w-xl items-center gap-2 rounded-full bg-white p-1.5 pl-5">
            <Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
            <input
              type="search"
              name="q"
              required
              aria-label={t("searchLabel")}
              placeholder={t("searchPlaceholder")}
              maxLength={80}
              className="min-w-0 flex-1 bg-transparent py-2 text-sm text-market-navy outline-none placeholder:text-slate-400"
            />
            <button
              type="submit"
              className="shrink-0 rounded-full bg-market-navy px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-market-navy-deep"
            >
              {t("searchButton")}
            </button>
          </form>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full bg-market-or px-5 py-2.5 text-sm font-semibold text-market-navy transition-colors hover:bg-market-or-light"
            >
              <Home className="h-4 w-4" aria-hidden />
              {t("home")}
            </Link>
            <BackButton label={t("back")} />
          </div>
        </div>
      </section>

      <section aria-labelledby="not-found-links" className="bg-slate-50">
        <div className="mx-auto w-full max-w-6xl px-4 py-10">
          <h2 id="not-found-links" className="font-display text-lg font-semibold text-market-navy">{t("linksTitle")}</h2>
          <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {links.map(({ key, href, icon: Icon }) => (
              <li key={key}>
                <Link
                  href={href}
                  className="group flex h-full items-start gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200/70 transition-colors hover:ring-market-navy/40"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-market-cream text-market-navy" aria-hidden>
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2 text-sm font-semibold text-market-navy">
                      {t(`links.${key}.title`)}
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-400 transition-colors group-hover:text-market-navy" aria-hidden />
                    </span>
                    <span className="mt-0.5 block text-[13px] leading-snug text-slate-600">{t(`links.${key}.body`)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
