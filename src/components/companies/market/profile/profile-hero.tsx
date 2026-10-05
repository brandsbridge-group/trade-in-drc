"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowUpRight, BadgeCheck, Gem, MapPin, Send, Share2 } from "lucide-react";
import { toExternalHref } from "@/lib/url/external-href";
import { VERIFICATION_TIER } from "@/constants/status";
import type { CompanyProfileData } from "./types";

export interface HeroStat {
  label: string;
  value: string;
}

interface ProfileHeroProps {
  company: CompanyProfileData;
  sectorLabel: string | null;
  /** The company's own first gallery photo; a plain navy band when it has none. */
  coverUrl: string | null;
  stats: HeroStat[];
  onRequestContact: () => void;
}

/**
 * Top of the public company page: cover, logo, identity, the two actions a
 * buyer takes (ask for contact, visit the website) and the key figures. The
 * cover is the company's own photo — never a stock image.
 */
export function ProfileHero({ company, sectorLabel, coverUrl, stats, onRequestContact }: ProfileHeroProps) {
  const t = useTranslations("CompanyProfile.page");

  const location = [company.city, company.province, company.country].filter(Boolean).join(", ");
  const websiteHref = toExternalHref(company.website);
  const isPremium = company.is_premium || company.verification_tier === VERIFICATION_TIER.PREMIUM;
  const initial = company.name.trim().charAt(0).toUpperCase() || "?";
  const tradingName = company.facts.tradingName && company.facts.tradingName !== company.name ? company.facts.tradingName : null;

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: company.name, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success(t("linkCopied"));
    } catch {
      // The visitor closed the share sheet, or the clipboard is unavailable: nothing to report.
    }
  };

  return (
    <header className="overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200/70">
      <div className="relative h-36 bg-market-navy sm:h-52">
        {coverUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- owner-uploaded photo on Supabase storage */}
            <img src={coverUrl} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-market-navy/70 via-market-navy/20 to-transparent" aria-hidden />
          </>
        ) : (
          <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-market-or/25 blur-3xl" aria-hidden />
        )}
      </div>

      <div className="px-5 pb-5 sm:px-7 sm:pb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:gap-5">
            <div className="relative -mt-12 grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white ring-4 ring-white sm:-mt-14 sm:h-28 sm:w-28">
              {company.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element -- owner-uploaded logo on Supabase storage
                <img src={company.logo_url} alt={t("logoAlt", { name: company.name })} className="h-full w-full object-contain p-2" />
              ) : (
                <span className="grid h-full w-full place-items-center bg-market-navy font-display text-3xl font-semibold text-market-or-light" aria-hidden>
                  {initial}
                </span>
              )}
            </div>

            <div className="min-w-0 sm:pb-1 sm:pt-4">
              <span
                className={
                  isPremium
                    ? "inline-flex items-center gap-1.5 rounded-full bg-market-or/15 px-2.5 py-1 text-[11.5px] font-semibold text-market-or-dark"
                    : "inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11.5px] font-semibold text-emerald-700"
                }
              >
                {isPremium ? <Gem className="h-3.5 w-3.5" aria-hidden /> : <BadgeCheck className="h-3.5 w-3.5" aria-hidden />}
                {t(isPremium ? "premium" : "verified")}
              </span>
              <h1 className="mt-1.5 break-words font-display text-2xl font-semibold leading-tight tracking-tight text-market-navy sm:text-[32px]">
                {company.name}
              </h1>
              {tradingName && <p className="mt-0.5 text-sm text-slate-500">{t("tradingAs", { name: tradingName })}</p>}
              <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600">
                {sectorLabel && <span className="font-medium text-market-navy">{sectorLabel}</span>}
                {sectorLabel && location && <span className="text-slate-300" aria-hidden>·</span>}
                {location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" aria-hidden />
                    {location}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onRequestContact}
              className="inline-flex items-center gap-2 rounded-full bg-market-navy px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-market-navy-deep"
            >
              <Send className="h-4 w-4" aria-hidden />
              {t("requestContact")}
            </button>
            {websiteHref && (
              <a
                href={websiteHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-market-navy ring-1 ring-slate-200 transition-colors hover:bg-slate-50"
              >
                {t("website")}
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              </a>
            )}
            <button
              type="button"
              onClick={share}
              aria-label={t("share")}
              title={t("share")}
              className="grid h-10 w-10 place-items-center rounded-full bg-white text-market-navy ring-1 ring-slate-200 transition-colors hover:bg-slate-50"
            >
              <Share2 className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>

        {stats.length > 0 && (
          <dl className="mt-5 flex flex-wrap gap-2">
            {stats.map((stat) => (
              <div key={stat.label} className="min-w-[8.5rem] rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200/70">
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{stat.label}</dt>
                <dd className="mt-0.5 truncate font-display text-lg font-semibold text-market-navy">{stat.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </header>
  );
}
