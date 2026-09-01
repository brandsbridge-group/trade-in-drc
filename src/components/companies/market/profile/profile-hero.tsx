"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { MapPin, Globe, FileCheck2, Globe2, CalendarClock, Heart, BadgeCheck, Gem } from "lucide-react";
import { SkeletonImage } from "@/components/design";
import { cn } from "@/lib/utils";
import { toExternalHref, toDisplayHost } from "@/lib/url/external-href";
import { VERIFICATION_TIER } from "@/constants/status";
import type { CompanyProfileData } from "./types";

const FACILITY_FALLBACK = "/images/companies/profile-facility.jpg";

interface ProfileHeroProps {
  company: CompanyProfileData;
  subtitle: string | null;
  onRequestIntro: () => void;
}

/**
 * Company hero card (design 5): logo tile · identity block · facility photo ·
 * vertical action stack. Premium companies get the gold "Premium Verified Local
 * Partner" pill; otherwise verified companies get a green "Verified Company"
 * pill. The "Available for International Partnerships" chip appears only when the
 * company declares export markets.
 */
export function ProfileHero({ company, subtitle, onRequestIntro }: ProfileHeroProps) {
  const t = useTranslations("CompanyProfile");
  const [saved, setSaved] = useState(false);

  // Companies can be registered outside the DRC, so the country comes from the
  // record rather than being assumed.
  const location = [company.city, company.province, company.country]
    .filter(Boolean)
    .join(", ");
  const websiteHref = toExternalHref(company.website);
  const isPremium =
    company.is_premium || company.verification_tier === VERIFICATION_TIER.PREMIUM;
  const isVerified =
    company.verification_tier === VERIFICATION_TIER.VERIFIED ||
    company.verification_tier === VERIFICATION_TIER.PREMIUM;
  const initials = company.name.trim().charAt(0).toUpperCase() || "?";

  return (
    <section className="rounded-lg border border-market-navy/10 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
        {/* Logo tile */}
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-md border border-market-navy/15 bg-white sm:h-28 sm:w-28">
          {company.logo_url ? (
            <SkeletonImage
              src={company.logo_url}
              alt={company.name}
              wrapperClassName="h-full w-full"
              className="object-contain"
            />
          ) : (
            <span className="font-display text-3xl font-bold text-market-navy/70">{initials}</span>
          )}
        </div>

        {/* Identity block */}
        <div className="min-w-0 flex-1">
          {isPremium ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-market-gold/50 bg-market-gold/10 px-2.5 py-1 text-[11px] font-semibold text-market-navy">
              <Gem className="h-3.5 w-3.5 text-market-gold" />
              {t("hero.premiumBadge")}
            </span>
          ) : isVerified ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
              <BadgeCheck className="h-3.5 w-3.5" />
              {t("hero.verifiedBadge")}
            </span>
          ) : null}

          <h1 className="mt-2 font-display text-2xl font-bold leading-tight text-market-navy sm:text-[1.7rem]">
            {company.name}
          </h1>
          {subtitle && (
            <p className="mt-0.5 text-sm font-semibold text-market-navy/70">{subtitle}</p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-market-navy/70">
            {location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-market-red" />
                {location}
              </span>
            )}
            {websiteHref && (
              <a
                href={websiteHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-market-navy underline-offset-2 transition-colors duration-150 hover:text-market-red hover:underline"
              >
                <Globe className="h-3.5 w-3.5" />
                {toDisplayHost(company.website)}
              </a>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-market-navy/20 bg-market-navy/5 px-2 py-1 text-[11px] font-medium text-market-navy">
              <FileCheck2 className="h-3.5 w-3.5" />
              {t("hero.docsReviewed")}
            </span>
            {company.markets.length > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700">
                <Globe2 className="h-3.5 w-3.5" />
                {t("hero.availableIntl")}
              </span>
            )}
          </div>
        </div>

        {/* Facility photo */}
        <div className="hidden h-32 w-56 shrink-0 overflow-hidden rounded-md border border-market-navy/10 xl:block">
          <SkeletonImage
            src={FACILITY_FALLBACK}
            alt={t("hero.facilityAlt")}
            wrapperClassName="h-full w-full"
            className="object-cover"
          />
        </div>

        {/* Action stack */}
        <div className="flex shrink-0 flex-col gap-2 lg:w-52">
          <button
            type="button"
            onClick={onRequestIntro}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-market-gold px-3 py-2.5 text-sm font-semibold text-market-navy shadow-sm transition-colors duration-150 hover:bg-market-gold/90"
          >
            <Gem className="h-4 w-4" />
            {t("hero.requestIntro")}
          </button>
          <button
            type="button"
            onClick={onRequestIntro}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-market-navy/20 bg-white px-3 py-2.5 text-sm font-medium text-market-navy transition-colors duration-150 hover:bg-market-navy/5"
          >
            <CalendarClock className="h-4 w-4" />
            {t("hero.scheduleMeeting")}
          </button>
          <button
            type="button"
            aria-pressed={saved}
            onClick={() => setSaved((s) => !s)}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-market-navy/20 bg-white px-3 py-2.5 text-sm font-medium text-market-navy transition-colors duration-150 hover:bg-market-navy/5"
          >
            <Heart className={cn("h-4 w-4", saved && "fill-market-red text-market-red")} />
            {saved ? t("hero.saved") : t("hero.saveCompany")}
          </button>
        </div>
      </div>
    </section>
  );
}
