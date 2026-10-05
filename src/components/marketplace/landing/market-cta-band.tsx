import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/routing";

/**
 * Closing band: publish an offer (self-serve) or a need (team-run search).
 * The home hero's port/mining photo is mask-faded into the navy on the right.
 */
export async function MarketCtaBand() {
  const t = await getTranslations("MarketLanding.cta");

  return (
    <section className="relative isolate overflow-hidden bg-[var(--color-landing-navy)]">
      <div className="pointer-events-none absolute inset-y-0 right-0 -z-10 hidden w-[40%] opacity-60 md:block [mask-image:linear-gradient(to_left,black_30%,transparent)]">
        <Image src="/images/home/hero-right.jpg" alt="" fill sizes="40vw" className="object-cover" />
      </div>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-8 md:flex-row md:items-center md:justify-between md:px-6">
        <div>
          <h2 className="font-display text-xl font-bold text-white md:text-[22px]">{t("heading")}</h2>
          <p className="mt-1.5 text-sm text-white/80">{t("body")}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/products/new"
            className="rounded-full border border-white/30 bg-white/5 px-5 py-2.5 text-[13px] font-bold text-white backdrop-blur-sm transition-colors duration-150 ease-out hover:bg-white/15"
          >
            {t("publishOffer")}
          </Link>
          <Link
            href="/request"
            className="rounded-full bg-market-or px-5 py-2.5 text-[13px] font-bold text-[var(--color-landing-navy)] transition-colors duration-150 ease-out hover:bg-market-or-light active:bg-market-or-dark"
          >
            {t("publishNeed")}
          </Link>
        </div>
      </div>
    </section>
  );
}
