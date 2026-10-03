import Image from "next/image";
import { ArrowRight, ChevronRight } from "lucide-react";

import { Link } from "@/i18n/routing";

const HERO_IMAGE = "/images/request/hero-handshake.jpg";

interface FindPartnerHeroProps {
  breadcrumbHome: string;
  breadcrumbCurrent: string;
  title: string;
  subtitle: string;
  submitCta: string;
  browseCta: string;
}

/**
 * Design-10 hero: full-bleed handshake photo on the right, left-weighted navy
 * overlay carrying the breadcrumb, headline, intro copy and the two CTAs.
 * Static/presentational — strings arrive already localized from the page.
 */
export function FindPartnerHero({
  breadcrumbHome,
  breadcrumbCurrent,
  title,
  subtitle,
  submitCta,
  browseCta,
}: FindPartnerHeroProps) {
  return (
    <section className="relative overflow-hidden bg-market-navy text-white">
      <Image
        src={HERO_IMAGE}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-right"
      />
      {/* Left-weighted navy overlay keeps the copy legible over the photo. */}
      <div className="absolute inset-0 bg-gradient-to-r from-market-navy via-market-navy/90 to-market-navy/10" />

      <div className="relative mx-auto w-full max-w-[1500px] px-4 py-12 md:px-6 md:py-16">
        <nav aria-label="Breadcrumb" className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-xs text-white/75 backdrop-blur-sm">
          <Link href="/" className="font-semibold text-market-gold transition-colors duration-150 hover:text-market-gold/80">
            {breadcrumbHome}
          </Link>
          <ChevronRight className="size-3 text-white/50" aria-hidden />
          <span className="text-white/80">{breadcrumbCurrent}</span>
        </nav>

        <h1 className="max-w-2xl font-display text-3xl font-bold leading-[1.12] md:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-white/85 md:text-base md:leading-7">
          {subtitle}
        </p>

        <div className="mt-7 flex flex-wrap gap-3">
          <a
            href="#request-form"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-market-gold px-5 text-sm font-semibold text-market-navy shadow-[0_12px_28px_-18px_rgba(245,188,72,0.8)] transition-colors duration-150 hover:bg-market-gold/90"
          >
            {submitCta}
            <ArrowRight className="size-4" aria-hidden />
          </a>
          <Link
            href="/companies"
            className="inline-flex h-11 items-center gap-2 rounded-full border border-white/35 bg-white/[0.04] px-5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-white/10"
          >
            {browseCta}
          </Link>
        </div>
      </div>
    </section>
  );
}
