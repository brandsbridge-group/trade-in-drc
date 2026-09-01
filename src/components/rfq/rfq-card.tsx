"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, ArrowRight } from "lucide-react";
import { RFQ_TYPE } from "@/constants/status";

/**
 * Per-type badge styling. Labels are resolved from translations at render time
 * (RfqBoard.type.*); only the presentation class lives here.
 */
const TYPE_CLASS: Record<string, string> = {
  [RFQ_TYPE.SUPPLY]: "bg-blue-100 text-blue-800 border-blue-200",
  [RFQ_TYPE.DEMAND]: "bg-amber-100 text-amber-800 border-amber-200",
};

export interface RfqListing {
  id: string;
  title: string;
  description: string | null;
  type: string;
  expires_at: string;
  created_at: string;
  companies: {
    name: string;
    city: string | null;
    province: string | null;
    owner_id: string | null;
  } | null;
}

interface RfqCardProps {
  listing: RfqListing;
  onContact?: () => void;
  isAuthenticated?: boolean;
}

function formatDate(dateStr: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateStr));
}

export function RfqCard({ listing, onContact, isAuthenticated }: RfqCardProps) {
  const t = useTranslations("RfqFeed.card");
  const tType = useTranslations("RfqBoard.type");
  const locale = useLocale();

  const typeClassName = TYPE_CLASS[listing.type] ?? "bg-slate-100 text-slate-700";
  const typeLabel =
    listing.type === RFQ_TYPE.SUPPLY
      ? tType("supply")
      : listing.type === RFQ_TYPE.DEMAND
        ? tType("demand")
        : listing.type;

  const companyName = listing.companies?.name ?? t("unknownCompany");
  const location = [listing.companies?.city, listing.companies?.province]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="bg-card border rounded-md p-3 hover:shadow-sm hover:border-primary/40 transition-all group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 font-semibold ${typeClassName}`}
            >
              {typeLabel}
            </Badge>
            <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {listing.title}
            </h3>
          </div>

          {listing.description && (
            <p className="text-xs text-muted-foreground line-clamp-1 mb-1.5">
              {listing.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="font-medium text-foreground/80">{companyName}</span>
            {location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(listing.created_at, locale)}
            </span>
            <span className="text-muted-foreground/60">
              {t("expires", { date: formatDate(listing.expires_at, locale) })}
            </span>
          </div>
        </div>

        {isAuthenticated && onContact ? (
          <button
            type="button"
            onClick={onContact}
            className="shrink-0 text-xs text-primary font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mt-1 hover:underline"
          >
            {t("contact")}
            <ArrowRight className="w-3 h-3" />
          </button>
        ) : (
          <Link
            href="/login"
            className="shrink-0 text-xs text-primary font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mt-1"
          >
            {t("contact")}
            <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>
    </div>
  );
}
