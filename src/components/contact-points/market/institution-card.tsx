import { MapPin, ArrowRight } from "lucide-react";
import { toExternalHref } from "@/lib/url/external-href";
import { CATEGORY_BADGE_TINT, type InstitutionCategory } from "./categories";

interface InstitutionCardProps {
  acronym: string;
  name: string;
  description: string;
  city: string | null;
  category: InstitutionCategory;
  categoryLabel: string;
  website: string | null;
  viewDetailsLabel: string;
}

/**
 * Single institution card (design 4): acronym monogram box, acronym title +
 * tinted category badge, name, 2-line description, location row, and a
 * "View Contact Details →" link (opens the website when present).
 */
export function InstitutionCard({
  acronym,
  name,
  description,
  city,
  category,
  categoryLabel,
  website,
  viewDetailsLabel,
}: InstitutionCardProps) {
  const tint = CATEGORY_BADGE_TINT[category] ?? CATEGORY_BADGE_TINT.other;

  return (
    <article className="flex flex-col rounded-lg border border-border bg-white p-4 transition-colors duration-150 hover:border-market-navy/30">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-16 shrink-0 items-center justify-center rounded-md border border-border text-sm font-bold tracking-tight text-market-navy">
          {acronym}
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold text-market-navy">{acronym}</h3>
          <span className={`mt-1 inline-block rounded px-2 py-0.5 text-[11px] font-medium ${tint}`}>
            {categoryLabel}
          </span>
        </div>
      </div>

      <p className="mt-3 text-xs font-medium text-market-navy">{name}</p>
      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{description}</p>

      {city && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>{city}</span>
        </div>
      )}

      <a
        href={toExternalHref(website) ?? "#"}
        target={website ? "_blank" : undefined}
        rel={website ? "noopener noreferrer" : undefined}
        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-market-navy transition-colors duration-150 hover:text-market-red"
      >
        {viewDetailsLabel}
        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
      </a>
    </article>
  );
}
