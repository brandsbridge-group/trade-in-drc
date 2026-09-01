import Image from "next/image";
import { Link } from "@/i18n/routing";
import { MapPin, BadgeCheck, Crown, ArrowRight } from "lucide-react";
import { VERIFICATION_TIER } from "@/constants/status";

export interface DirectoryCompany {
  id: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  verification_tier: string | null;
  is_premium: boolean;
  city: string | null;
  province: string | null;
  sectorLabel: string;
}

export interface CardLabels {
  verifiedPill: string;
  premiumPill: string;
  viewProfile: string;
}

function isPremium(company: DirectoryCompany): boolean {
  return company.verification_tier === VERIFICATION_TIER.PREMIUM || company.is_premium;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join("")
    .toUpperCase();
}

/**
 * Compact vertical company card for the verified directory grid (customer
 * design 7). Circular logo/monogram, name with a green check (verified) or gold
 * crown (premium), sector + location lines, 2-line blurb, then a tier pill and a
 * navy "View Profile →" button.
 */
export function CompanyCard({
  company,
  labels,
}: {
  company: DirectoryCompany;
  labels: CardLabels;
}) {
  const premium = isPremium(company);
  const location = [company.city, company.province].filter(Boolean).join(", ");

  return (
    <article className="flex flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-shadow duration-150 hover:shadow-md">
      <div className="flex items-start gap-3">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full ring-1 ring-slate-200">
          {company.logo_url ? (
            <Image
              src={company.logo_url}
              alt=""
              fill
              sizes="56px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-market-navy/5 font-display text-sm font-bold text-market-navy">
              {initials(company.name)}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-semibold text-market-navy">{company.name}</h3>
            {premium ? (
              <Crown className="h-4 w-4 shrink-0 text-market-gold" aria-hidden />
            ) : (
              <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
            )}
          </div>
          {company.sectorLabel && (
            <p className="mt-0.5 truncate text-xs font-medium text-blue-600">
              {company.sectorLabel}
            </p>
          )}
          {location && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
              <MapPin className="h-3 w-3 shrink-0" aria-hidden />
              <span className="truncate">{location}</span>
            </p>
          )}
        </div>
      </div>

      {company.description && (
        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-500">
          {company.description}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
            premium ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {premium ? (
            <Crown className="h-3 w-3" aria-hidden />
          ) : (
            <BadgeCheck className="h-3 w-3" aria-hidden />
          )}
          {premium ? labels.premiumPill : labels.verifiedPill}
        </span>
        <Link
          href={`/companies/${company.id}`}
          className="inline-flex items-center gap-1 rounded-md bg-market-navy px-3 py-1.5 text-xs font-medium text-white transition-colors duration-150 hover:bg-market-navy-deep"
        >
          {labels.viewProfile}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
    </article>
  );
}
