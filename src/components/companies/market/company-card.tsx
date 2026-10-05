import { Link } from "@/i18n/routing";
import { ArrowRight, BadgeCheck, CalendarDays, Gem, MapPin, Package } from "lucide-react";

export interface DirectoryCompany {
  id: string;
  name: string;
  logo_url: string | null;
  /** The company's own first gallery photo; a navy band when it has none. */
  cover_url: string | null;
  description: string | null;
  premium: boolean;
  city: string | null;
  province: string | null;
  country: string | null;
  sectorLabel: string;
  productCount: number;
  yearEstablished: string | null;
}

export interface CardLabels {
  verified: string;
  premium: string;
  view: string;
  /** Accessible name of the whole-card link. */
  open: string;
  /** Already formatted for this company ("3 produits"); null when it has none. */
  products: string | null;
  /** Already formatted ("Depuis 2014"); null when unknown. */
  founded: string | null;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join("")
    .toUpperCase();
}

/**
 * One company in the directory grid: cover photo, logo, tier badge, sector and
 * place, a two-line presentation and the facts on file (products, year). The
 * whole card is one link to the public profile.
 */
export function CompanyCard({ company, labels }: { company: DirectoryCompany; labels: CardLabels }) {
  // City first; the country only when there is no province to place it.
  const location = [company.city, company.province ?? company.country].filter(Boolean).join(", ");

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200/70 transition-colors duration-150 hover:ring-market-navy/40">
      <div className={company.cover_url ? "relative h-28 bg-slate-100" : "relative h-20 overflow-hidden bg-market-cream"}>
        {company.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- owner-uploaded photo on Supabase storage
          <img src={company.cover_url} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="absolute -right-6 -top-10 h-28 w-28 rounded-full bg-market-or/30 blur-2xl" aria-hidden />
        )}
        <span
          className={
            company.premium
              ? "absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-market-or px-2.5 py-1 text-[11px] font-semibold text-market-navy"
              : "absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-slate-200/70"
          }
        >
          {company.premium ? <Gem className="h-3 w-3" aria-hidden /> : <BadgeCheck className="h-3 w-3" aria-hidden />}
          {company.premium ? labels.premium : labels.verified}
        </span>
      </div>

      <div className="flex flex-1 flex-col px-5 pb-5">
        <div className="relative -mt-8 grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200/70">
          {company.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- owner-uploaded logo on Supabase storage
            <img src={company.logo_url} alt="" loading="lazy" className="h-full w-full object-contain p-1.5" />
          ) : (
            <span className="grid h-full w-full place-items-center bg-market-navy font-display text-lg font-semibold text-market-or-light" aria-hidden>
              {initials(company.name)}
            </span>
          )}
        </div>

        <h3 className="mt-3 font-display text-[17px] font-semibold leading-snug text-market-navy">
          <Link
            href={`/companies/${company.id}`}
            aria-label={labels.open}
            className="after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:rounded-2xl focus-visible:after:ring-2 focus-visible:after:ring-market-navy"
          >
            <span className="line-clamp-2">{company.name}</span>
          </Link>
        </h3>
        {company.sectorLabel && <p className="mt-1 text-[13px] font-medium text-market-or-dark">{company.sectorLabel}</p>}
        {location && (
          <p className="mt-1 flex items-center gap-1 text-[13px] text-slate-500">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
            <span className="truncate">{location}</span>
          </p>
        )}

        {company.description && <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-slate-600">{company.description}</p>}

        <div className="mt-auto pt-4">
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            {labels.products && (
              <span className="inline-flex items-center gap-1">
                <Package className="h-3.5 w-3.5 text-slate-400" aria-hidden />
                {labels.products}
              </span>
            )}
            {labels.founded && (
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5 text-slate-400" aria-hidden />
                {labels.founded}
              </span>
            )}
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 font-semibold text-market-navy" aria-hidden>
            {labels.view}
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
        </div>
      </div>
    </article>
  );
}
