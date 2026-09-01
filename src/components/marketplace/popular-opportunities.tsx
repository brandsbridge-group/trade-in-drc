import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";

import { Link } from "@/i18n/routing";
import type { Locale } from "@/config/locales";
import { pickLocalized } from "@/lib/i18n/pick-localized";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const HOW_MANY = 3;

/** Sector-appropriate stand-in art, cropped from the customer's design file. */
const SECTOR_IMAGE: { match: RegExp; src: string }[] = [
  { match: /energ|oil|gas/i, src: "/images/marketplace/opp-energy.jpg" },
  { match: /agri|food|forest|timber/i, src: "/images/marketplace/opp-agriculture.jpg" },
  { match: /construc|mining|mineral|manufact/i, src: "/images/marketplace/opp-construction.jpg" },
];

function imageForSector(sector: string | null): string {
  return (
    SECTOR_IMAGE.find((s) => sector && s.match.test(sector))?.src ??
    "/images/marketplace/opp-energy.jpg"
  );
}

interface OpportunityRow {
  id: string;
  slug: string;
  category: string;
  region: string | null;
  title_en: string | null;
  title_fr: string | null;
  title_es: string | null;
  title_tr: string | null;
  title_zh: string | null;
  sectors: { name_en: string | null; name_fr: string | null; name_es: string | null; name_tr: string | null; name_zh: string | null } | null;
}

/**
 * "Popular Business Opportunities" — the middle card of the bottom band. Rows
 * are real published opportunities, newest first, linking into the board.
 */
export async function PopularOpportunities({ locale }: { locale: string }) {
  const t = await getTranslations("MarketplacePage.opportunities");
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from("opportunities")
    .select(
      "id, slug, category, region, title_en, title_fr, title_es, title_tr, title_zh, sectors(name_en, name_fr, name_es, name_tr, name_zh)"
    )
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(HOW_MANY);

  const rows = (data ?? []) as unknown as OpportunityRow[];

  // A category added in the database later must not blow up the page, so fall
  // back to the raw key instead of throwing on a missing message.
  const needLabel = (category: string) =>
    t.has(`needs.${category}`) ? t(`needs.${category}`) : category.replace(/_/g, " ");

  return (
    <section className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="font-display text-lg font-bold text-[var(--color-landing-navy)]">
          {t("heading")}
        </h2>
        <Link
          href="/opportunities"
          className="inline-flex items-center gap-1 text-[12px] font-semibold text-primary transition-colors duration-150 ease-out hover:text-[#003a8c]"
        >
          {t("viewAll")}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-slate-500">{t("empty")}</p>
      ) : (
        <ul className="space-y-2.5">
          {rows.map((o) => {
            const sector = o.sectors
              ? pickLocalized(o.sectors, "name", locale as Locale)
              : null;
            return (
              <li
                key={o.id}
                className="flex items-center gap-3 rounded-lg border border-slate-200 p-2.5"
              >
                <Image
                  src={imageForSector(sector)}
                  alt=""
                  width={280}
                  height={191}
                  className="h-14 w-20 flex-none rounded-md object-cover"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-[13px] font-bold text-[var(--color-landing-navy)]">
                    {pickLocalized(o, "title", locale as Locale)}
                  </h3>
                  <p className="mt-0.5 truncate text-[11.5px] text-slate-500">
                    {t("sector")}: {sector ?? "—"}
                    <span className="mx-1.5 text-slate-300">|</span>
                    {t("need")}: {needLabel(o.category)}
                  </p>
                  <p className="text-[11.5px] text-slate-500">
                    <span className="font-semibold text-slate-600">{t("location")}:</span>{" "}
                    {o.region ?? t("countryWide")}
                  </p>
                </div>
                <div className="flex flex-none flex-col items-end gap-1.5">
                  <span className="rounded-md border border-emerald-500/40 px-2 py-0.5 text-[10.5px] font-bold text-emerald-600">
                    {t("open")}
                  </span>
                  <Link
                    href={`/opportunities/${o.category}/${o.slug}`}
                    className="rounded-md border border-primary/40 px-2.5 py-1 text-[11px] font-bold text-primary transition-colors duration-150 ease-out hover:bg-primary/5"
                  >
                    {t("viewDetails")}
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
