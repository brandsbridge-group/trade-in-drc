import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, BadgeCheck, Clock, Images, MapPin } from "lucide-react";

import { Link } from "@/i18n/routing";
import { pricingDisplay, type ProductPricing } from "@/lib/products/pricing";

export interface OfferCardData {
  id: string;
  name: string;
  /** The seller's description, shortened; clamped to two lines on the card. */
  excerpt?: string | null;
  /** Photos the seller uploaded (0 when the visual is illustrative). */
  photoCount?: number;
  /** The product's own price and minimum order (00064); nothing is printed when neither is stated. */
  pricing?: ProductPricing | null;
  category: string | null;
  verified: boolean;
  supplier: string;
  supplierLogo: string | null;
  supplierInitials: string;
  location: string | null;
  /** Product photo, or the category's sector artwork when `illustrative`. */
  visual: { src: string; illustrative: boolean };
  /** Up to three label/value facts shown under the divider. */
  facts: { label: string; value: string }[];
}

/**
 * Marketplace offer card. The title's link is stretched over the whole card
 * (after:inset-0) so everything is clickable, while the CTA sits above it.
 * Hover: shadow + border (§2.1) and a 1.02 photo settle (§2.6).
 */
export function OfferCard({ offer }: { offer: OfferCardData }) {
  const t = useTranslations("MarketProducts.card");
  const tPricing = useTranslations("ProductPricing");
  const locale = useLocale();
  const pricing = offer.pricing ? pricingDisplay(offer.pricing, tPricing, locale) : null;
  const href = `/products/${offer.id}`;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-[box-shadow,border-color] duration-150 ease-out hover:border-slate-300 hover:shadow-lg">
      <div className="relative aspect-[2/1] overflow-hidden bg-slate-100">
        {offer.visual.illustrative ? (
          <Image
            src={offer.visual.src}
            alt=""
            fill
            sizes="(min-width: 1280px) 320px, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02]"
          />
        ) : (
          // Supplier uploads live on arbitrary storage hosts.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={offer.visual.src}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02]"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-slate-950/0 to-slate-950/10" />

        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          {offer.category && (
            <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--color-landing-navy)] shadow-sm backdrop-blur-md">
              {offer.category}
            </span>
          )}
          {offer.verified ? (
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white shadow-sm">
              <BadgeCheck className="h-3 w-3" aria-hidden />
              {t("verified")}
            </span>
          ) : (
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-1 text-[10px] font-bold text-white shadow-sm">
              <Clock className="h-3 w-3" aria-hidden />
              {t("pending")}
            </span>
          )}
        </div>
        {offer.visual.illustrative && (
          <span className="absolute bottom-2 right-3 text-[10px] font-medium text-white/70">
            {t("illustrative")}
          </span>
        )}
        {(offer.photoCount ?? 0) > 1 && (
          <span className="absolute bottom-2 left-3 inline-flex items-center gap-1 rounded-full bg-slate-950/55 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
            <Images className="h-3 w-3" aria-hidden />
            {t("photos", { count: offer.photoCount ?? 0 })}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-2.5">
          {offer.supplierLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={offer.supplierLogo}
              alt=""
              className="h-8 w-8 flex-none rounded-full bg-white object-contain ring-1 ring-slate-200"
            />
          ) : (
            <span
              aria-hidden
              className="grid h-8 w-8 flex-none place-items-center rounded-full bg-[var(--color-landing-navy)] text-[11px] font-bold text-white"
            >
              {offer.supplierInitials}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-slate-800">{offer.supplier}</p>
            {offer.location && (
              <p className="flex items-center gap-1 truncate text-[11px] text-slate-500">
                <MapPin className="h-3 w-3 flex-none" aria-hidden />
                {offer.location}
              </p>
            )}
          </div>
        </div>

        <h3 className="mt-3 font-display text-[15px] font-bold leading-snug text-[var(--color-landing-navy)]">
          <Link
            href={href}
            className="transition-colors duration-150 ease-out after:absolute after:inset-0 after:content-[''] group-hover:text-primary"
          >
            {offer.name}
          </Link>
        </h3>

        {pricing && (pricing.price || pricing.minOrder) && (
          <p className="mt-1.5 flex flex-wrap items-baseline gap-x-1.5 text-xs text-slate-500">
            {pricing.price && (
              <span>
                <span className="text-[15px] font-bold tabular-nums text-[var(--color-landing-navy)]">{pricing.price}</span>{" "}
                {tPricing("perUnit", { unit: pricing.unit ?? "" })}
              </span>
            )}
            {pricing.price && pricing.minOrder && <span aria-hidden>·</span>}
            {pricing.minOrder && <span>{tPricing("minShort", { quantity: pricing.minOrder })}</span>}
          </p>
        )}

        {offer.excerpt && (
          <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-slate-600">{offer.excerpt}</p>
        )}

        {offer.facts.length > 0 && (
          <dl className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-2.5">
            {offer.facts.map((f) => (
              <div key={f.label} className="min-w-0">
                <dt className="truncate text-[10px] font-medium uppercase tracking-wide text-slate-500">
                  {f.label}
                </dt>
                <dd className="mt-0.5 line-clamp-2 text-[13px] font-semibold text-slate-800">
                  {f.value}
                </dd>
              </div>
            ))}
          </dl>
        )}

        <div className="mt-auto flex items-center justify-between pt-4">
          <Link
            href={href}
            className="relative z-10 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-[13px] font-bold text-white transition-colors duration-150 ease-out hover:bg-[#003a8c]"
          >
            {t("request")}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </div>
    </article>
  );
}
