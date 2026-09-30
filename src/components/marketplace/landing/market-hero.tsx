import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";

import { Link } from "@/i18n/routing";
import type { Locale } from "@/config/locales";
import { pickLocalized } from "@/lib/i18n/pick-localized";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { MotionEnter } from "@/components/home/motion-enter";
import { MarketAdCarousel, type AdSlide } from "./market-ad-carousel";

/** Trade in DRC's own slides — they run whenever no marketplace ad is live. */
const HOUSE_SLIDES = [
  {
    key: "offer",
    image: "/images/sectors/agriculture.webp",
    href: "/dashboard/products/new",
  },
  {
    key: "verify",
    image: "/images/hero/hero-marketplace.jpg",
    href: "/register-company",
  },
  {
    key: "advertise",
    image: "/images/hero/hero-boardroom-wide.jpg",
    href: "/pricing",
  },
] as const;

/**
 * Marketplace hero — the navy band: headline and the two publish CTAs on the
 * left; on the right the advertising carousel fed by admin slides placed on
 * "market" (carousel_slides.placement, 00048), topped up by house slides so it
 * is never empty.
 */
export async function MarketHero({ locale }: { locale: string }) {
  const t = await getTranslations("MarketLanding.hero");
  const tHouse = await getTranslations("MarketLanding.carousel.houseSlides");
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from("carousel_slides")
    .select(
      "id, title_en, title_fr, subtitle_en, subtitle_fr, image_url, cta_label_en, cta_label_fr, cta_href",
    )
    .eq("active", true)
    .eq("placement", "market")
    .order("sort_order", { ascending: true });

  const loc = locale as Locale;
  const ads: AdSlide[] = (data ?? []).map((s) => ({
    id: s.id,
    title: pickLocalized(s, "title", loc),
    subtitle: pickLocalized(s, "subtitle", loc) || null,
    imageUrl: s.image_url,
    ctaLabel: pickLocalized(s, "cta_label", loc) || null,
    ctaHref: s.cta_href,
    sponsored: true,
  }));
  const slides: AdSlide[] =
    ads.length > 0
      ? ads
      : HOUSE_SLIDES.map((h) => ({
          id: `house-${h.key}`,
          title: tHouse(`${h.key}.title`),
          subtitle: tHouse(`${h.key}.body`),
          imageUrl: h.image,
          ctaLabel: tHouse(`${h.key}.cta`),
          ctaHref: h.href,
          sponsored: false,
        }));

  return (
    <section className="relative isolate overflow-hidden bg-market-navy text-white">
      {/* Atmosphere: two soft glows + a hairline grid fading out toward the edges. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-40 -top-40 h-[480px] w-[480px] rounded-full bg-primary/40 blur-[120px]" />
        <div className="absolute -bottom-48 right-[-10%] h-[420px] w-[420px] rounded-full bg-market-or/10 blur-[120px]" />
        {/* <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_at_30%_40%,black_20%,transparent_70%)]" /> */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>

      <div className="mx-auto grid w-full max-w-7xl items-center gap-10 px-4 py-10 md:px-6 md:py-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,500px)] lg:gap-16">
        <MotionEnter>
          <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] tracking-tight md:text-5xl">
            {t("titleLead")}{" "}
            <span className="bg-gradient-to-r from-market-or to-market-or-light bg-clip-text text-transparent">
              {t("titleAccent")}
            </span>
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/70">
            {t("lead")}
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/dashboard/products/new"
              className="group inline-flex items-center gap-1.5 rounded-lg bg-market-or px-4 py-2.5 text-[13px] font-bold text-[var(--color-landing-navy)] shadow-sm transition-colors duration-150 ease-out hover:bg-market-or-dark"
            >
              {t("publishOffer")}
              <ArrowRight
                className="h-3.5 w-3.5 transition-transform duration-150 ease-out group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
            <Link
              href="/request"
              className="inline-flex items-center rounded-lg bg-white/5 px-4 py-2.5 text-[13px] font-bold text-white ring-1 ring-white/25 backdrop-blur-md transition-colors duration-150 ease-out hover:bg-white/10"
            >
              {t("publishNeed")}
            </Link>
          </div>
        </MotionEnter>

        <MarketAdCarousel slides={slides} />
      </div>
    </section>
  );
}
