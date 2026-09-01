import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";

import { Link } from "@/i18n/routing";
import { MARKET_CATEGORIES } from "@/lib/marketplace/categories";
import type { SegmentKey } from "@/lib/marketplace/segments";

/**
 * "Explore the Marketplace by Category" — the nine accent-coloured cards from
 * the customer design. Each shows a live company count so an empty category is
 * never presented as if it were full.
 */
export async function CategoryGrid({
  counts,
}: {
  counts: Record<SegmentKey, number>;
}) {
  const t = await getTranslations("MarketplacePage.categories");

  return (
    <section className="bg-white py-7">
      <div className="mx-auto w-full max-w-[1620px] px-4 md:px-6">
        <h2 className="text-center font-display text-2xl font-bold tracking-tight text-[var(--color-landing-navy)]">
          {t("heading")}
        </h2>
        <p className="mt-1 text-center text-sm text-slate-600">{t("subheading")}</p>

        {/* Nine across on very wide screens, as in the design; stepping down in
            tiers below that. Cards stay compact — the CTA is pinned to the
            bottom so every button lines up on one baseline. */}
        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5 2xl:grid-cols-9">
          {MARKET_CATEGORIES.map(({ key, Icon, text, button, href }) => (
            <article
              key={key}
              title={t("count", { count: counts[key] ?? 0 })}
              className="flex flex-col rounded-xl border border-slate-200 bg-white px-2.5 py-3.5 text-center transition-shadow duration-150 ease-out hover:shadow-md"
            >
              <Icon className={`mx-auto h-9 w-9 ${text}`} strokeWidth={1.5} aria-hidden />
              <h3 className={`mt-2.5 font-display text-[13px] font-bold leading-tight ${text}`}>
                {t(`${key}.title`)}
              </h3>
              <p className="mt-1.5 pb-3 text-[11px] leading-snug text-slate-600">
                {t(`${key}.desc`)}
              </p>
              <Link
                href={href}
                className={`mt-auto inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-lg border px-1.5 py-1.5 text-[10.5px] font-bold transition-colors duration-150 ease-out ${button}`}
              >
                {t(`${key}.cta`)}
                <ArrowRight className="h-3 w-3 flex-none" aria-hidden />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
