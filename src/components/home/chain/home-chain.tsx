import { getTranslations } from "next-intl/server";
import { ArrowUpRight, Building2, FileCheck2, Landmark, Ship } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Link } from "@/i18n/routing";
import type { SegmentKey } from "@/lib/supabase/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { MotionEnter } from "@/components/home/motion-enter";
import { HomeSection, HomeSectionHeader } from "@/components/home/home-section";

/**
 * The four service trades of the chain, with the market's own labels
 * (MarketLanding.services) and chain pages. `segment` is the company_segments
 * key; institutions come from their own table.
 */
const TRADES: { key: string; href: string; Icon: LucideIcon; segment: SegmentKey | null }[] = [
  { key: "logistics", href: "/market/logistics", Icon: Ship, segment: "logistics" },
  { key: "finance", href: "/market/finance", Icon: Landmark, segment: "finance" },
  { key: "compliance", href: "/market/facilitation", Icon: FileCheck2, segment: "facilitation" },
  { key: "institutions", href: "/market/institutions", Icon: Building2, segment: null },
];

/** Verified providers per segment, and the number of listed institutions. */
async function loadCounts(): Promise<Record<string, number>> {
  const supabase = await createServerSupabaseClient();
  const segments = TRADES.flatMap((t) => (t.segment ? [t.segment] : []));
  const [segmentRows, institutions] = await Promise.all([
    supabase
      .from("company_segments")
      .select("segment_key, company:companies!inner(status)")
      .in("segment_key", segments)
      .eq("company.status", "verified"),
    // `institutions` isn't in the typed schema (see chain-page.tsx).
    (supabase as unknown as {
      from(t: string): {
        select(c: string, o: { count: "exact"; head: true }): Promise<{ count: number | null }>;
      };
    })
      .from("institutions")
      .select("id", { count: "exact", head: true }),
  ]);

  const counts: Record<string, number> = { institutions: institutions.count ?? 0 };
  for (const row of (segmentRows.data ?? []) as { segment_key: string }[]) {
    counts[row.segment_key] = (counts[row.segment_key] ?? 0) + 1;
  }
  return counts;
}

/**
 * Homepage section 6 — "The complete chain": the trades a cross-border sale
 * needs (transport, finance, compliance, institutions), each with its live
 * number of providers and a link to its chain page.
 */
export async function HomeChain({ locale }: { locale: string }) {
  const [t, tServices, counts] = await Promise.all([
    getTranslations({ locale, namespace: "HomeChain" }),
    getTranslations({ locale, namespace: "MarketLanding.services" }),
    loadCounts(),
  ]);

  return (
    <HomeSection id="chain">
      <MotionEnter>
        <HomeSectionHeader eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} />
      </MotionEnter>

      <ul className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {TRADES.map(({ key, href, Icon, segment }) => {
          const count = counts[segment ?? "institutions"] ?? 0;
          const label =
            count === 0 ? t("soon") : segment ? t("providers", { count }) : t("institutions", { count });
          return (
            <li key={key}>
              <MotionEnter className="h-full">
                <Link
                  href={href}
                  className="group flex h-full flex-col rounded-[1.25rem] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-200/70 transition-[box-shadow] duration-150 ease-out hover:shadow-lg hover:shadow-slate-900/[0.06] hover:ring-slate-300 sm:p-5"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-market-or/10 text-market-or-dark ring-1 ring-inset ring-market-or/25 transition-colors duration-150 ease-out group-hover:bg-market-or/20">
                    <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
                  </span>
                  <span className="mt-4 text-[15px] font-bold text-[var(--color-landing-navy)]">
                    {tServices(`${key}.eyebrow`)}
                  </span>
                  <span className="mt-0.5 flex-1 text-[13px] leading-snug text-slate-500">
                    {tServices(`${key}.title`)}
                  </span>
                  <span className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs">
                    <span className={count === 0 ? "text-slate-400" : "font-semibold text-slate-700"}>{label}</span>
                    <ArrowUpRight
                      className="h-3.5 w-3.5 flex-none text-market-or-dark transition-transform duration-150 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </span>
                </Link>
              </MotionEnter>
            </li>
          );
        })}
      </ul>
    </HomeSection>
  );
}
