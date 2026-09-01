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

      <div className="relative mx-auto w-full max-w-[1500px] px-4 py-10 md:px-6 md:py-14">
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-xs">
          <Link href="/" className="text-market-gold transition-colors duration-150 hover:text-market-gold/80">
            {breadcrumbHome}
          </Link>
          <ChevronRight className="size-3 text-white/50" aria-hidden />
          <span className="text-white/80">{breadcrumbCurrent}</span>
        </nav>

        <h1 className="max-w-xl font-display text-3xl font-bold tracking-tight md:text-[2.5rem] md:leading-[1.1]">
          {title}
        </h1>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/85">
          {subtitle}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href="#request-form"
            className="inline-flex items-center gap-2 rounded-md bg-market-gold px-5 py-2.5 text-sm font-semibold text-market-navy transition-colors duration-150 hover:bg-market-gold/90"
          >
            {submitCta}
            <ArrowRight className="size-4" aria-hidden />
          </a>
          <Link
            href="/companies"
            className="inline-flex items-center gap-2 rounded-md border border-white/40 px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-white/10"
          >
            {browseCta}
          </Link>
        </div>
      </div>
    </section>
  );
}
